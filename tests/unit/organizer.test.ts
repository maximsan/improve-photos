import { describe, it, expect, vi, beforeEach } from 'vitest'
import { access, mkdir, rename } from 'fs/promises'
import { ipcMain } from 'electron'
import { deriveTargetPath, registerOrganizerHandlers } from '../../src/main/ipc/organizer'
import { IPC } from '../../src/shared/ipc'
import type { MoveOperation, PhotoRecord } from '../../src/shared/ipc'

vi.mock('fs/promises', () => ({
  rename: vi.fn(),
  access: vi.fn(),
  mkdir: vi.fn()
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePhoto(overrides: Partial<PhotoRecord> = {}): PhotoRecord {
  return {
    path: '/photos/IMG_001.jpg',
    name: 'IMG_001.jpg',
    size: 1_000_000,
    dateTaken: null,
    width: 4032,
    height: 3024,
    camera: null,
    ...overrides
  }
}

// ─── deriveTargetPath ─────────────────────────────────────────────────────────

describe('deriveTargetPath', () => {
  it('produces YYYY/MM/DD/<filename> from an EXIF date', () => {
    const photo = makePhoto({ dateTaken: '2024-07-15T10:30:00.000Z' })
    const result = deriveTargetPath(photo, '/organised')
    expect(result).toBe('/organised/2024/07/15/IMG_001.jpg')
  })

  it('zero-pads single-digit months and days', () => {
    const photo = makePhoto({ dateTaken: '2023-03-05T00:00:00.000Z' })
    expect(deriveTargetPath(photo, '/root')).toBe('/root/2023/03/05/IMG_001.jpg')
  })

  it('uses the photo filename, not the original directory', () => {
    const photo = makePhoto({
      path: '/old/nested/deep/shot.heic',
      name: 'shot.heic',
      dateTaken: '2022-12-31T23:59:59.000Z'
    })
    expect(deriveTargetPath(photo, '/organised')).toBe('/organised/2022/12/31/shot.heic')
  })

  it('places photos with no EXIF date under "undated"', () => {
    const photo = makePhoto({ dateTaken: null })
    expect(deriveTargetPath(photo, '/root')).toBe('/root/undated/IMG_001.jpg')
  })

  it('respects the rootDir argument — different roots produce different paths', () => {
    const photo = makePhoto({ dateTaken: '2024-01-01T00:00:00.000Z' })
    expect(deriveTargetPath(photo, '/a')).toBe('/a/2024/01/01/IMG_001.jpg')
    expect(deriveTargetPath(photo, '/b/sub')).toBe('/b/sub/2024/01/01/IMG_001.jpg')
  })

  it('handles a photo taken on the last day of a leap year', () => {
    const photo = makePhoto({ dateTaken: '2024-02-29T12:00:00.000Z' })
    expect(deriveTargetPath(photo, '/pics')).toBe('/pics/2024/02/29/IMG_001.jpg')
  })

  it('uses UTC dates to avoid timezone-shifted day values', () => {
    // 2024-07-15T23:00:00Z = July 15 UTC, but July 16 in UTC+1
    const photo = makePhoto({ dateTaken: '2024-07-15T23:00:00.000Z' })
    expect(deriveTargetPath(photo, '/root')).toContain('/2024/07/15/')
  })
})

// ─── IPC handlers ────────────────────────────────────────────────────────────

type IpcHandler = (_event: unknown, ...args: never[]) => unknown

function registerOrganizerTestHandlers(): Map<string, IpcHandler> {
  const handlers = new Map<string, IpcHandler>()
  vi.spyOn(ipcMain, 'handle').mockImplementation((channel, handler) => {
    handlers.set(channel, handler as IpcHandler)
  })
  registerOrganizerHandlers()
  return handlers
}

describe('organizer IPC handlers', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('marks preview operations as conflicts when the target path already exists', async () => {
    vi.mocked(access).mockResolvedValue(undefined)
    const handlers = registerOrganizerTestHandlers()
    const photo = makePhoto({
      path: '/library/imports/IMG_001.jpg',
      dateTaken: '2024-07-15T10:30:00.000Z'
    })

    const result = (await handlers.get(IPC.PREVIEW_ORGANIZE)!({}, [
      photo
    ] as never, '/library/imports' as never)) as MoveOperation[]

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      targetPath: '/library/imports/2024/07/15/IMG_001.jpg',
      conflict: true
    })
  })

  it('previews flat-library targets under the explicit scan root', async () => {
    vi.mocked(access).mockRejectedValue(new Error('missing'))
    const handlers = registerOrganizerTestHandlers()
    const photo = makePhoto({
      path: '/library/IMG_001.jpg',
      dateTaken: '2024-07-15T10:30:00.000Z'
    })

    const result = (await handlers.get(IPC.PREVIEW_ORGANIZE)!({}, [
      photo
    ] as never, '/library' as never)) as MoveOperation[]

    expect(result[0]?.targetPath).toBe('/library/2024/07/15/IMG_001.jpg')
  })

  it('previews deeply nested photo targets under the explicit scan root', async () => {
    vi.mocked(access).mockRejectedValue(new Error('missing'))
    const handlers = registerOrganizerTestHandlers()
    const photo = makePhoto({
      path: '/library/imports/phone/2020/trip/IMG_001.jpg',
      dateTaken: '2024-07-15T10:30:00.000Z'
    })

    const result = (await handlers.get(IPC.PREVIEW_ORGANIZE)!({}, [
      photo
    ] as never, '/library' as never)) as MoveOperation[]

    expect(result[0]?.targetPath).toBe('/library/2024/07/15/IMG_001.jpg')
  })

  it('reports move failures without hiding the failed source path', async () => {
    vi.mocked(mkdir).mockResolvedValue(undefined)
    vi.mocked(rename).mockRejectedValue(new Error('permission denied'))
    const handlers = registerOrganizerTestHandlers()
    const op: MoveOperation = {
      photo: makePhoto({ path: '/library/imports/IMG_001.jpg' }),
      targetPath: '/library/2024/07/15/IMG_001.jpg',
      conflict: false
    }

    await expect(handlers.get(IPC.EXECUTE_ORGANIZE)!({}, [op] as never)).rejects.toThrow(
      '1 of 1 file(s) could not be moved:\n/library/imports/IMG_001.jpg: permission denied'
    )
  })
})
