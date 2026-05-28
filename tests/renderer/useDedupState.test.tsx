// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createElement, type ReactElement, type ReactNode } from 'react'
import { PhotosContext } from '../../src/renderer/src/context/photos'
import { useDedupState } from '../../src/renderer/src/features/Dedup/hooks/useDedupState'
import type { PhotoRecord, DuplicateGroup, PhotoHashes } from '../../src/shared/ipc'

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
  onHashProgress: vi.fn(() => vi.fn()),
  cancelHashes: vi.fn(),
  confirmTrash: vi.fn(),
  trashFiles: vi.fn()
}

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
        bumpScanRevision: vi.fn()
      }
    },
    children
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockApi.onHashProgress.mockReturnValue(vi.fn())
  Object.defineProperty(window, 'api', { value: mockApi, writable: true, configurable: true })
})

const PHOTOS = [PHOTO_A, PHOTO_B]

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
    mockApi.computeHashes.mockResolvedValue(hashes)
    mockApi.getDuplicateGroups.mockResolvedValue([GROUP])
    const { result } = renderHook(() => useDedupState(PHOTOS), { wrapper })

    await act(() => result.current.handleAnalyze())

    expect(result.current.status).toBe('results')
    expect(result.current.groups).toEqual([GROUP])
    expect(mockApi.computeHashes).toHaveBeenCalledWith(['/p/a.jpg', '/p/b.jpg'])
  })

  it('handleAnalyze sets error and returns to idle on failure', async () => {
    mockApi.computeHashes.mockRejectedValue(new Error('hash error'))
    const { result } = renderHook(() => useDedupState(PHOTOS), { wrapper })

    await act(() => result.current.handleAnalyze())

    expect(result.current.status).toBe('idle')
    expect(result.current.error).toBe('hash error')
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

  it('handleReset clears groups, trash set, and error', async () => {
    mockApi.computeHashes.mockResolvedValue({})
    mockApi.getDuplicateGroups.mockResolvedValue([GROUP])
    const { result } = renderHook(() => useDedupState(PHOTOS), { wrapper })

    await act(() => result.current.handleAnalyze())
    act(() => result.current.toggleTrash('/p/b.jpg'))
    act(() => result.current.handleReset())

    expect(result.current.status).toBe('idle')
    expect(result.current.groups).toEqual([])
    expect(result.current.toTrash.size).toBe(0)
  })
})
