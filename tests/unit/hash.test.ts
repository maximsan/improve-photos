import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computePHash, hammingDistance } from '../../src/main/lib/hash'

// ─── Sharp mock ───────────────────────────────────────────────────────────────

// vi.mock() is hoisted to the top of the file, so the factory cannot reference
// variables declared in module scope. Use vi.hoisted() to create them first.
const { mockToBuffer, sharpChain } = vi.hoisted(() => {
  const mockToBuffer = vi.fn()
  const sharpChain = {
    resize: vi.fn().mockReturnThis(),
    greyscale: vi.fn().mockReturnThis(),
    raw: vi.fn().mockReturnThis(),
    toBuffer: mockToBuffer
  }
  return { mockToBuffer, sharpChain }
})

vi.mock('sharp', () => ({ default: vi.fn().mockReturnValue(sharpChain) }))

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a 32×32 pixel buffer filled with a uniform grey value. */
function uniformBuffer(value: number): Buffer {
  return Buffer.alloc(32 * 32, value)
}

/**
 * Build a 32×32 pixel buffer with a horizontal gradient: pixel at (row, col)
 * = (col * 255 / 31) clamped to [0,255].
 */
function gradientBuffer(): Buffer {
  const buf = Buffer.alloc(32 * 32)
  for (let row = 0; row < 32; row++) {
    for (let col = 0; col < 32; col++) {
      buf[row * 32 + col] = Math.round((col * 255) / 31)
    }
  }
  return buf
}

/** Build a 32×32 checkerboard alternating 0 and 255. */
function checkerboardBuffer(): Buffer {
  const buf = Buffer.alloc(32 * 32)
  for (let row = 0; row < 32; row++) {
    for (let col = 0; col < 32; col++) {
      buf[row * 32 + col] = (row + col) % 2 === 0 ? 255 : 0
    }
  }
  return buf
}

// ─── hammingDistance ──────────────────────────────────────────────────────────

describe('hammingDistance', () => {
  it('returns 0 for identical hashes', () => {
    expect(hammingDistance('0000000000000000', '0000000000000000')).toBe(0)
    expect(hammingDistance('ffffffffffffffff', 'ffffffffffffffff')).toBe(0)
    expect(hammingDistance('a3b4c5d6e7f80912', 'a3b4c5d6e7f80912')).toBe(0)
  })

  it('counts a single differing bit correctly', () => {
    // '0' (0000) vs '1' (0001) — 1 bit differs
    expect(hammingDistance('0000000000000000', '0000000000000001')).toBe(1)
  })

  it('returns 4 when one hex digit is fully flipped (0 vs f)', () => {
    expect(hammingDistance('f000000000000000', '0000000000000000')).toBe(4)
  })

  it('returns 64 for fully complementary hashes (0 vs f throughout)', () => {
    expect(hammingDistance('0000000000000000', 'ffffffffffffffff')).toBe(64)
  })

  it('returns Infinity when hashes have different lengths', () => {
    expect(hammingDistance('0000', '00000000')).toBe(Infinity)
    expect(hammingDistance('', 'f')).toBe(Infinity)
  })

  it('is symmetric', () => {
    const a = 'a1b2c3d4e5f60718'
    const b = '1a2b3c4d5e6f8007'
    expect(hammingDistance(a, b)).toBe(hammingDistance(b, a))
  })
})

// ─── computePHash ─────────────────────────────────────────────────────────────

describe('computePHash', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sharpChain.resize.mockReturnThis()
    sharpChain.greyscale.mockReturnThis()
    sharpChain.raw.mockReturnThis()
  })

  it('returns a 16-character lowercase hex string', async () => {
    mockToBuffer.mockResolvedValue({ data: uniformBuffer(128) })
    const hash = await computePHash('/any/file.jpg')
    expect(hash).toMatch(/^[0-9a-f]{16}$/)
  })

  it('is deterministic — same pixel data yields the same hash', async () => {
    const buf = gradientBuffer()
    mockToBuffer.mockResolvedValue({ data: buf })
    const h1 = await computePHash('/photo.jpg')
    mockToBuffer.mockResolvedValue({ data: buf })
    const h2 = await computePHash('/photo.jpg')
    expect(h1).toBe(h2)
  })

  it('identical images produce Hamming distance 0 (≤ 10 duplicate threshold)', async () => {
    const buf = gradientBuffer()
    mockToBuffer.mockResolvedValueOnce({ data: buf }).mockResolvedValueOnce({ data: buf })
    const h1 = await computePHash('/a.jpg')
    const h2 = await computePHash('/b.jpg')
    expect(hammingDistance(h1, h2)).toBe(0)
  })

  it('distinct images (gradient vs checkerboard) produce Hamming distance > 10', async () => {
    mockToBuffer
      .mockResolvedValueOnce({ data: gradientBuffer() })
      .mockResolvedValueOnce({ data: checkerboardBuffer() })
    const h1 = await computePHash('/gradient.jpg')
    const h2 = await computePHash('/checkerboard.jpg')
    expect(hammingDistance(h1, h2)).toBeGreaterThan(10)
  })

  it('calls sharp with the correct pipeline (resize → greyscale → raw → toBuffer)', async () => {
    mockToBuffer.mockResolvedValue({ data: uniformBuffer(200) })
    await computePHash('/test.jpg')
    expect(sharpChain.resize).toHaveBeenCalledWith(32, 32, { fit: 'fill' })
    expect(sharpChain.greyscale).toHaveBeenCalled()
    expect(sharpChain.raw).toHaveBeenCalled()
    expect(sharpChain.toBuffer).toHaveBeenCalledWith({ resolveWithObject: true })
  })
})
