import { useEffect, useRef, useState } from 'react'
import { useSetToggle } from '../../../lib/useSetToggle'
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
  setStatus: React.Dispatch<React.SetStateAction<DedupStatus>>
}

export function useDedupState(photos: PhotoRecord[]): DedupState {
  const [status, setStatus] = useState<DedupStatus>('idle')
  const [groups, setGroups] = useState<DuplicateGroup[]>([])
  const [toTrash, toggleTrash, clearTrash] = useSetToggle<string>()
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<HashProgress | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => {
      unsubscribeRef.current?.()
    }
  }, [])

  async function handleAnalyze(): Promise<void> {
    setError(null)
    setProgress(null)
    setStatus('computing')

    unsubscribeRef.current = window.api.onHashProgress(setProgress)

    try {
      const hashes = await window.api.computeHashes(photos.map((p) => p.path))
      const found = await window.api.getDuplicateGroups(hashes)
      setGroups(found)
      setStatus('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setStatus('idle')
    } finally {
      unsubscribeRef.current?.()
      unsubscribeRef.current = null
      setProgress(null)
    }
  }

  function handleCancel(): void {
    window.api.cancelHashes()
    unsubscribeRef.current?.()
    unsubscribeRef.current = null
    setProgress(null)
    setStatus('idle')
  }

  function applyTrash(trashedPaths: Set<string>): void {
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
    setStatus('trashing')
    try {
      const trashedPaths = new Set([...toTrash])
      await window.api.trashFiles([...trashedPaths])
      applyTrash(trashedPaths)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trash failed')
      setStatus('reviewing')
    }
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
    setStatus
  }
}
