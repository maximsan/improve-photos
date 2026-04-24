import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computeBlurScore } from '../../src/main/ipc/quality'

// ─── Sharp mock ───────────────────────────────────────────────────────────────

const { mockToBuffer, mockStats, sharpChain } = vi.hoisted(() => {
  const mockToBuffer = vi.fn()
  const mockStats = vi.fn()
  const sharpChain = {
    greyscale: vi.fn().mockReturnThis(),
    resize: vi.fn().mockReturnThis(),
    raw: vi.fn().mockReturnThis(),
    blur: vi.fn().mockReturnThis(),
    toBuffer: mockToBuffer,
    stats: mockStats
  }
  return { mockToBuffer, mockStats, sharpChain }
})

vi.mock('sharp', () => ({ default: vi.fn().mockReturnValue(sharpChain) }))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uniformBuffer(value: number, length: number): Buffer {
  return Buffer.alloc(length, value)
}

function checkerBuffer(width: number, height: number): Buffer {
  const buf = Buffer.alloc(width * height)
  for (let i = 0; i < buf.length; i++) {
    buf[i] = i % 2 === 0 ? 255 : 0
  }
  return buf
}

// ─── computeBlurScore ─────────────────────────────────────────────────────────

describe('computeBlurScore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sharpChain.greyscale.mockReturnThis()
    sharpChain.resize.mockReturnThis()
    sharpChain.raw.mockReturnThis()
    sharpChain.blur.mockReturnThis()
  })

  it('returns a non-negative number for a typical image', async () => {
    mockToBuffer.mockResolvedValue({
      data: checkerBuffer(32, 32),
      info: { width: 32, height: 32, channels: 1 }
    })
    // Blurring always reduces stdev → original ≥ blurred → score ≥ 0
    mockStats
      .mockResolvedValueOnce({ channels: [{ stdev: 50 }] })
      .mockResolvedValueOnce({ channels: [{ stdev: 30 }] })
    const score = await computeBlurScore('/any/file.jpg')
    expect(score).toBeGreaterThanOrEqual(0)
  })

  it('sharp image scores higher than blurry image', async () => {
    mockToBuffer.mockResolvedValue({
      data: uniformBuffer(128, 32 * 32),
      info: { width: 32, height: 32, channels: 1 }
    })
    // Blurry: small stdev drop when blurred further
    // Sharp: large stdev drop when blurred
    mockStats
      .mockResolvedValueOnce({ channels: [{ stdev: 10 }] })
      .mockResolvedValueOnce({ channels: [{ stdev: 9 }] })
      .mockResolvedValueOnce({ channels: [{ stdev: 80 }] })
      .mockResolvedValueOnce({ channels: [{ stdev: 30 }] })
    const blurryScore = await computeBlurScore('/blurry.jpg')
    const sharpScore = await computeBlurScore('/sharp.jpg')
    expect(blurryScore).toBeLessThan(sharpScore)
  })

  it('calls sharp with the correct pipeline (greyscale → resize → raw → toBuffer → stats)', async () => {
    mockToBuffer.mockResolvedValue({
      data: uniformBuffer(200, 64 * 64),
      info: { width: 64, height: 64, channels: 1 }
    })
    mockStats.mockResolvedValue({ channels: [{ stdev: 50 }] })
    await computeBlurScore('/test.jpg')
    expect(sharpChain.greyscale).toHaveBeenCalled()
    expect(sharpChain.resize).toHaveBeenCalledWith(512, 512, {
      fit: 'inside',
      withoutEnlargement: true
    })
    expect(sharpChain.raw).toHaveBeenCalled()
    expect(sharpChain.toBuffer).toHaveBeenCalledWith({ resolveWithObject: true })
    expect(sharpChain.stats).toHaveBeenCalled()
  })
})
