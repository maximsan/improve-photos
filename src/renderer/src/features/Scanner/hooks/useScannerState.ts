import { useState } from 'react'
import { usePhotos } from '../../../context/photos'
import type { PhotoRecord } from '@shared/ipc'

type ScanStatus = 'idle' | 'scanning' | 'done'

export type ScannerState = {
  status: ScanStatus
  localPhotos: PhotoRecord[]
  folderPath: string | null
  error: string | null
  handleChooseFolder: () => Promise<void>
}

export function useScannerState(): ScannerState {
  const { setPhotos } = usePhotos()
  const [status, setStatus] = useState<ScanStatus>('idle')
  const [localPhotos, setLocalPhotos] = useState<PhotoRecord[]>([])
  const [folderPath, setFolderPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleChooseFolder(): Promise<void> {
    setError(null)
    try {
      const path = await window.api.pickFolder()
      if (!path) {
        return
      }

      setFolderPath(path)
      setStatus('scanning')
      const result = await window.api.scan(path)
      setLocalPhotos(result)
      setPhotos(result)
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed')
      setStatus('idle')
    }
  }

  return { status, localPhotos, folderPath, error, handleChooseFolder }
}
