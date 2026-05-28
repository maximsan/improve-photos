// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createElement, type ReactElement, type ReactNode } from 'react'
import { PhotosContext } from '../../src/renderer/src/context/photos'
import { useExporterState } from '../../src/renderer/src/features/Exporter/hooks/useExporterState'
import type { PhotoRecord, ExportProgress, ExportPreset } from '../../src/shared/ipc'
import type { Preset } from '../../src/renderer/src/features/Exporter/types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PHOTO_A: PhotoRecord = {
  path: '/photos/a.jpg',
  name: 'a.jpg',
  size: 1000,
  dateTaken: null,
  width: 800,
  height: 600,
  camera: null
}
const PHOTO_B: PhotoRecord = { ...PHOTO_A, path: '/photos/b.jpg', name: 'b.jpg' }
const PHOTOS = [PHOTO_A, PHOTO_B]

const PRESET: Preset = { id: 'p1', name: 'Web', format: 'jpeg', quality: 80 }

// ─── Mock API + wrapper ────────────────────────────────────────────────────────

const mockUnsubscribe = vi.fn()
const mockApi = {
  pickFolder: vi.fn<() => Promise<string | null>>(),
  exportBatch:
    vi.fn<(photos: PhotoRecord[], presets: ExportPreset[], outDir: string) => Promise<void>>(),
  onExportProgress: vi.fn<(cb: (p: ExportProgress) => void) => () => void>(() => mockUnsubscribe)
}

function wrapper({ children }: { children: ReactNode }): ReactElement {
  return createElement(
    PhotosContext.Provider,
    {
      value: {
        photos: PHOTOS,
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
  mockApi.onExportProgress.mockReturnValue(mockUnsubscribe)
  Object.defineProperty(window, 'api', { value: mockApi, writable: true, configurable: true })
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useExporterState', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useExporterState(), { wrapper })
    expect(result.current.status).toBe('idle')
    expect(result.current.outDir).toBeNull()
    expect(result.current.progress).toBeNull()
    expect(result.current.exportedCount).toBe(0)
    expect(result.current.error).toBeNull()
  })

  it('handlePickFolder sets outDir when a path is returned', async () => {
    mockApi.pickFolder.mockResolvedValue('/output/dir')
    const { result } = renderHook(() => useExporterState(), { wrapper })

    await act(() => result.current.handlePickFolder())

    expect(result.current.outDir).toBe('/output/dir')
  })

  it('handlePickFolder does nothing when null is returned (dialog cancelled)', async () => {
    mockApi.pickFolder.mockResolvedValue(null)
    const { result } = renderHook(() => useExporterState(), { wrapper })

    await act(() => result.current.handlePickFolder())

    expect(result.current.outDir).toBeNull()
  })

  it('handleExport does nothing when outDir is not set', async () => {
    const { result } = renderHook(() => useExporterState(), { wrapper })

    await act(() => result.current.handleExport([PRESET]))

    expect(mockApi.exportBatch).not.toHaveBeenCalled()
    expect(result.current.status).toBe('idle')
  })

  it('handleExport transitions idle → exporting → done', async () => {
    mockApi.pickFolder.mockResolvedValue('/out')
    mockApi.exportBatch.mockResolvedValue(undefined)
    const { result } = renderHook(() => useExporterState(), { wrapper })

    await act(() => result.current.handlePickFolder())
    await act(() => result.current.handleExport([PRESET]))

    expect(result.current.status).toBe('done')
  })

  it('handleExport sets exportedCount to photos × presets', async () => {
    mockApi.pickFolder.mockResolvedValue('/out')
    mockApi.exportBatch.mockResolvedValue(undefined)
    const preset2: Preset = { ...PRESET, id: 'p2', name: 'HQ' }
    const { result } = renderHook(() => useExporterState(), { wrapper })

    await act(() => result.current.handlePickFolder())
    await act(() => result.current.handleExport([PRESET, preset2]))

    expect(result.current.exportedCount).toBe(4) // 2 photos × 2 presets
  })

  it('handleExport passes stripped presets (no id field) to exportBatch', async () => {
    mockApi.pickFolder.mockResolvedValue('/out')
    mockApi.exportBatch.mockResolvedValue(undefined)
    const { result } = renderHook(() => useExporterState(), { wrapper })

    await act(() => result.current.handlePickFolder())
    await act(() => result.current.handleExport([PRESET]))

    const [, sentPresets] = mockApi.exportBatch.mock.calls[0]
    expect(sentPresets[0]).not.toHaveProperty('id')
    expect(sentPresets[0]).toMatchObject({ name: 'Web', format: 'jpeg', quality: 80 })
  })

  it('handleExport on failure returns to idle with error', async () => {
    mockApi.pickFolder.mockResolvedValue('/out')
    mockApi.exportBatch.mockRejectedValue(new Error('disk full'))
    const { result } = renderHook(() => useExporterState(), { wrapper })

    await act(() => result.current.handlePickFolder())
    await act(() => result.current.handleExport([PRESET]))

    expect(result.current.status).toBe('idle')
    expect(result.current.error).toBe('disk full')
  })

  it('handleExport subscribes to progress and unsubscribes in finally', async () => {
    mockApi.pickFolder.mockResolvedValue('/out')
    mockApi.exportBatch.mockResolvedValue(undefined)
    const { result } = renderHook(() => useExporterState(), { wrapper })

    await act(() => result.current.handlePickFolder())
    await act(() => result.current.handleExport([PRESET]))

    expect(mockApi.onExportProgress).toHaveBeenCalledOnce()
    expect(mockUnsubscribe).toHaveBeenCalledOnce()
  })

  it('handleExport unsubscribes from progress even on failure', async () => {
    mockApi.pickFolder.mockResolvedValue('/out')
    mockApi.exportBatch.mockRejectedValue(new Error('fail'))
    const { result } = renderHook(() => useExporterState(), { wrapper })

    await act(() => result.current.handlePickFolder())
    await act(() => result.current.handleExport([PRESET]))

    expect(mockUnsubscribe).toHaveBeenCalledOnce()
  })

  it('progress state updates when onExportProgress callback fires', async () => {
    mockApi.pickFolder.mockResolvedValue('/out')
    let capturedCb: ((p: ExportProgress) => void) | null = null
    mockApi.onExportProgress.mockImplementation((cb: (p: ExportProgress) => void) => {
      capturedCb = cb
      return mockUnsubscribe
    })
    mockApi.exportBatch.mockImplementation(async () => {
      capturedCb?.({ done: 1, total: 2, currentPath: '/out/a.jpg' })
    })
    const { result } = renderHook(() => useExporterState(), { wrapper })

    await act(() => result.current.handlePickFolder())
    await act(() => result.current.handleExport([PRESET]))

    expect(result.current.progress).toMatchObject({ done: 1, total: 2 })
  })

  it('reset clears progress, exportedCount, and error', async () => {
    mockApi.pickFolder.mockResolvedValue('/out')
    mockApi.exportBatch.mockRejectedValue(new Error('fail'))
    const { result } = renderHook(() => useExporterState(), { wrapper })

    await act(() => result.current.handlePickFolder())
    await act(() => result.current.handleExport([PRESET]))
    act(() => result.current.reset())

    expect(result.current.status).toBe('idle')
    expect(result.current.error).toBeNull()
    expect(result.current.exportedCount).toBe(0)
    expect(result.current.progress).toBeNull()
  })
})
