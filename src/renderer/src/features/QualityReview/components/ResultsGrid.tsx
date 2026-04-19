import { useMemo } from 'react'
import { Trash2 } from 'lucide-react'
import { TierSection } from './TierSection'
import { TIERS } from '../tiers'
import type { PhotoRecord, BlurScores } from '@shared/ipc'

interface ResultsGridProps {
  photos: PhotoRecord[]
  scores: BlurScores
  selected: Set<string>
  onToggle: (path: string) => void
  onSelectAll: (paths: string[], select: boolean) => void
  onReview: () => void
  onReset: () => void
}

export function ResultsGrid({
  photos,
  scores,
  selected,
  onToggle,
  onSelectAll,
  onReview,
  onReset
}: ResultsGridProps): React.JSX.Element {
  const sorted = useMemo(
    () => [...photos].sort((a, b) => (scores[a.path] ?? 0) - (scores[b.path] ?? 0)),
    [photos, scores]
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {TIERS.map((tier) => {
          const tierPhotos = sorted.filter((p) => tier.test(scores[p.path] ?? 0))
          if (tierPhotos.length === 0) {
            return null
          }

          return (
            <TierSection
              key={tier.key}
              tier={tier}
              tierPhotos={tierPhotos}
              scores={scores}
              selected={selected}
              onToggle={onToggle}
              onSelectAll={onSelectAll}
            />
          )
        })}
      </div>

      <div className="shrink-0 px-5 py-4 border-t border-surface-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          {selected.size > 0 ? (
            <p className="text-[12px] text-surface-500">
              <span className="font-semibold text-surface-800">{selected.size}</span> photo
              {selected.size !== 1 ? 's' : ''} selected to trash
            </p>
          ) : (
            <p className="text-[12px] text-surface-500">Select photos to mark for trash</p>
          )}
          <button
            type="button"
            onClick={onReset}
            className="text-[12px] font-medium text-surface-400 hover:text-surface-700 cursor-default transition-colors duration-150"
          >
            Start over
          </button>
        </div>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={onReview}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors duration-150 cursor-default"
          >
            <Trash2 size={13} strokeWidth={2} />
            Review &amp; Trash
          </button>
        )}
      </div>
    </div>
  )
}
