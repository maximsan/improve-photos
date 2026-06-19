// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createElement, type ReactElement, type ReactNode } from 'react'
import { PhotosContext } from '../../src/renderer/src/context/photos'
import { useOrganizerState } from '../../src/renderer/src/features/Organizer/hooks/useOrganizerState'
import type {
  ExecuteOrganizeResult,
  MoveOperation,
  PhotoRecord,
  UndoOrganizeResult
} from '../../src/shared/ipc'

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
const SCAN_ROOT = '/root'

const OP_A: MoveOperation = {
  photo: PHOTO_A,
  targetPath: '/root/2024/06/15/a.jpg',
  conflict: false
}
const OP_B: MoveOperation = { ...OP_A, photo: PHOTO_B, targetPath: '/root/2024/06/15/b.jpg' }
const MOVE_PAIR_A = { from: PHOTO_A.path, to: OP_A.targetPath }
const MOVE_PAIR_B = { from: PHOTO_B.path, to: OP_B.targetPath }
const PHOTO_A_MOVED: PhotoRecord = { ...PHOTO_A, path: OP_A.targetPath }
const PHOTO_B_MOVED: PhotoRecord = { ...PHOTO_B, path: OP_B.targetPath }

function makeExecuteResult(
  movedPairs: ExecuteOrganizeResult['movedPairs'],
  errors: string[] = [],
  requestedCount = movedPairs.length,
  photos: PhotoRecord[] = PHOTOS
): ExecuteOrganizeResult {
  return {
    movedPairs,
    errors,
    requestedCount,
    movedCount: movedPairs.length,
    photos
  }
}

function makeUndoResult(
  undonePairs: UndoOrganizeResult['undonePairs'],
  errors: string[] = [],
  requestedCount = undonePairs.length,
  photos: PhotoRecord[] = PHOTOS
): UndoOrganizeResult {
  return {
    photos,
    undonePairs,
    errors,
    requestedCount,
    undoneCount: undonePairs.length
  }
}

// ─── Mock API + wrapper ────────────────────────────────────────────────────────

const mockSetPhotos = vi.fn()

const mockApi = {
  canProcessPhotoCount: vi.fn(),
  previewOrganize: vi.fn(),
  executeOrganize: vi.fn(),
  undoOrganize: vi.fn()
}

function makeWrapper(scanRevision = 0, scanRoot: string | null = SCAN_ROOT) {
  return function wrapper({ children }: { children: ReactNode }): ReactElement {
    return createElement(
      PhotosContext.Provider,
      {
        value: {
          photos: PHOTOS,
          scanRoot,
          scanRevision,
          setPhotos: mockSetPhotos,
          setScanRoot: vi.fn(),
          bumpScanRevision: vi.fn()
        }
      },
      children
    )
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockApi.canProcessPhotoCount.mockResolvedValue({ allowed: true, photoLimit: 100, reason: null })
  Object.defineProperty(window, 'api', { value: mockApi, writable: true, configurable: true })
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useOrganizerState', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useOrganizerState(), { wrapper: makeWrapper() })
    expect(result.current.status).toBe('idle')
    expect(result.current.ops).toEqual([])
    expect(result.current.movedCount).toBe(0)
    expect(result.current.scanRoot).toBe(SCAN_ROOT)
    expect(result.current.error).toBeNull()
  })

  it('handlePreview transitions idle → previewing → preview with ops', async () => {
    mockApi.previewOrganize.mockResolvedValue([OP_A, OP_B])
    const { result } = renderHook(() => useOrganizerState(), { wrapper: makeWrapper() })

    await act(() => result.current.handlePreview())

    expect(result.current.status).toBe('preview')
    expect(result.current.ops).toEqual([OP_A, OP_B])
    expect(mockApi.previewOrganize).toHaveBeenCalledWith(PHOTOS, SCAN_ROOT)
  })

  it('handlePreview stays idle when scan root is missing', async () => {
    const { result } = renderHook(() => useOrganizerState(), {
      wrapper: makeWrapper(0, null)
    })

    await act(() => result.current.handlePreview())

    expect(result.current.status).toBe('idle')
    expect(result.current.error).toBe('Scan a folder before previewing organize changes')
    expect(mockApi.previewOrganize).not.toHaveBeenCalled()
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
    mockApi.executeOrganize.mockResolvedValue(makeExecuteResult([MOVE_PAIR_A, MOVE_PAIR_B]))
    const { result } = renderHook(() => useOrganizerState(), { wrapper: makeWrapper() })

    await act(() => result.current.handlePreview())
    await act(() => result.current.handleConfirm())

    expect(result.current.status).toBe('done')
    expect(result.current.movedCount).toBe(2)
  })

  it('handleConfirm excludes conflict ops from movedCount', async () => {
    const conflictOp: MoveOperation = { ...OP_B, conflict: true }
    mockApi.previewOrganize.mockResolvedValue([OP_A, conflictOp])
    mockApi.executeOrganize.mockResolvedValue(makeExecuteResult([MOVE_PAIR_A], [], 1))
    const { result } = renderHook(() => useOrganizerState(), { wrapper: makeWrapper() })

    await act(() => result.current.handlePreview())
    await act(() => result.current.handleConfirm())

    expect(result.current.movedCount).toBe(1)
  })

  it('handleConfirm calls setPhotos with updated paths', async () => {
    const updatedPhotos = [PHOTO_A_MOVED, PHOTO_B]
    mockApi.previewOrganize.mockResolvedValue([OP_A])
    mockApi.executeOrganize.mockResolvedValue(
      makeExecuteResult([MOVE_PAIR_A], [], 1, updatedPhotos)
    )
    const { result } = renderHook(() => useOrganizerState(), { wrapper: makeWrapper() })

    await act(() => result.current.handlePreview())
    await act(() => result.current.handleConfirm())

    expect(mockSetPhotos).toHaveBeenCalledOnce()
    expect(mockSetPhotos.mock.calls[0][0]).toBe(updatedPhotos)
  })

  it('handleConfirm applies partial successes and keeps undo data', async () => {
    const updatedPhotos = [PHOTO_A_MOVED, PHOTO_B]
    mockApi.previewOrganize.mockResolvedValue([OP_A, OP_B])
    mockApi.executeOrganize.mockResolvedValue(
      makeExecuteResult([MOVE_PAIR_A], ['/root/2024/b.jpg: permission denied'], 2, updatedPhotos)
    )
    mockApi.undoOrganize.mockResolvedValue(makeUndoResult([MOVE_PAIR_A]))
    const { result } = renderHook(() => useOrganizerState(), { wrapper: makeWrapper() })

    await act(() => result.current.handlePreview())
    await act(() => result.current.handleConfirm())

    expect(result.current.status).toBe('done')
    expect(result.current.movedCount).toBe(1)
    expect(result.current.error).toBe(
      '1 of 2 file(s) could not be moved:\n/root/2024/b.jpg: permission denied'
    )
    expect(mockSetPhotos).toHaveBeenCalledOnce()
    expect(mockSetPhotos.mock.calls[0][0]).toBe(updatedPhotos)

    await act(() => result.current.handleUndo())

    expect(mockApi.undoOrganize).toHaveBeenCalledWith([MOVE_PAIR_A])
  })

  it('handleConfirm keeps preview state when all moves fail', async () => {
    mockApi.previewOrganize.mockResolvedValue([OP_A, OP_B])
    mockApi.executeOrganize.mockResolvedValue(
      makeExecuteResult(
        [],
        ['/root/2024/a.jpg: permission denied', '/root/2024/b.jpg: permission denied'],
        2
      )
    )
    const { result } = renderHook(() => useOrganizerState(), { wrapper: makeWrapper() })

    await act(() => result.current.handlePreview())
    await act(() => result.current.handleConfirm())

    expect(result.current.status).toBe('preview')
    expect(result.current.movedCount).toBe(0)
    expect(result.current.error).toBe(
      '2 of 2 file(s) could not be moved:\n' +
        '/root/2024/a.jpg: permission denied\n' +
        '/root/2024/b.jpg: permission denied'
    )
    expect(mockSetPhotos).not.toHaveBeenCalled()
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
    const movedPhotos = [PHOTO_A_MOVED, PHOTO_B]
    mockApi.previewOrganize.mockResolvedValue([OP_A])
    mockApi.executeOrganize.mockResolvedValue(makeExecuteResult([MOVE_PAIR_A], [], 1, movedPhotos))
    mockApi.undoOrganize.mockResolvedValue(makeUndoResult([MOVE_PAIR_A], [], 1, PHOTOS))
    const { result } = renderHook(() => useOrganizerState(), { wrapper: makeWrapper() })

    await act(() => result.current.handlePreview())
    await act(() => result.current.handleConfirm())
    await act(() => result.current.handleUndo())

    expect(result.current.status).toBe('undone')
    expect(result.current.error).toBeNull()
    expect(mockSetPhotos).toHaveBeenLastCalledWith(PHOTOS)
    expect(result.current.movedCount).toBe(0)
  })

  it('handleUndo passes the correct pairs to undoOrganize', async () => {
    mockApi.previewOrganize.mockResolvedValue([OP_A])
    mockApi.executeOrganize.mockResolvedValue(makeExecuteResult([MOVE_PAIR_A]))
    mockApi.undoOrganize.mockResolvedValue(makeUndoResult([MOVE_PAIR_A]))
    const { result } = renderHook(() => useOrganizerState(), { wrapper: makeWrapper() })

    await act(() => result.current.handlePreview())
    await act(() => result.current.handleConfirm())
    await act(() => result.current.handleUndo())

    expect(mockApi.undoOrganize).toHaveBeenCalledWith([{ from: PHOTO_A.path, to: OP_A.targetPath }])
  })

  it('handleUndo keeps failed pairs available when undo is partial', async () => {
    const movedPhotos = [PHOTO_A_MOVED, PHOTO_B_MOVED]
    const partialUndoPhotos = [PHOTO_A, PHOTO_B_MOVED]
    mockApi.previewOrganize.mockResolvedValue([OP_A, OP_B])
    mockApi.executeOrganize.mockResolvedValue(
      makeExecuteResult([MOVE_PAIR_A, MOVE_PAIR_B], [], 2, movedPhotos)
    )
    mockApi.undoOrganize
      .mockResolvedValueOnce(
        makeUndoResult(
          [MOVE_PAIR_A],
          [`${OP_B.targetPath}: permission denied`],
          2,
          partialUndoPhotos
        )
      )
      .mockResolvedValueOnce(makeUndoResult([MOVE_PAIR_B], [], 1, PHOTOS))
    const { result } = renderHook(() => useOrganizerState(), { wrapper: makeWrapper() })

    await act(() => result.current.handlePreview())
    await act(() => result.current.handleConfirm())
    await act(() => result.current.handleUndo())

    expect(result.current.status).toBe('done')
    expect(result.current.movedCount).toBe(1)
    expect(result.current.error).toBe(
      `1 of 2 file(s) could not be reverted:\n${OP_B.targetPath}: permission denied`
    )
    expect(mockSetPhotos).toHaveBeenLastCalledWith(partialUndoPhotos)

    await act(() => result.current.handleUndo())

    expect(mockApi.undoOrganize).toHaveBeenLastCalledWith([MOVE_PAIR_B])
  })

  it('handleUndo on failure returns to done with error', async () => {
    mockApi.previewOrganize.mockResolvedValue([OP_A])
    mockApi.executeOrganize.mockResolvedValue(makeExecuteResult([MOVE_PAIR_A]))
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
    mockApi.executeOrganize.mockResolvedValue(makeExecuteResult([MOVE_PAIR_A, MOVE_PAIR_B]))
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
