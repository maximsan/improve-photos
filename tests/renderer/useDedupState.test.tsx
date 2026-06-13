// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createElement, type ReactElement, type ReactNode } from 'react'
import { PhotosContext } from '../../src/renderer/src/context/photos'
import { useDedupState } from '../../src/renderer/src/features/Dedup/hooks/useDedupState'
import type {
  ComputeHashesResult,
  PhotoRecord,
  DuplicateGroup,
  PhotoHashes
} from '../../src/shared/ipc'

const PHOTO_A: PhotoRecord = {
  path: '/p/a.jpg',
  name: 'a.jpg',
  size: 2000,
  dateTaken: null,
  width: 800,
  height: 600,
  camera: null
}

const PHOTO_B: PhotoRecord = { ...PHOTO_A, path: '/p/b.jpg', name: 'b.jpg', size: 1000 }

const GROUP: DuplicateGroup = { hash: 'aabbcc', photos: [PHOTO_A, PHOTO_B] }

const mockApi = {
  computeHashes: vi.fn(),
  getDuplicateGroups: vi.fn(),
  canProcessPhotoCount: vi.fn(),
  onHashProgress: vi.fn(() => vi.fn()),
  cancelHashes: vi.fn(),
  confirmTrash: vi.fn(),
  trashFiles: vi.fn()
}
const removePhotosByPath = vi.fn()

function wrapper({ children }: { children: ReactNode }): ReactElement {
  return createElement(
    PhotosContext.Provider,
    {
      value: {
        photos: [],
        scanRoot: null,
        scanRevision: 0,
        setPhotos: vi.fn(),
        setScanRoot: vi.fn(),
        removePhotosByPath,
        bumpScanRevision: vi.fn()
      }
    },
    children
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  removePhotosByPath.mockClear()
  mockApi.onHashProgress.mockReturnValue(vi.fn())
  mockApi.canProcessPhotoCount.mockResolvedValue({ allowed: true, photoLimit: 100, reason: null })
  Object.defineProperty(window, 'api', { value: mockApi, writable: true, configurable: true })
})

const PHOTOS = [PHOTO_A, PHOTO_B]

function makeHashResult(hashes: PhotoHashes = {}, cancelled = false): ComputeHashesResult {
  return { hashes, cancelled }
}

function createDeferred<T>(): {
  promise: Promise<T>
  resolve: (result: T) => void
  reject: (error: unknown) => void
} {
  let resolve!: (result: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, resolve, reject }
}

describe('useDedupState', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useDedupState(PHOTOS), { wrapper })
    expect(result.current.status).toBe('idle')
    expect(result.current.groups).toEqual([])
    expect(result.current.toTrash.size).toBe(0)
    expect(result.current.error).toBeNull()
  })

  it('handleAnalyze transitions to results with found groups', async () => {
    const hashes: PhotoHashes = { '/p/a.jpg': 'aabb', '/p/b.jpg': 'aabb' }
    mockApi.computeHashes.mockResolvedValue(makeHashResult(hashes))
    mockApi.getDuplicateGroups.mockResolvedValue([GROUP])
    const { result } = renderHook(() => useDedupState(PHOTOS), { wrapper })

    await act(() => result.current.handleAnalyze())

    expect(result.current.status).toBe('results')
    expect(result.current.groups).toEqual([GROUP])
    expect(mockApi.computeHashes).toHaveBeenCalledWith(['/p/a.jpg', '/p/b.jpg'])
  })

  it('handleAnalyze ignores a cancelled hash result', async () => {
    const hashes: PhotoHashes = { '/p/a.jpg': 'aabb' }
    mockApi.computeHashes.mockResolvedValue(makeHashResult(hashes, true))
    mockApi.getDuplicateGroups.mockResolvedValue([GROUP])
    const { result } = renderHook(() => useDedupState(PHOTOS), { wrapper })

    await act(() => result.current.handleAnalyze())

    expect(result.current.status).toBe('idle')
    expect(result.current.groups).toEqual([])
    expect(mockApi.getDuplicateGroups).not.toHaveBeenCalled()
  })

  it('handleAnalyze sets error and returns to idle on failure', async () => {
    mockApi.computeHashes.mockRejectedValue(new Error('hash error'))
    const { result } = renderHook(() => useDedupState(PHOTOS), { wrapper })

    await act(() => result.current.handleAnalyze())

    expect(result.current.status).toBe('idle')
    expect(result.current.error).toBe('hash error')
  })

  it('handleAnalyze stops before hashing when the free limit is exceeded', async () => {
    mockApi.canProcessPhotoCount.mockResolvedValue({
      allowed: false,
      photoLimit: 100,
      reason: 'limit exceeded'
    })
    const { result } = renderHook(() => useDedupState(PHOTOS), { wrapper })

    await act(() => result.current.handleAnalyze())

    expect(mockApi.computeHashes).not.toHaveBeenCalled()
    expect(result.current.error).toBe('limit exceeded')
    expect(result.current.status).toBe('idle')
  })

  it('toggleTrash adds and removes a path', () => {
    const { result } = renderHook(() => useDedupState(PHOTOS), { wrapper })

    act(() => result.current.toggleTrash('/p/b.jpg'))
    expect(result.current.toTrash.has('/p/b.jpg')).toBe(true)

    act(() => result.current.toggleTrash('/p/b.jpg'))
    expect(result.current.toTrash.has('/p/b.jpg')).toBe(false)
  })

  it('handleCancel resets to idle and calls cancelHashes', async () => {
    mockApi.computeHashes.mockReturnValue(new Promise(() => {})) // never resolves
    const { result } = renderHook(() => useDedupState(PHOTOS), { wrapper })

    act(() => void result.current.handleAnalyze())
    act(() => result.current.handleCancel())

    expect(result.current.status).toBe('idle')
    expect(mockApi.cancelHashes).toHaveBeenCalledTimes(1)
  })

  it('handleCancel prevents late hash results from publishing groups', async () => {
    const hashRun = createDeferred<ComputeHashesResult>()
    mockApi.computeHashes.mockReturnValue(hashRun.promise)
    mockApi.getDuplicateGroups.mockResolvedValue([GROUP])
    const { result } = renderHook(() => useDedupState(PHOTOS), { wrapper })
    let analyzePromise!: Promise<void>

    await act(async () => {
      analyzePromise = result.current.handleAnalyze()
      await Promise.resolve()
    })
    act(() => result.current.handleCancel())
    await act(async () => {
      hashRun.resolve(makeHashResult({ '/p/a.jpg': 'aabb' }))
      await analyzePromise
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.groups).toEqual([])
    expect(mockApi.cancelHashes).toHaveBeenCalledTimes(1)
    expect(mockApi.getDuplicateGroups).not.toHaveBeenCalled()
  })

  it('handleReset clears groups, trash set, and error', async () => {
    mockApi.computeHashes.mockResolvedValue(makeHashResult())
    mockApi.getDuplicateGroups.mockResolvedValue([GROUP])
    const { result } = renderHook(() => useDedupState(PHOTOS), { wrapper })

    await act(() => result.current.handleAnalyze())
    act(() => result.current.toggleTrash('/p/b.jpg'))
    act(() => result.current.handleReset())

    expect(result.current.status).toBe('idle')
    expect(result.current.groups).toEqual([])
    expect(result.current.toTrash.size).toBe(0)
  })

  it('removes trashed duplicate photos from shared photo state', async () => {
    mockApi.trashFiles.mockResolvedValue(undefined)
    const { result } = renderHook(() => useDedupState(PHOTOS), { wrapper })

    act(() => result.current.setStatus('reviewing'))
    act(() => result.current.toggleTrash('/p/b.jpg'))
    await act(() => result.current.handleConfirmTrash())

    expect(mockApi.trashFiles).toHaveBeenCalledWith(['/p/b.jpg'])
    expect(removePhotosByPath).toHaveBeenCalledWith(['/p/b.jpg'])
  })
})
