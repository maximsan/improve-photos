// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createElement } from 'react'
import { PhotosContext } from '../../src/renderer/src/context/photos'
import { useScannerState } from '../../src/renderer/src/features/Scanner/hooks/useScannerState'
import type { PhotoRecord } from '../../src/shared/ipc'

const PHOTO: PhotoRecord = {
  path: '/photos/img.jpg',
  name: 'img.jpg',
  size: 1000,
  dateTaken: null,
  width: 800,
  height: 600,
  camera: null
}

const mockApi = {
  pickFolder: vi.fn(),
  scan: vi.fn(),
  onScanProgress: vi.fn(() => vi.fn())
}

const mockSetPhotos = vi.fn()
const mockBump = vi.fn()

function wrapper({ children }: { children: React.ReactNode }) {
  return createElement(PhotosContext.Provider, {
    value: { photos: [], scanRevision: 0, setPhotos: mockSetPhotos, bumpScanRevision: mockBump },
    children
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockApi.onScanProgress.mockReturnValue(vi.fn())
  Object.defineProperty(window, 'api', { value: mockApi, writable: true, configurable: true })
})

describe('useScannerState', () => {
  it('starts in idle state with null values', () => {
    const { result } = renderHook(() => useScannerState(), { wrapper })
    expect(result.current.status).toBe('idle')
    expect(result.current.localPhotos).toEqual([])
    expect(result.current.folderPath).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.progress).toBeNull()
  })

  it('stays idle when the user cancels folder picker', async () => {
    mockApi.pickFolder.mockResolvedValue(null)
    const { result } = renderHook(() => useScannerState(), { wrapper })

    await act(() => result.current.handleChooseFolder())

    expect(result.current.status).toBe('idle')
    expect(mockApi.scan).not.toHaveBeenCalled()
  })

  it('transitions to done and populates photos on success', async () => {
    mockApi.pickFolder.mockResolvedValue('/photos')
    mockApi.scan.mockResolvedValue([PHOTO])
    const { result } = renderHook(() => useScannerState(), { wrapper })

    await act(() => result.current.handleChooseFolder())

    expect(result.current.status).toBe('done')
    expect(result.current.folderPath).toBe('/photos')
    expect(result.current.localPhotos).toEqual([PHOTO])
    expect(mockSetPhotos).toHaveBeenCalledWith([PHOTO])
    expect(mockBump).toHaveBeenCalledTimes(1)
  })

  it('sets error and returns to idle when scan throws', async () => {
    mockApi.pickFolder.mockResolvedValue('/photos')
    mockApi.scan.mockRejectedValue(new Error('disk error'))
    const { result } = renderHook(() => useScannerState(), { wrapper })

    await act(() => result.current.handleChooseFolder())

    expect(result.current.status).toBe('idle')
    expect(result.current.error).toBe('disk error')
  })

  it('does nothing on handleRescan when no folder is selected', async () => {
    const { result } = renderHook(() => useScannerState(), { wrapper })

    await act(() => result.current.handleRescan())

    expect(mockApi.scan).not.toHaveBeenCalled()
  })

  it('rescans and updates photos', async () => {
    mockApi.pickFolder.mockResolvedValue('/photos')
    mockApi.scan.mockResolvedValue([PHOTO])
    const { result } = renderHook(() => useScannerState(), { wrapper })

    await act(() => result.current.handleChooseFolder())
    mockApi.scan.mockResolvedValue([PHOTO, { ...PHOTO, path: '/photos/img2.jpg' }])
    await act(() => result.current.handleRescan())

    expect(result.current.localPhotos).toHaveLength(2)
    expect(result.current.status).toBe('done')
  })

  it('handleReset clears all state', async () => {
    mockApi.pickFolder.mockResolvedValue('/photos')
    mockApi.scan.mockResolvedValue([PHOTO])
    const { result } = renderHook(() => useScannerState(), { wrapper })

    await act(() => result.current.handleChooseFolder())
    act(() => result.current.handleReset())

    expect(result.current.status).toBe('idle')
    expect(result.current.localPhotos).toEqual([])
    expect(result.current.folderPath).toBeNull()
    expect(result.current.error).toBeNull()
  })
})
