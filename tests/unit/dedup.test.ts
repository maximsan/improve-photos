import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ipcMain, shell } from 'electron'
import { IPC } from '../../src/shared/ipc'
import type { DuplicateGroup, PhotoRecord, TrashFilesResult } from '../../src/shared/ipc'
import { registerDedupHandlers } from '../../src/main/ipc/dedup'
import { getCurrentPhotoSet, replaceCurrentPhotoSet } from '../../src/main/currentPhotoSet'

type IpcHandler = (_event: unknown, ...args: never[]) => unknown

function makePhoto(overrides: Partial<PhotoRecord> = {}): PhotoRecord {
  return {
    path: '/photos/a.jpg',
    name: 'a.jpg',
    size: 1000,
    dateTaken: null,
    width: 800,
    height: 600,
    camera: null,
    ...overrides
  }
}

function registerDedupTestHandlers(): Map<string, IpcHandler> {
  const handlers = new Map<string, IpcHandler>()
  vi.spyOn(ipcMain, 'handle').mockImplementation((channel, handler) => {
    handlers.set(channel, handler as IpcHandler)
  })
  registerDedupHandlers()
  return handlers
}

describe('dedup IPC handlers', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
    replaceCurrentPhotoSet([])
  })

  it('builds duplicate groups from the current photo set', async () => {
    replaceCurrentPhotoSet([
      makePhoto({ path: '/photos/a.jpg', name: 'a.jpg', size: 1000 }),
      makePhoto({ path: '/photos/b.jpg', name: 'b.jpg', size: 2000 }),
      makePhoto({ path: '/photos/not-hashed.jpg', name: 'not-hashed.jpg', size: 3000 })
    ])
    const handlers = registerDedupTestHandlers()

    const groups = (await handlers.get(IPC.GET_DUPLICATE_GROUPS)!({}, {
      '/photos/a.jpg': '0000000000000000',
      '/photos/b.jpg': '0000000000000001',
      '/photos/not-current.jpg': '0000000000000000'
    } as never)) as DuplicateGroup[]

    expect(groups).toHaveLength(1)
    expect(groups[0].photos.map((photo) => photo.path)).toEqual(['/photos/b.jpg', '/photos/a.jpg'])
  })

  it('trashes successful files and returns the updated current photo set with partial errors', async () => {
    replaceCurrentPhotoSet([
      makePhoto({ path: '/photos/a.jpg', name: 'a.jpg' }),
      makePhoto({ path: '/photos/b.jpg', name: 'b.jpg' })
    ])
    vi.spyOn(shell, 'trashItem')
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('permission denied'))
    const handlers = registerDedupTestHandlers()

    const result = (await handlers.get(IPC.TRASH_FILES)!({}, [
      '/photos/a.jpg',
      '/photos/b.jpg'
    ] as never)) as TrashFilesResult

    expect(result).toEqual({
      photos: [expect.objectContaining({ path: '/photos/b.jpg', name: 'b.jpg' })],
      trashedPaths: ['/photos/a.jpg'],
      errors: ['/photos/b.jpg: permission denied'],
      requestedCount: 2,
      trashedCount: 1
    })
    expect(getCurrentPhotoSet().map((photo) => photo.path)).toEqual(['/photos/b.jpg'])
  })
})
