import { useRef, useState } from 'react'
import { usePhotos } from '../../../context/photos'
import type { PhotoRecord, ScanProgress } from '@shared/ipc'

type ScanStatus = 'idle' | 'scanning' | 'done'

const MAX_FILENAME_CHARS = 40

function truncateMiddle(name: string): string {
  if (name.length <= MAX_FILENAME_CHARS) {
    return name
  }
  const half = Math.floor((MAX_FILENAME_CHARS - 1) / 2)
  return `${name.slice(0, half)}…${name.slice(-half)}`
}

export type ScannerState = {
  status: ScanStatus
  localPhotos: PhotoRecord[]
  folderPath: string | null
  error: string | null
  progress: ScanProgress | null
  handleChooseFolder: () => Promise<void>
  handleRescan: () => Promise<void>
  handleReset: () => void
}

export function useScannerState(): ScannerState {
  const { setPhotos, bumpScanRevision } = usePhotos()
  const [status, setStatus] = useState<ScanStatus>('idle')
  const [localPhotos, setLocalPhotos] = useState<PhotoRecord[]>([])
  const [folderPath, setFolderPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<ScanProgress | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  function startProgress(): void {
    setProgress(null)
    unsubscribeRef.current = window.api.onScanProgress((p) =>
      setProgress({ ...p, current: truncateMiddle(p.current.split(/[\\/]/).pop() ?? p.current) })
    )
  }

  function stopProgress(): void {
    unsubscribeRef.current?.()
    unsubscribeRef.current = null
    setProgress(null)
  }

  async function handleChooseFolder(): Promise<void> {
    setError(null)
    try {
      const path = await window.api.pickFolder()
      if (!path) {
        return
      }

      setFolderPath(path)
      setStatus('scanning')
      startProgress()
      const result = await window.api.scan(path)
      setLocalPhotos(result)
      setPhotos(result)
      bumpScanRevision()
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed')
      setStatus('idle')
    } finally {
      stopProgress()
    }
  }

  async function handleRescan(): Promise<void> {
    if (!folderPath) {
      return
    }
    setError(null)
    setStatus('scanning')
    startProgress()
    try {
      const result = await window.api.scan(folderPath)
      setLocalPhotos(result)
      setPhotos(result)
      bumpScanRevision()
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed')
      setStatus('done')
    } finally {
      stopProgress()
    }
  }

  function handleReset(): void {
    setStatus('idle')
    setLocalPhotos([])
    setFolderPath(null)
    setError(null)
    setPhotos([])
    bumpScanRevision()
  }

  return {
    status,
    localPhotos,
    folderPath,
    error,
    progress,
    handleChooseFolder,
    handleRescan,
    handleReset
  }
}
