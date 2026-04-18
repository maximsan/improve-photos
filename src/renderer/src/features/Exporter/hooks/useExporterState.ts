import { useState } from 'react'
import { usePhotos } from '../../../context/photos'
import type { ExportProgress } from '@shared/ipc'
import type { Preset } from '../types'

export type ExporterStatus = 'idle' | 'exporting' | 'done'

export type ExporterState = {
  status: ExporterStatus
  outDir: string | null
  progress: ExportProgress | null
  exportedCount: number
  error: string | null
  handlePickFolder: () => Promise<void>
  handleExport: (presets: Preset[]) => Promise<void>
  reset: () => void
}

export function useExporterState(): ExporterState {
  const { photos } = usePhotos()
  const [status, setStatus] = useState<ExporterStatus>('idle')
  const [outDir, setOutDir] = useState<string | null>(null)
  const [progress, setProgress] = useState<ExportProgress | null>(null)
  const [exportedCount, setExportedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function handlePickFolder(): Promise<void> {
    const path = await window.api.pickFolder()
    if (path) setOutDir(path)
  }

  async function handleExport(presets: Preset[]): Promise<void> {
    if (!outDir) return
    setError(null)
    setProgress(null)
    setStatus('exporting')

    const ipcPresets = presets.map(({ name, width, height, quality, format }) => ({
      name,
      width,
      height,
      quality,
      format
    }))

    const unsubscribe = window.api.onExportProgress((p) => setProgress(p))
    try {
      await window.api.exportBatch(photos, ipcPresets, outDir)
      setExportedCount(photos.length * presets.length)
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
      setStatus('idle')
    } finally {
      unsubscribe()
    }
  }

  function reset(): void {
    setStatus('idle')
  }

  return { status, outDir, progress, exportedCount, error, handlePickFolder, handleExport, reset }
}
