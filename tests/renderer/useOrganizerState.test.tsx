// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createElement, type ReactElement, type ReactNode } from 'react'
import { PhotosContext } from '../../src/renderer/src/context/photos'
import { useOrganizerState } from '../../src/renderer/src/features/Organizer/hooks/useOrganizerState'
import type { PhotoRecord, MoveOperation } from '../../src/shared/ipc'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PHOTO_A: PhotoRecord = {
  path: '/root/2024/a.jpg',
  name: 'a.jpg',
  size: 1000,
  dateTaken: '2024-06-15T00:00:00Z',
  width: 800,
  height: 600,
  camera: null
}

const PHOTO_B: PhotoRecord = { ...PHOTO_A, path: '/root/2024/b.jpg', name: 'b.jpg' }
const PHOTOS = [PHOTO_A, PHOTO_B]

const OP_A: MoveOperation = {
  photo: PHOTO_A,
  targetPath: '/root/2024/06/15/a.jpg',
  conflict: false
}
const OP_B: MoveOperation = { ...OP_A, photo: PHOTO_B, targetPath: '/root/2024/06/15/b.jpg' }

// ─── Mock API + wrapper ────────────────────────────────────────────────────────

const mockSetPhotos = vi.fn()

const mockApi = {
  previewOrganize: vi.fn(),
  executeOrganize: vi.fn(),
  undoOrganize: vi.fn()
}

function makeWrapper(scanRevision = 0) {
  return function wrapper({ children }: { children: ReactNode }): ReactElement {
    return createElement(
      PhotosContext.Provider,
      {
        value: {
          photos: PHOTOS,
          scanRevision,
          setPhotos: mockSetPhotos,
          bumpScanRevision: vi.fn()
        }
      },
      children
    )
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(window, 'api', { value: mockApi, writable: true, configurable: true })
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useOrganizerState', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useOrganizerState(), { wrapper: makeWrapper() })
    expect(result.current.status).toBe('idle')
    expect(result.current.ops).toEqual([])
    expect(result.current.movedCount).toBe(0)
    expect(result.current.error).toBeNull()
  })

  it('handlePreview transitions idle → previewing → preview with ops', async () => {
    mockApi.previewOrganize.mockResolvedValue([OP_A, OP_B])
    const { result } = renderHook(() => useOrganizerState(), { wrapper: makeWrapper() })

    await act(() => result.current.handlePreview())

    expect(result.current.status).toBe('preview')
    expect(result.current.ops).toEqual([OP_A, OP_B])
    expect(mockApi.previewOrganize).toHaveBeenCalledWith(PHOTOS)
  })

  it('handlePreview on failure returns to idle with error', async () => {
    mockApi.previewOrganize.mockRejectedValue(new Error('preview failed'))
    const { result } = renderHook(() => useOrganizerState(), { wrapper: makeWrapper() })

    await act(() => result.current.handlePreview())

    expect(result.current.status).toBe('idle')
    expect(result.current.error).toBe('preview failed')
  })

  it('handleConfirm transitions moving → done and sets movedCount for non-conflict ops', async () => {
    mockApi.previewOrganize.mockResolvedValue([OP_A, OP_B])
    mockApi.executeOrganize.mockResolvedValue(undefined)
    const { result } = renderHook(() => useOrganizerState(), { wrapper: makeWrapper() })

    await act(() => result.current.handlePreview())
    await act(() => result.current.handleConfirm())

    expect(result.current.status).toBe('done')
    expect(result.current.movedCount).toBe(2)
  })

  it('handleConfirm excludes conflict ops from movedCount', async () => {
    const conflictOp: MoveOperation = { ...OP_B, conflict: true }
    mockApi.previewOrganize.mockResolvedValue([OP_A, conflictOp])
    mockApi.executeOrganize.mockResolvedValue(undefined)
    const { result } = renderHook(() => useOrganizerState(), { wrapper: makeWrapper() })

    await act(() => result.current.handlePreview())
    await act(() => result.current.handleConfirm())

    expect(result.current.movedCount).toBe(1)
  })

  it('handleConfirm calls setPhotos with updated paths', async () => {
    mockApi.previewOrganize.mockResolvedValue([OP_A])
    mockApi.executeOrganize.mockResolvedValue(undefined)
    const { result } = renderHook(() => useOrganizerState(), { wrapper: makeWrapper() })

    await act(() => result.current.handlePreview())
    await act(() => result.current.handleConfirm())

    expect(mockSetPhotos).toHaveBeenCalledOnce()
    const updatedPhotos: PhotoRecord[] = mockSetPhotos.mock.calls[0][0]
    const updated = updatedPhotos.find((p) => p.name === 'a.jpg')
    expect(updated?.path).toBe('/root/2024/06/15/a.jpg')
    expect(updated?.name).toBe('a.jpg')
  })

  it('handleConfirm on failure returns to preview with error', async () => {
    mockApi.previewOrganize.mockResolvedValue([OP_A])
    mockApi.executeOrganize.mockRejectedValue(new Error('move failed'))
    const { result } = renderHook(() => useOrganizerState(), { wrapper: makeWrapper() })

    await act(() => result.current.handlePreview())
    await act(() => result.current.handleConfirm())

    expect(result.current.status).toBe('preview')
    expect(result.current.error).toBe('move failed')
  })

  it('handleUndo transitions done → undoing → undone', async () => {
    mockApi.previewOrganize.mockResolvedValue([OP_A])
    mockApi.executeOrganize.mockResolvedValue(undefined)
    mockApi.undoOrganize.mockResolvedValue(undefined)
    const { result } = renderHook(() => useOrganizerState(), { wrapper: makeWrapper() })

    await act(() => result.current.handlePreview())
    await act(() => result.current.handleConfirm())
    await act(() => result.current.handleUndo())

    expect(result.current.status).toBe('undone')
    expect(result.current.error).toBeNull()
  })

  it('handleUndo passes the correct pairs to undoOrganize', async () => {
    mockApi.previewOrganize.mockResolvedValue([OP_A])
    mockApi.executeOrganize.mockResolvedValue(undefined)
    mockApi.undoOrganize.mockResolvedValue(undefined)
    const { result } = renderHook(() => useOrganizerState(), { wrapper: makeWrapper() })

    await act(() => result.current.handlePreview())
    await act(() => result.current.handleConfirm())
    await act(() => result.current.handleUndo())

    expect(mockApi.undoOrganize).toHaveBeenCalledWith([{ from: PHOTO_A.path, to: OP_A.targetPath }])
  })

  it('handleUndo on failure returns to done with error', async () => {
    mockApi.previewOrganize.mockResolvedValue([OP_A])
    mockApi.executeOrganize.mockResolvedValue(undefined)
    mockApi.undoOrganize.mockRejectedValue(new Error('undo failed'))
    const { result } = renderHook(() => useOrganizerState(), { wrapper: makeWrapper() })

    await act(() => result.current.handlePreview())
    await act(() => result.current.handleConfirm())
    await act(() => result.current.handleUndo())

    expect(result.current.status).toBe('done')
    expect(result.current.error).toBe('undo failed')
  })

  it('handleReset clears all state', async () => {
    mockApi.previewOrganize.mockResolvedValue([OP_A, OP_B])
    mockApi.executeOrganize.mockResolvedValue(undefined)
    const { result } = renderHook(() => useOrganizerState(), { wrapper: makeWrapper() })

    await act(() => result.current.handlePreview())
    await act(() => result.current.handleConfirm())
    act(() => result.current.handleReset())

    expect(result.current.status).toBe('idle')
    expect(result.current.ops).toEqual([])
    expect(result.current.movedCount).toBe(0)
    expect(result.current.error).toBeNull()
  })
})
