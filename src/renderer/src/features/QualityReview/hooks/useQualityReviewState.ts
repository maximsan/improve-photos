import { useEffect, useRef, useState } from 'react'
import { usePhotos } from '../../../context/photos'
import type { PhotoRecord, BlurScores, QualityProgress } from '@shared/ipc'

export type QualityStatus = 'idle' | 'scoring' | 'results' | 'reviewing' | 'trashing' | 'done'

export type QualityReviewState = {
  status: QualityStatus
  scores: BlurScores
  selected: Set<string>
  error: string | null
  progress: QualityProgress | null
  isScoring: boolean
  toggleSelect: (path: string) => void
  selectAll: (paths: string[], select: boolean) => void
  handleScore: () => Promise<void>
  handleConfirmTrash: () => Promise<void>
  handleReset: () => void
  setStatus: React.Dispatch<React.SetStateAction<QualityStatus>>
}

export function useQualityReviewState(photos: PhotoRecord[]): QualityReviewState {
  const { scanRevision } = usePhotos()
  const [status, setStatus] = useState<QualityStatus>('idle')
  const [scores, setScores] = useState<BlurScores>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<QualityProgress | null>(null)
  const [isScoring, setIsScoring] = useState(false)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const unsubscribeItemRef = useRef<(() => void) | null>(null)
  const lastRevisionRef = useRef(scanRevision)

  useEffect(() => {
    return () => {
      unsubscribeRef.current?.()
      unsubscribeItemRef.current?.()
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

  function toggleSelect(path: string): void {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  function selectAll(paths: string[], select: boolean): void {
    setSelected((prev) => {
      const next = new Set(prev)
      if (select) {
        paths.forEach((p) => next.add(p))
      } else {
        paths.forEach((p) => next.delete(p))
      }
      return next
    })
  }

  async function handleScore(): Promise<void> {
    setError(null)
    setSelected(new Set())
    setScores({})
    setProgress(null)
    setIsScoring(true)
    setStatus('results')

    unsubscribeRef.current = window.api.onQualityProgress(setProgress)
    unsubscribeItemRef.current = window.api.onQualityScoreItem((item) => {
      setScores((prev) => ({ ...prev, [item.path]: item.score }))
    })

    try {
      await window.api.getBlurScores(photos.map((p) => p.path))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scoring failed')
      setStatus('idle')
    } finally {
      unsubscribeRef.current?.()
      unsubscribeRef.current = null
      unsubscribeItemRef.current?.()
      unsubscribeItemRef.current = null
      setProgress(null)
      setIsScoring(false)
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

  function handleReset(): void {
    setStatus('idle')
    setScores({})
    setSelected(new Set())
    setError(null)
    setProgress(null)
    setIsScoring(false)
  }

  return {
    status,
    scores,
    selected,
    error,
    progress,
    isScoring,
    toggleSelect,
    selectAll,
    handleScore,
    handleConfirmTrash,
    handleReset,
    setStatus
  }
}
