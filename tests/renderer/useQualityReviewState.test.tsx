// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createElement, type ReactElement, type ReactNode } from 'react'
import { PhotosContext } from '../../src/renderer/src/context/photos'
import { useQualityReviewState } from '../../src/renderer/src/features/QualityReview/hooks/useQualityReviewState'
import type { PhotoRecord, QualityScoreItem } from '../../src/shared/ipc'

const PHOTO_A: PhotoRecord = {
  path: '/p/a.jpg',
  name: 'a.jpg',
  size: 2000,
  dateTaken: null,
  width: 800,
  height: 600,
  camera: null
}
const PHOTO_B: PhotoRecord = { ...PHOTO_A, path: '/p/b.jpg', name: 'b.jpg' }

const mockApi = {
  getBlurScores: vi.fn(),
  canProcessPhotoCount: vi.fn(),
  onQualityProgress: vi.fn(() => vi.fn()),
  onQualityScoreItem: vi.fn<(cb: (item: QualityScoreItem) => void) => () => void>(() => vi.fn()),
  cancelQuality: vi.fn(),
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
  mockApi.onQualityProgress.mockReturnValue(vi.fn())
  mockApi.onQualityScoreItem.mockReturnValue(vi.fn())
  mockApi.canProcessPhotoCount.mockResolvedValue({ allowed: true, photoLimit: 100, reason: null })
  mockApi.confirmTrash.mockResolvedValue(true)
  Object.defineProperty(window, 'api', { value: mockApi, writable: true, configurable: true })
})

const PHOTOS = [PHOTO_A, PHOTO_B]

describe('useQualityReviewState', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useQualityReviewState(PHOTOS), { wrapper })
    expect(result.current.status).toBe('idle')
    expect(result.current.scores).toEqual({})
    expect(result.current.selected.size).toBe(0)
    expect(result.current.error).toBeNull()
    expect(result.current.isScoring).toBe(false)
  })

  it('handleScore sets results status and accumulates scores via score-item events', async () => {
    let capturedCallback: ((item: QualityScoreItem) => void) | null = null
    mockApi.onQualityScoreItem.mockImplementation((cb) => {
      capturedCallback = cb
      return vi.fn()
    })
    mockApi.getBlurScores.mockImplementation(async () => {
      capturedCallback?.({ path: '/p/a.jpg', score: 120 })
      capturedCallback?.({ path: '/p/b.jpg', score: 40 })
    })

    const { result } = renderHook(() => useQualityReviewState(PHOTOS), { wrapper })

    await act(() => result.current.handleScore())

    expect(result.current.status).toBe('results')
    expect(result.current.scores['/p/a.jpg']).toBe(120)
    expect(result.current.scores['/p/b.jpg']).toBe(40)
    expect(result.current.isScoring).toBe(false)
  })

  it('handleScore sets error and returns to idle on failure', async () => {
    mockApi.getBlurScores.mockRejectedValue(new Error('scoring failed'))
    const { result } = renderHook(() => useQualityReviewState(PHOTOS), { wrapper })

    await act(() => result.current.handleScore())

    expect(result.current.status).toBe('idle')
    expect(result.current.error).toBe('scoring failed')
    expect(result.current.isScoring).toBe(false)
  })

  it('handleScore stops before scoring when the free limit is exceeded', async () => {
    mockApi.canProcessPhotoCount.mockResolvedValue({
      allowed: false,
      photoLimit: 100,
      reason: 'limit exceeded'
    })
    const { result } = renderHook(() => useQualityReviewState(PHOTOS), { wrapper })

    await act(() => result.current.handleScore())

    expect(mockApi.getBlurScores).not.toHaveBeenCalled()
    expect(result.current.error).toBe('limit exceeded')
    expect(result.current.status).toBe('idle')
  })

  it('toggleSelect adds and removes paths', () => {
    const { result } = renderHook(() => useQualityReviewState(PHOTOS), { wrapper })

    act(() => result.current.toggleSelect('/p/a.jpg'))
    expect(result.current.selected.has('/p/a.jpg')).toBe(true)

    act(() => result.current.toggleSelect('/p/a.jpg'))
    expect(result.current.selected.has('/p/a.jpg')).toBe(false)
  })

  it('selectAll(true) selects all paths; selectAll(false) deselects them', () => {
    const paths = ['/p/a.jpg', '/p/b.jpg']
    const { result } = renderHook(() => useQualityReviewState(PHOTOS), { wrapper })

    act(() => result.current.selectAll(paths, true))
    expect(result.current.selected.size).toBe(2)

    act(() => result.current.selectAll(paths, false))
    expect(result.current.selected.size).toBe(0)
  })

  it('handleConfirmTrash calls trashFiles and sets done', async () => {
    mockApi.trashFiles.mockResolvedValue(undefined)
    const { result } = renderHook(() => useQualityReviewState(PHOTOS), { wrapper })

    act(() => result.current.toggleSelect('/p/b.jpg'))
    await act(() => result.current.handleConfirmTrash())

    expect(mockApi.trashFiles).toHaveBeenCalledWith(['/p/b.jpg'])
    expect(mockApi.confirmTrash).toHaveBeenCalledWith(1)
    expect(removePhotosByPath).toHaveBeenCalledWith(['/p/b.jpg'])
    expect(result.current.status).toBe('done')
  })

  it('handleConfirmTrash stops when native confirmation is cancelled', async () => {
    mockApi.confirmTrash.mockResolvedValue(false)
    const { result } = renderHook(() => useQualityReviewState(PHOTOS), { wrapper })

    act(() => result.current.setStatus('reviewing'))
    act(() => result.current.toggleSelect('/p/b.jpg'))
    await act(() => result.current.handleConfirmTrash())

    expect(mockApi.trashFiles).not.toHaveBeenCalled()
    expect(removePhotosByPath).not.toHaveBeenCalled()
    expect(result.current.status).toBe('reviewing')
  })

  it('handleConfirmTrash sets error and stays on reviewing when trash fails', async () => {
    mockApi.trashFiles.mockRejectedValue(new Error('trash error'))
    const { result } = renderHook(() => useQualityReviewState(PHOTOS), { wrapper })

    act(() => result.current.toggleSelect('/p/b.jpg'))
    await act(() => result.current.handleConfirmTrash())

    expect(result.current.status).toBe('reviewing')
    expect(result.current.error).toBe('trash error')
  })

  it('handleCancelScore cancels in-flight scoring and returns to idle', async () => {
    const unsubscribeProgress = vi.fn()
    const unsubscribeItem = vi.fn()
    mockApi.onQualityProgress.mockReturnValue(unsubscribeProgress)
    mockApi.onQualityScoreItem.mockReturnValue(unsubscribeItem)
    mockApi.getBlurScores.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useQualityReviewState(PHOTOS), { wrapper })

    await act(async () => {
      void result.current.handleScore()
      await Promise.resolve()
    })
    act(() => result.current.handleCancelScore())

    expect(mockApi.cancelQuality).toHaveBeenCalledTimes(1)
    expect(unsubscribeProgress).toHaveBeenCalledTimes(1)
    expect(unsubscribeItem).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe('idle')
    expect(result.current.isScoring).toBe(false)
  })

  it('handleReset clears scores, selection, and error', async () => {
    let capturedCallback: ((item: QualityScoreItem) => void) | null = null
    mockApi.onQualityScoreItem.mockImplementation((cb) => {
      capturedCallback = cb
      return vi.fn()
    })
    mockApi.getBlurScores.mockImplementation(async () => {
      capturedCallback?.({ path: '/p/a.jpg', score: 50 })
    })

    const { result } = renderHook(() => useQualityReviewState(PHOTOS), { wrapper })
    await act(() => result.current.handleScore())
    act(() => result.current.toggleSelect('/p/a.jpg'))

    act(() => result.current.handleReset())

    expect(result.current.status).toBe('idle')
    expect(result.current.scores).toEqual({})
    expect(result.current.selected.size).toBe(0)
    expect(result.current.isScoring).toBe(false)
  })
})
