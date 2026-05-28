import { useEffect, useRef, useState } from 'react'
import { usePhotos } from '../../../context/photos'
import type { MoveOperation } from '@shared/ipc'

export type OrganizerStatus =
  | 'idle'
  | 'previewing'
  | 'preview'
  | 'moving'
  | 'done'
  | 'undoing'
  | 'undone'

export type OrganizerState = {
  status: OrganizerStatus
  ops: MoveOperation[]
  movedCount: number
  scanRoot: string | null
  error: string | null
  handlePreview: () => Promise<void>
  handleConfirm: () => Promise<void>
  handleUndo: () => Promise<void>
  handleReset: () => void
  setStatus: React.Dispatch<React.SetStateAction<OrganizerStatus>>
}

export function useOrganizerState(): OrganizerState {
  const { photos, scanRoot, setPhotos, scanRevision } = usePhotos()
  const [status, setStatus] = useState<OrganizerStatus>('idle')
  const [ops, setOps] = useState<MoveOperation[]>([])
  const [movedCount, setMovedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [movedPairs, setMovedPairs] = useState<{ from: string; to: string }[]>([])
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
    if (!scanRoot) {
      setError('Scan a folder before previewing organize changes')
      setStatus('idle')
      return
    }

    try {
      const entitlement = await window.api.canProcessPhotoCount(photos.length)
      if (!entitlement.allowed) {
        setError(entitlement.reason ?? 'Photo limit exceeded')
        setStatus('idle')
        return
      }

      setStatus('previewing')
      const result = await window.api.previewOrganize(photos, scanRoot)
      setOps(result)
      setStatus('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed')
      setStatus('idle')
    }
  }

  async function handleConfirm(): Promise<void> {
    try {
      const movableCount = ops.filter((op) => !op.conflict).length
      const entitlement = await window.api.canProcessPhotoCount(movableCount)
      if (!entitlement.allowed) {
        setError(entitlement.reason ?? 'Photo limit exceeded')
        setStatus('preview')
        return
      }

      setStatus('moving')
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
      setMovedPairs(Array.from(movedPaths.entries()).map(([from, to]) => ({ from, to })))
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

  async function handleUndo(): Promise<void> {
    setError(null)
    setStatus('undoing')
    try {
      await window.api.undoOrganize(movedPairs)
      setPhotos(
        photos.map((p) => {
          const pair = movedPairs.find((mp) => mp.to === p.path)
          return pair ? { ...p, path: pair.from, name: pair.from.split('/').pop() ?? p.name } : p
        })
      )
      setMovedPairs([])
      setStatus('undone')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Undo failed')
      setStatus('done')
    }
  }

  function handleReset(): void {
    setStatus('idle')
    setOps([])
    setMovedCount(0)
    setMovedPairs([])
    setError(null)
  }

  return {
    status,
    ops,
    movedCount,
    scanRoot,
    error,
    handlePreview,
    handleConfirm,
    handleUndo,
    handleReset,
    setStatus
  }
}
