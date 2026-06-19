import { useEffect, useRef, useState } from 'react'
import { usePhotos } from '../../../context/photos'
import type { MoveOperation } from '@shared/ipc'

const UNKNOWN_MOVE_FAILURE = 'Move failed'

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

function formatMoveErrors(errorCount: number, requestedCount: number, errors: string[]): string {
  return `${errorCount} of ${requestedCount} file(s) could not be moved:\n${errors.join('\n')}`
}

function formatUndoErrors(errorCount: number, requestedCount: number, errors: string[]): string {
  return `${errorCount} of ${requestedCount} file(s) could not be reverted:\n${errors.join('\n')}`
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
    setError(null)
    try {
      const movableCount = ops.filter((op) => !op.conflict).length
      const entitlement = await window.api.canProcessPhotoCount(movableCount)
      if (!entitlement.allowed) {
        setError(entitlement.reason ?? 'Photo limit exceeded')
        setStatus('preview')
        return
      }

      setStatus('moving')
      const result = await window.api.executeOrganize(ops)

      if (result.errors.length > 0) {
        setError(formatMoveErrors(result.errors.length, result.requestedCount, result.errors))
      }

      if (result.movedPairs.length > 0) {
        setMovedCount(result.movedCount)
        setMovedPairs(result.movedPairs)
        setPhotos(result.photos)
        setStatus('done')
        return
      }

      setMovedCount(0)
      setMovedPairs([])
      setStatus(result.errors.length > 0 ? 'preview' : 'done')
    } catch (err) {
      setError(err instanceof Error ? err.message : UNKNOWN_MOVE_FAILURE)
      setStatus('preview')
    }
  }

  async function handleUndo(): Promise<void> {
    setError(null)
    setStatus('undoing')
    try {
      const result = await window.api.undoOrganize(movedPairs)
      setPhotos(result.photos)
      if (result.errors.length > 0) {
        const undoneSources = new Set(result.undonePairs.map(({ from }) => from))
        setMovedPairs((currentPairs) => currentPairs.filter(({ from }) => !undoneSources.has(from)))
        setMovedCount(result.requestedCount - result.undoneCount)
        setError(formatUndoErrors(result.errors.length, result.requestedCount, result.errors))
        setStatus('done')
        return
      }
      setMovedPairs([])
      setMovedCount(0)
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
