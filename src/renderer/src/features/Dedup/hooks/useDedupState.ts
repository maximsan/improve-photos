import { useState } from 'react'
import { useSetToggle } from '../../../lib/useSetToggle'
import type { DuplicateGroup, PhotoRecord } from '@shared/ipc'

export type DedupStatus = 'idle' | 'computing' | 'results' | 'reviewing' | 'trashing' | 'done'

export type DedupState = {
  status: DedupStatus
  groups: DuplicateGroup[]
  toTrash: Set<string>
  error: string | null
  toggleTrash: (path: string) => void
  handleAnalyze: () => Promise<void>
  handleConfirmTrash: () => Promise<void>
  setStatus: React.Dispatch<React.SetStateAction<DedupStatus>>
}

export function useDedupState(photos: PhotoRecord[]): DedupState {
  const [status, setStatus] = useState<DedupStatus>('idle')
  const [groups, setGroups] = useState<DuplicateGroup[]>([])
  const [toTrash, toggleTrash] = useSetToggle<string>()
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze(): Promise<void> {
    setError(null)
    setStatus('computing')
    try {
      const hashes = await window.api.computeHashes(photos.map((p) => p.path))
      const found = await window.api.getDuplicateGroups(hashes)
      setGroups(found)
      setStatus('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setStatus('idle')
    }
  }

  async function handleConfirmTrash(): Promise<void> {
    setStatus('trashing')
    try {
      await window.api.trashFiles([...toTrash])
      setStatus('done')
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
    toggleTrash,
    handleAnalyze,
    handleConfirmTrash,
    setStatus
  }
}
