import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('sharp', () => ({
  default: vi.fn()
}))

vi.mock('exifr', () => ({
  default: { parse: vi.fn() }
}))

vi.mock('fs/promises', () => ({
  readdir: vi.fn(),
  stat: vi.fn()
}))

import { readdir, stat } from 'fs/promises'
import sharp from 'sharp'
import exifr from 'exifr'
import { walkDir, buildPhotoRecord, IMAGE_EXTENSIONS } from '../../src/main/ipc/scanner'

// ─── IMAGE_EXTENSIONS ────────────────────────────────────────────────────────

describe('IMAGE_EXTENSIONS', () => {
  it('includes all supported formats', () => {
    for (const ext of ['.jpg', '.jpeg', '.heic', '.heif', '.png', '.webp', '.tiff', '.tif']) {
      expect(IMAGE_EXTENSIONS.has(ext)).toBe(true)
    }
  })

  it('excludes non-image formats', () => {
    for (const ext of ['.pdf', '.mp4', '.txt', '.doc', '.zip']) {
      expect(IMAGE_EXTENSIONS.has(ext)).toBe(false)
    }
  })
})

// ─── walkDir ─────────────────────────────────────────────────────────────────

describe('walkDir', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns only image files', async () => {
    vi.mocked(readdir).mockResolvedValueOnce([
      { name: 'photo.jpg', isDirectory: () => false },
      { name: 'document.pdf', isDirectory: () => false },
      { name: 'readme.txt', isDirectory: () => false }
    ] as never)

    const results = await walkDir('/photos')
    expect(results).toEqual(['/photos/photo.jpg'])
  })

  it('recurses into subdirectories', async () => {
    vi.mocked(readdir)
      .mockResolvedValueOnce([
        { name: 'photo.jpg', isDirectory: () => false },
        { name: 'subfolder', isDirectory: () => true }
      ] as never)
      .mockResolvedValueOnce([{ name: 'nested.png', isDirectory: () => false }] as never)

    const results = await walkDir('/photos')
    expect(results).toEqual(['/photos/photo.jpg', '/photos/subfolder/nested.png'])
  })

  it('skips hidden directories and files', async () => {
    vi.mocked(readdir).mockResolvedValueOnce([
      { name: '.thumbnails', isDirectory: () => true },
      { name: '.DS_Store', isDirectory: () => false },
      { name: 'photo.jpg', isDirectory: () => false }
    ] as never)

    const results = await walkDir('/photos')
    expect(results).toEqual(['/photos/photo.jpg'])
    // .thumbnails must not have been recursed
    expect(readdir).toHaveBeenCalledTimes(1)
  })

  it('matches extensions case-insensitively', async () => {
    vi.mocked(readdir).mockResolvedValueOnce([
      { name: 'IMG_001.JPG', isDirectory: () => false },
      { name: 'IMG_002.Heic', isDirectory: () => false }
    ] as never)

    const results = await walkDir('/photos')
    expect(results).toHaveLength(2)
  })
})

// ─── buildPhotoRecord ─────────────────────────────────────────────────────────

describe('buildPhotoRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps sharp metadata and EXIF to PhotoRecord', async () => {
    vi.mocked(stat).mockResolvedValue({ size: 5_000_000 } as never)
    vi.mocked(sharp).mockReturnValue({
      metadata: vi.fn().mockResolvedValue({ width: 1920, height: 1080 })
    } as never)
    vi.mocked(exifr.parse).mockResolvedValue({
      DateTimeOriginal: new Date('2023-07-15T10:30:00.000Z'),
      Make: 'Apple',
      Model: 'iPhone 14'
    })

    const record = await buildPhotoRecord('/photos/IMG_001.jpg')

    expect(record).toMatchObject({
      path: '/photos/IMG_001.jpg',
      name: 'IMG_001.jpg',
      size: 5_000_000,
      width: 1920,
      height: 1080,
      camera: 'Apple iPhone 14'
    })
    expect(record?.dateTaken).toBe(new Date('2023-07-15T10:30:00.000Z').toISOString())
  })

  it('returns null when the file cannot be read', async () => {
    vi.mocked(stat).mockRejectedValue(new Error('ENOENT: no such file'))

    const record = await buildPhotoRecord('/photos/missing.jpg')
    expect(record).toBeNull()
  })

  it('returns a record with null EXIF fields when exifr fails', async () => {
    vi.mocked(stat).mockResolvedValue({ size: 1_024 } as never)
    vi.mocked(sharp).mockReturnValue({
      metadata: vi.fn().mockResolvedValue({ width: 800, height: 600 })
    } as never)
    vi.mocked(exifr.parse).mockRejectedValue(new Error('no EXIF data'))

    const record = await buildPhotoRecord('/photos/screenshot.png')
    expect(record).not.toBeNull()
    expect(record?.dateTaken).toBeNull()
    expect(record?.camera).toBeNull()
  })

  it('handles missing Make/Model gracefully', async () => {
    vi.mocked(stat).mockResolvedValue({ size: 2_000 } as never)
    vi.mocked(sharp).mockReturnValue({
      metadata: vi.fn().mockResolvedValue({ width: 640, height: 480 })
    } as never)
    vi.mocked(exifr.parse).mockResolvedValue({
      DateTimeOriginal: new Date('2022-01-01T00:00:00.000Z')
      // no Make or Model
    })

    const record = await buildPhotoRecord('/photos/scan.jpg')
    expect(record?.camera).toBeNull()
    expect(record?.dateTaken).not.toBeNull()
  })
})
