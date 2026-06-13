import { useEffect, useRef, useState } from 'react'
import { useSetToggle } from '../../../lib/useSetToggle'
import { usePhotos } from '../../../context/photos'
import type { DuplicateGroup, HashProgress, PhotoRecord } from '@shared/ipc'

export type DedupStatus = 'idle' | 'computing' | 'results' | 'reviewing' | 'trashing' | 'done'

export type DedupState = {
  status: DedupStatus
  groups: DuplicateGroup[]
  toTrash: Set<string>
  error: string | null
  progress: HashProgress | null
  toggleTrash: (path: string) => void
  handleAnalyze: () => Promise<void>
  handleCancel: () => void
  handleTrashWithConfirm: () => Promise<void>
  handleConfirmTrash: () => Promise<void>
  handleReset: () => void
  setStatus: React.Dispatch<React.SetStateAction<DedupStatus>>
}

export function useDedupState(photos: PhotoRecord[]): DedupState {
  const { scanRevision, removePhotosByPath } = usePhotos()
  const [status, setStatus] = useState<DedupStatus>('idle')
  const [groups, setGroups] = useState<DuplicateGroup[]>([])
  const [toTrash, toggleTrash, clearTrash] = useSetToggle<string>()
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<HashProgress | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const lastRevisionRef = useRef(scanRevision)
  const activeAnalysisRunRef = useRef(0)

  useEffect(() => {
    return () => {
      unsubscribeRef.current?.()
    }
  }, [])

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

  async function handleAnalyze(): Promise<void> {
    const analysisRunId = activeAnalysisRunRef.current + 1
    activeAnalysisRunRef.current = analysisRunId
    setError(null)
    setProgress(null)

    const entitlement = await window.api.canProcessPhotoCount(photos.length)
    if (activeAnalysisRunRef.current !== analysisRunId) {
      return
    }
    if (!entitlement.allowed) {
      setError(entitlement.reason ?? 'Photo limit exceeded')
      setStatus('idle')
      return
    }

    setStatus('computing')

    const unsubscribe = window.api.onHashProgress((nextProgress) => {
      if (activeAnalysisRunRef.current === analysisRunId) {
        setProgress(nextProgress)
      }
    })
    unsubscribeRef.current = unsubscribe

    try {
      const hashResult = await window.api.computeHashes(photos.map((p) => p.path))
      if (activeAnalysisRunRef.current !== analysisRunId) {
        return
      }
      if (hashResult.cancelled) {
        setStatus('idle')
        return
      }

      const found = await window.api.getDuplicateGroups(hashResult.hashes)
      if (activeAnalysisRunRef.current !== analysisRunId) {
        return
      }
      setGroups(found)
      setStatus('results')
    } catch (err) {
      if (activeAnalysisRunRef.current !== analysisRunId) {
        return
      }
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setStatus('idle')
    } finally {
      unsubscribe()
      if (unsubscribeRef.current === unsubscribe) {
        unsubscribeRef.current = null
      }
      if (activeAnalysisRunRef.current === analysisRunId) {
        setProgress(null)
      }
    }
  }

  function handleCancel(): void {
    activeAnalysisRunRef.current++
    window.api.cancelHashes()
    unsubscribeRef.current?.()
    unsubscribeRef.current = null
    setProgress(null)
    setStatus('idle')
  }

  function applyTrash(trashedPaths: Set<string>): void {
    removePhotosByPath([...trashedPaths])
    const remainingGroups = groups
      .map((g) => ({ ...g, photos: g.photos.filter((p) => !trashedPaths.has(p.path)) }))
      .filter((g) => g.photos.length >= 2)
    setGroups(remainingGroups)
    clearTrash()
    setStatus(remainingGroups.length > 0 ? 'results' : 'done')
  }

  /** Primary trash action — shows a native confirmation dialog first. */
  async function handleTrashWithConfirm(): Promise<void> {
    try {
      const entitlement = await window.api.canProcessPhotoCount(toTrash.size)
      if (!entitlement.allowed) {
        setError(entitlement.reason ?? 'Photo limit exceeded')
        setStatus('results')
        return
      }

      const confirmed = await window.api.confirmTrash(toTrash.size)
      if (!confirmed) {
        return
      }
      setStatus('trashing')
      const trashedPaths = new Set([...toTrash])
      await window.api.trashFiles([...trashedPaths])
      applyTrash(trashedPaths)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trash failed')
      setStatus('results')
    }
  }

  /** Used by ReviewScreen's confirm button after the user has inspected the list. */
  async function handleConfirmTrash(): Promise<void> {
    try {
      const entitlement = await window.api.canProcessPhotoCount(toTrash.size)
      if (!entitlement.allowed) {
        setError(entitlement.reason ?? 'Photo limit exceeded')
        setStatus('reviewing')
        return
      }

      setStatus('trashing')
      const trashedPaths = new Set([...toTrash])
      await window.api.trashFiles([...trashedPaths])
      applyTrash(trashedPaths)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trash failed')
      setStatus('reviewing')
    }
  }

  function handleReset(): void {
    activeAnalysisRunRef.current++
    setStatus('idle')
    setGroups([])
    clearTrash()
    setError(null)
    setProgress(null)
  }

  return {
    status,
    groups,
    toTrash,
    error,
    progress,
    toggleTrash,
    handleAnalyze,
    handleCancel,
    handleTrashWithConfirm,
    handleConfirmTrash,
    handleReset,
    setStatus
  }
}
