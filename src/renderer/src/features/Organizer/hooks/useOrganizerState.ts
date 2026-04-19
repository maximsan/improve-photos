import { useEffect, useRef, useState } from 'react'
import { usePhotos } from '../../../context/photos'
import type { MoveOperation } from '@shared/ipc'

export type OrganizerStatus = 'idle' | 'previewing' | 'preview' | 'moving' | 'done'

export type OrganizerState = {
  status: OrganizerStatus
  ops: MoveOperation[]
  movedCount: number
  error: string | null
  handlePreview: () => Promise<void>
  handleConfirm: () => Promise<void>
  handleReset: () => void
  setStatus: React.Dispatch<React.SetStateAction<OrganizerStatus>>
}

export function useOrganizerState(): OrganizerState {
  const { photos, setPhotos, scanRevision } = usePhotos()
  const [status, setStatus] = useState<OrganizerStatus>('idle')
  const [ops, setOps] = useState<MoveOperation[]>([])
  const [movedCount, setMovedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const lastRevisionRef = useRef(scanRevision)

  useEffect(() => {
    if (lastRevisionRef.current === scanRevision) {
      return
    }
    lastRevisionRef.current = scanRevision
    if (status !== 'idle') {
      handleReset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanRevision])

  async function handlePreview(): Promise<void> {
    setError(null)
    setStatus('previewing')
    try {
      const result = await window.api.previewOrganize(photos)
      setOps(result)
      setStatus('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed')
      setStatus('idle')
    }
  }

  async function handleConfirm(): Promise<void> {
    setStatus('moving')
    try {
      await window.api.executeOrganize(ops)
      const { moved, movedPaths } = ops.reduce<{ moved: number; movedPaths: Map<string, string> }>(
        (acc, op) => {
          if (!op.conflict) {
            acc.moved++
            acc.movedPaths.set(op.photo.path, op.targetPath)
          }
          return acc
        },
        { moved: 0, movedPaths: new Map() }
      )
      setMovedCount(moved)
      setPhotos(
        photos.map((p) => {
          const newPath = movedPaths.get(p.path)
          return newPath ? { ...p, path: newPath, name: newPath.split('/').pop() ?? p.name } : p
        })
      )
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Move failed')
      setStatus('preview')
    }
  }

  function handleReset(): void {
    setStatus('idle')
    setOps([])
    setMovedCount(0)
    setError(null)
  }

  return { status, ops, movedCount, error, handlePreview, handleConfirm, handleReset, setStatus }
}
