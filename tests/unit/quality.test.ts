import { describe, it, expect, vi } from 'vitest'
import { laplacianVariance, computeBlurScore } from '../../src/main/ipc/quality'

// ─── Sharp mock ───────────────────────────────────────────────────────────────

const { mockToBuffer, sharpChain } = vi.hoisted(() => {
  const mockToBuffer = vi.fn()
  const sharpChain = {
    greyscale: vi.fn().mockReturnThis(),
    resize: vi.fn().mockReturnThis(),
    raw: vi.fn().mockReturnThis(),
    toBuffer: mockToBuffer
  }
  return { mockToBuffer, sharpChain }
})

vi.mock('sharp', () => ({ default: vi.fn().mockReturnValue(sharpChain) }))
vi.mock('electron', () => ({ ipcMain: { handle: vi.fn() } }))

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Uniform buffer — perfectly smooth, no edges. */
function uniformBuffer(value: number, length: number): Buffer {
  return Buffer.alloc(length, value)
}

/**
 * Vertical-edge buffer: left half of every row is 0, right half is 255.
 * The horizontal Laplacian kernel fires at the column boundary within each row.
 */
function verticalEdgeBuffer(width: number, height: number): Buffer {
  const buf = Buffer.alloc(width * height)
  const midCol = Math.floor(width / 2)
  for (let row = 0; row < height; row++) {
    for (let col = midCol; col < width; col++) {
      buf[row * width + col] = 255
    }
  }
  return buf
}

/** High-frequency checkerboard — alternating 0 / 255. */
function checkerBuffer(width: number, height: number): Buffer {
  const buf = Buffer.alloc(width * height)
  for (let i = 0; i < buf.length; i++) {
    buf[i] = i % 2 === 0 ? 255 : 0
  }
  return buf
}

// ─── laplacianVariance ────────────────────────────────────────────────────────

describe('laplacianVariance', () => {
  it('returns 0 for a uniform buffer (no edges)', () => {
    expect(laplacianVariance(uniformBuffer(128, 100), 10)).toBe(0)
    expect(laplacianVariance(uniformBuffer(0, 100), 10)).toBe(0)
    expect(laplacianVariance(uniformBuffer(255, 100), 10)).toBe(0)
  })

  it('returns 0 for buffers that are too short to score', () => {
    expect(laplacianVariance(Buffer.from([128, 128]), 2)).toBe(0)
    expect(laplacianVariance(Buffer.alloc(0), 10)).toBe(0)
  })

  it('returns a positive value for a buffer with intra-row edges', () => {
    const score = laplacianVariance(verticalEdgeBuffer(10, 10), 10)
    expect(score).toBeGreaterThan(0)
  })

  it('blurry image (uniform) scores lower than sharp image (checkerboard)', () => {
    const width = 16
    const height = 16
    const blurryScore = laplacianVariance(uniformBuffer(128, width * height), width)
    const sharpScore = laplacianVariance(checkerBuffer(width, height), width)
    expect(blurryScore).toBeLessThan(sharpScore)
  })

  it('higher-frequency content scores strictly higher', () => {
    const width = 20
    // Gradual ramp — low frequency
    const ramp = Buffer.from(Array.from({ length: width * 10 }, (_, i) => (i % width) * 12))
    const rampScore = laplacianVariance(ramp, width)
    // Alternating — high frequency
    const checker = checkerBuffer(width, 10)
    const checkerScore = laplacianVariance(checker, width)
    expect(rampScore).toBeLessThan(checkerScore)
  })
})

// ─── computeBlurScore ─────────────────────────────────────────────────────────

describe('computeBlurScore', () => {
  it('returns a non-negative number', async () => {
    mockToBuffer.mockResolvedValue({
      data: checkerBuffer(32, 32),
      info: { width: 32, height: 32, channels: 1 }
    })
    const score = await computeBlurScore('/any/file.jpg')
    expect(score).toBeGreaterThanOrEqual(0)
  })

  it('sharp image scores higher than blurry image', async () => {
    mockToBuffer
      .mockResolvedValueOnce({
        data: uniformBuffer(128, 32 * 32),
        info: { width: 32, height: 32, channels: 1 }
      })
      .mockResolvedValueOnce({
        data: checkerBuffer(32, 32),
        info: { width: 32, height: 32, channels: 1 }
      })

    const blurryScore = await computeBlurScore('/blurry.jpg')
    const sharpScore = await computeBlurScore('/sharp.jpg')
    expect(blurryScore).toBeLessThan(sharpScore)
  })

  it('calls sharp with the correct pipeline (greyscale → resize → raw → toBuffer)', async () => {
    mockToBuffer.mockResolvedValue({
      data: uniformBuffer(200, 64 * 64),
      info: { width: 64, height: 64, channels: 1 }
    })
    await computeBlurScore('/test.jpg')
    expect(sharpChain.greyscale).toHaveBeenCalled()
    expect(sharpChain.resize).toHaveBeenCalledWith(512, 512, {
      fit: 'inside',
      withoutEnlargement: true
    })
    expect(sharpChain.raw).toHaveBeenCalled()
    expect(sharpChain.toBuffer).toHaveBeenCalledWith({ resolveWithObject: true })
  })
})
