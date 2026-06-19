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

vi.mock('../../src/main/localProtocol', () => ({
  setAllowedPreviewRoot: vi.fn()
}))

import { readdir, stat } from 'fs/promises'
import { ipcMain } from 'electron'
import sharp from 'sharp'
import exifr from 'exifr'
import { IPC } from '@shared/ipc'
import type { ScanResult } from '@shared/ipc'
import { setAllowedPreviewRoot } from '../../src/main/localProtocol'
import { getCurrentPhotoSet, replaceCurrentPhotoSet } from '../../src/main/currentPhotoSet'
import {
  walkDir,
  buildPhotoRecord,
  IMAGE_EXTENSIONS,
  registerScannerHandlers
} from '../../src/main/ipc/scanner'

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

// ─── IPC handlers ────────────────────────────────────────────────────────────

type IpcHandler = (
  event: { sender: { send: ReturnType<typeof vi.fn> } },
  ...args: never[]
) => unknown

function registerScannerTestHandlers(): Map<string, IpcHandler> {
  const handlers = new Map<string, IpcHandler>()
  vi.spyOn(ipcMain, 'handle').mockImplementation((channel, handler) => {
    handlers.set(channel, handler as IpcHandler)
  })
  registerScannerHandlers()
  return handlers
}

describe('scanner IPC handlers', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
    replaceCurrentPhotoSet([])
  })

  it('emits scan progress for each processed photo', async () => {
    vi.mocked(readdir).mockResolvedValueOnce([
      { name: 'a.jpg', isDirectory: () => false },
      { name: 'b.png', isDirectory: () => false }
    ] as never)
    vi.mocked(stat).mockResolvedValue({ size: 1_024 } as never)
    vi.mocked(sharp).mockReturnValue({
      metadata: vi.fn().mockResolvedValue({ width: 800, height: 600 })
    } as never)
    vi.mocked(exifr.parse).mockResolvedValue(null)

    const handlers = registerScannerTestHandlers()
    const event = { sender: { send: vi.fn() } }

    const result = (await handlers.get(IPC.SCAN)!(event, '/photos' as never)) as ScanResult
    const progressCalls = event.sender.send.mock.calls.filter(
      ([channel]) => channel === IPC.SCAN_PROGRESS
    )

    expect(result.ok).toBe(true)
    expect(result.ok && result.photos).toHaveLength(2)
    expect(getCurrentPhotoSet()).toHaveLength(2)
    expect(setAllowedPreviewRoot).toHaveBeenCalledWith('/photos')
    expect(setAllowedPreviewRoot).toHaveBeenCalledTimes(1)
    expect(progressCalls).toHaveLength(2)
    expect(progressCalls.map(([, progress]) => progress)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ done: 1, total: 2 }),
        expect.objectContaining({ done: 2, total: 2 })
      ])
    )
  })

  it('replaces the current photo set after a successful scan', async () => {
    vi.mocked(readdir).mockResolvedValueOnce([
      { name: 'a.jpg', isDirectory: () => false },
      { name: 'b.png', isDirectory: () => false }
    ] as never)
    vi.mocked(stat).mockResolvedValue({ size: 1_024 } as never)
    vi.mocked(sharp).mockReturnValue({
      metadata: vi.fn().mockResolvedValue({ width: 800, height: 600 })
    } as never)
    vi.mocked(exifr.parse).mockResolvedValue(null)

    const handlers = registerScannerTestHandlers()
    const event = { sender: { send: vi.fn() } }

    await handlers.get(IPC.SCAN)!(event, '/photos' as never)

    expect(
      getCurrentPhotoSet()
        .map((photo) => photo.path)
        .sort()
    ).toEqual(['/photos/a.jpg', '/photos/b.png'])
  })

  it('cancels an active scan before records are processed', async () => {
    vi.mocked(readdir).mockResolvedValueOnce([{ name: 'a.jpg', isDirectory: () => false }] as never)

    const handlers = registerScannerTestHandlers()
    const event = { sender: { send: vi.fn() } }
    const scan = handlers.get(IPC.SCAN)!(event, '/photos' as never)

    handlers.get(IPC.CANCEL_SCAN)!({ sender: { send: vi.fn() } })

    await expect(scan).resolves.toEqual({ ok: true, photos: [] })
    expect(stat).not.toHaveBeenCalled()
    expect(event.sender.send).not.toHaveBeenCalledWith(
      IPC.SCAN_PROGRESS,
      expect.objectContaining({ total: 1 })
    )
  })

  it('returns a limit result before reading metadata when an unlicensed scan exceeds the free limit', async () => {
    // The limit only applies with payments enabled and no stored license.
    const previousPaymentsEnabled = process.env.CLEANUP_PHOTOS_PAYMENTS_ENABLED
    process.env.CLEANUP_PHOTOS_PAYMENTS_ENABLED = 'true'

    vi.mocked(readdir).mockResolvedValueOnce(
      Array.from({ length: 101 }, (_, index) => ({
        name: `photo-${index}.jpg`,
        isDirectory: () => false
      })) as never
    )

    const handlers = registerScannerTestHandlers()
    const event = { sender: { send: vi.fn() } }
    replaceCurrentPhotoSet([
      {
        path: '/existing.jpg',
        name: 'existing.jpg',
        size: 1,
        dateTaken: null,
        width: null,
        height: null,
        camera: null
      }
    ])

    try {
      const result = (await handlers.get(IPC.SCAN)!(event, '/photos' as never)) as ScanResult

      expect(result).toEqual({ ok: false, limit: { photoCount: 101, photoLimit: 100 } })
      expect(getCurrentPhotoSet().map((photo) => photo.path)).toEqual(['/existing.jpg'])
      expect(setAllowedPreviewRoot).not.toHaveBeenCalled()
      expect(stat).not.toHaveBeenCalled()
      expect(event.sender.send).not.toHaveBeenCalled()
    } finally {
      process.env.CLEANUP_PHOTOS_PAYMENTS_ENABLED = previousPaymentsEnabled
    }
  })

  it('does not replace the preview root when directory walking fails', async () => {
    vi.mocked(readdir).mockRejectedValueOnce(new Error('EACCES: permission denied'))

    const handlers = registerScannerTestHandlers()
    const event = { sender: { send: vi.fn() } }
    replaceCurrentPhotoSet([
      {
        path: '/existing.jpg',
        name: 'existing.jpg',
        size: 1,
        dateTaken: null,
        width: null,
        height: null,
        camera: null
      }
    ])

    await expect(handlers.get(IPC.SCAN)!(event, '/blocked' as never)).rejects.toThrow(
      'EACCES: permission denied'
    )
    expect(getCurrentPhotoSet().map((photo) => photo.path)).toEqual(['/existing.jpg'])
    expect(setAllowedPreviewRoot).not.toHaveBeenCalled()
  })
})
