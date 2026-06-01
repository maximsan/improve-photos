import { useRef, useState } from 'react'
import { usePhotos } from '../../../context/photos'
import type { PhotoRecord, ScanLimit, ScanProgress } from '@shared/ipc'

type ScanStatus = 'idle' | 'scanning' | 'done' | 'limit'

const MAX_FILENAME_CHARS = 40

// Strips Electron's "Error invoking remote method 'x': Error: …" wrapper for display.
const REMOTE_METHOD_PREFIX_PATTERN = /^Error invoking remote method '[^']*':\s*(?:Error:\s*)?/

function toDisplayMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(REMOTE_METHOD_PREFIX_PATTERN, '')
  }
  return 'Scan failed'
}

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
  limit: ScanLimit | null
  progress: ScanProgress | null
  handleChooseFolder: () => Promise<void>
  handleRescan: () => Promise<void>
  handleReset: () => void
}

export function useScannerState(): ScannerState {
  const { setPhotos, setScanRoot, bumpScanRevision } = usePhotos()
  const [status, setStatus] = useState<ScanStatus>('idle')
  const [localPhotos, setLocalPhotos] = useState<PhotoRecord[]>([])
  const [folderPath, setFolderPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState<ScanLimit | null>(null)
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

  function applyScannedPhotos(scannedPhotos: PhotoRecord[], path: string): void {
    setLimit(null)
    setLocalPhotos(scannedPhotos)
    setPhotos(scannedPhotos)
    setScanRoot(path)
    bumpScanRevision()
    setStatus('done')
  }

  async function handleChooseFolder(): Promise<void> {
    setError(null)
    setLimit(null)
    try {
      const path = await window.api.pickFolder()
      if (!path) {
        return
      }

      setFolderPath(path)
      setStatus('scanning')
      startProgress()
      const result = await window.api.scan(path)
      if (!result.ok) {
        setLimit(result.limit)
        setStatus('limit')
        return
      }
      applyScannedPhotos(result.photos, path)
    } catch (err) {
      console.error('[scanner] scan failed', err)
      setError(toDisplayMessage(err))
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
    setLimit(null)
    setStatus('scanning')
    startProgress()
    try {
      const result = await window.api.scan(folderPath)
      if (!result.ok) {
        setLimit(result.limit)
        setStatus('limit')
        return
      }
      applyScannedPhotos(result.photos, folderPath)
    } catch (err) {
      console.error('[scanner] rescan failed', err)
      setError(toDisplayMessage(err))
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
    setLimit(null)
    setPhotos([])
    setScanRoot(null)
    bumpScanRevision()
  }

  return {
    status,
    localPhotos,
    folderPath,
    error,
    limit,
    progress,
    handleChooseFolder,
    handleRescan,
    handleReset
  }
}
