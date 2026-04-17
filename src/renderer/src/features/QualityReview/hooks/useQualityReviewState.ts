import { useState } from 'react'
import { useSetToggle } from '../../../lib/useSetToggle'
import type { PhotoRecord, BlurScores } from '@shared/ipc'

export type QualityStatus = 'idle' | 'scoring' | 'results' | 'reviewing' | 'trashing' | 'done'

export type QualityReviewState = {
  status: QualityStatus
  scores: BlurScores
  selected: Set<string>
  error: string | null
  toggleSelect: (path: string) => void
  handleScore: () => Promise<void>
  handleConfirmTrash: () => Promise<void>
  setStatus: React.Dispatch<React.SetStateAction<QualityStatus>>
}

export function useQualityReviewState(photos: PhotoRecord[]): QualityReviewState {
  const [status, setStatus] = useState<QualityStatus>('idle')
  const [scores, setScores] = useState<BlurScores>({})
  const [selected, toggleSelect] = useSetToggle<string>()
  const [error, setError] = useState<string | null>(null)

  async function handleScore(): Promise<void> {
    setError(null)
    setStatus('scoring')
    try {
      const result = await window.api.getBlurScores(photos.map((p) => p.path))
      setScores(result)
      setStatus('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scoring failed')
      setStatus('idle')
    }
  }

  async function handleConfirmTrash(): Promise<void> {
    setStatus('trashing')
    try {
      await window.api.trashFiles([...selected])
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trash failed')
      setStatus('reviewing')
    }
  }

  return {
    status,
    scores,
    selected,
    error,
    toggleSelect,
    handleScore,
    handleConfirmTrash,
    setStatus
  }
}
