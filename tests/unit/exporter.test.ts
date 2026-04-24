import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildOutputPath, processExport } from '../../src/main/ipc/exporter'
import type { PhotoRecord, ExportPreset } from '../../src/shared/ipc'

// ─── Sharp mock ───────────────────────────────────────────────────────────────

const { mockToFile, sharpChain } = vi.hoisted(() => {
  const mockToFile = vi.fn().mockResolvedValue(undefined)
  const sharpChain = {
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    toFile: mockToFile
  }
  return { mockToFile, sharpChain }
})

vi.mock('sharp', () => ({ default: vi.fn().mockReturnValue(sharpChain) }))
vi.mock('fs/promises', () => ({ mkdir: vi.fn().mockResolvedValue(undefined) }))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePhoto(overrides: Partial<PhotoRecord> = {}): PhotoRecord {
  return {
    path: '/photos/IMG_001.jpg',
    name: 'IMG_001.jpg',
    size: 3_000_000,
    dateTaken: null,
    width: 4032,
    height: 3024,
    camera: null,
    ...overrides
  }
}

function makePreset(overrides: Partial<ExportPreset> = {}): ExportPreset {
  return {
    name: 'web',
    width: 1920,
    height: undefined,
    quality: 85,
    format: 'jpeg',
    ...overrides
  }
}

// ─── buildOutputPath ──────────────────────────────────────────────────────────

describe('buildOutputPath', () => {
  it('builds JPEG path with .jpg extension', () => {
    const photo = makePhoto({ name: 'IMG_001.jpg' })
    const preset = makePreset({ name: 'web', format: 'jpeg' })
    expect(buildOutputPath(photo, preset, '/exports')).toBe('/exports/web/IMG_001.jpg')
  })

  it('builds WebP path with .webp extension', () => {
    const photo = makePhoto({ name: 'IMG_001.jpg' })
    const preset = makePreset({ name: 'thumb', format: 'webp' })
    expect(buildOutputPath(photo, preset, '/exports')).toBe('/exports/thumb/IMG_001.webp')
  })

  it('builds PNG path with .png extension', () => {
    const photo = makePhoto({ name: 'IMG_001.jpg' })
    const preset = makePreset({ name: 'lossless', format: 'png' })
    expect(buildOutputPath(photo, preset, '/exports')).toBe('/exports/lossless/IMG_001.png')
  })

  it('replaces the original extension with the preset format extension', () => {
    const photo = makePhoto({ name: 'shot.heic' })
    const preset = makePreset({ name: 'web', format: 'webp' })
    expect(buildOutputPath(photo, preset, '/out')).toBe('/out/web/shot.webp')
  })

  it('nests output under <outDir>/<presetName>/', () => {
    const photo = makePhoto({ name: 'photo.png' })
    const preset = makePreset({ name: 'social', format: 'jpeg' })
    expect(buildOutputPath(photo, preset, '/Users/max/exports')).toBe(
      '/Users/max/exports/social/photo.jpg'
    )
  })
})

// ─── processExport ────────────────────────────────────────────────────────────

describe('processExport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sharpChain.resize.mockReturnThis()
    sharpChain.jpeg.mockReturnThis()
    sharpChain.webp.mockReturnThis()
    sharpChain.png.mockReturnThis()
    mockToFile.mockResolvedValue(undefined)
  })

  it('calls .jpeg({ quality }) for jpeg format', async () => {
    const photo = makePhoto()
    const preset = makePreset({ format: 'jpeg', quality: 85 })
    await processExport(photo, preset, '/out/web/IMG_001.jpg')
    expect(sharpChain.jpeg).toHaveBeenCalledWith({ quality: 85 })
    expect(sharpChain.toFile).toHaveBeenCalledWith('/out/web/IMG_001.jpg')
  })

  it('calls .webp({ quality }) for webp format', async () => {
    const photo = makePhoto()
    const preset = makePreset({ format: 'webp', quality: 75 })
    await processExport(photo, preset, '/out/thumb/IMG_001.webp')
    expect(sharpChain.webp).toHaveBeenCalledWith({ quality: 75 })
  })

  it('calls .png({ compressionLevel }) for png format — maps quality 100→0, 0→9', async () => {
    const photo = makePhoto()
    const preset100 = makePreset({ format: 'png', quality: 100 })
    await processExport(photo, preset100, '/out.png')
    expect(sharpChain.png).toHaveBeenCalledWith({ compressionLevel: 0 })

    vi.clearAllMocks()
    sharpChain.png.mockReturnThis()
    mockToFile.mockResolvedValue(undefined)

    const preset0 = makePreset({ format: 'png', quality: 1 })
    await processExport(photo, preset0, '/out.png')
    const level = (sharpChain.png.mock.calls[0][0] as { compressionLevel: number }).compressionLevel
    expect(level).toBeGreaterThanOrEqual(8)
  })

  it('calls .resize() when width is specified', async () => {
    const photo = makePhoto()
    const preset = makePreset({ width: 1920, height: undefined, format: 'jpeg', quality: 85 })
    await processExport(photo, preset, '/out.jpg')
    expect(sharpChain.resize).toHaveBeenCalledWith(1920, null, {
      fit: 'inside',
      withoutEnlargement: true
    })
  })

  it('calls .resize() when height is specified', async () => {
    const photo = makePhoto()
    const preset = makePreset({ width: undefined, height: 1080, format: 'jpeg', quality: 85 })
    await processExport(photo, preset, '/out.jpg')
    expect(sharpChain.resize).toHaveBeenCalledWith(null, 1080, {
      fit: 'inside',
      withoutEnlargement: true
    })
  })

  it('skips .resize() when neither width nor height are set', async () => {
    const photo = makePhoto()
    const preset = makePreset({ width: undefined, height: undefined, format: 'webp', quality: 80 })
    await processExport(photo, preset, '/out.webp')
    expect(sharpChain.resize).not.toHaveBeenCalled()
  })

  it('writes the output to the given path', async () => {
    const photo = makePhoto()
    const preset = makePreset()
    await processExport(photo, preset, '/exports/web/IMG_001.jpg')
    expect(mockToFile).toHaveBeenCalledWith('/exports/web/IMG_001.jpg')
  })
})
