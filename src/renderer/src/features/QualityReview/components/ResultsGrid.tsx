import { useMemo } from 'react'
import { Trash2, FolderOpen, RotateCcw } from 'lucide-react'
import { TierSection } from './TierSection'
import { PhotoTile } from './PhotoTile'
import { TIERS } from '../tiers'
import type { PhotoRecord, BlurScores, QualityProgress } from '@shared/ipc'

interface ResultsGridProps {
  photos: PhotoRecord[]
  scores: BlurScores
  selected: Set<string>
  isScoring: boolean
  progress: QualityProgress | null
  onToggle: (path: string) => void
  onSelectAll: (paths: string[], select: boolean) => void
  onReview: () => void
  /** Re-run analysis with the same photos */
  onReset: () => void
  /** Return to the initial idle state */
  onClear: () => void
}

export function ResultsGrid({
  photos,
  scores,
  selected,
  isScoring,
  progress,
  onToggle,
  onSelectAll,
  onReview,
  onReset,
  onClear
}: ResultsGridProps): React.JSX.Element {
  const sorted = useMemo(
    () => [...photos].sort((a, b) => (scores[a.path] ?? 0) - (scores[b.path] ?? 0)),
    [photos, scores]
  )

  const scoringPercent = progress ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {isScoring ? (
          <div className="grid grid-cols-4 gap-3 p-4">
            {photos.map((photo) => (
              <PhotoTile
                key={photo.path}
                photo={photo}
                score={scores[photo.path] ?? 0}
                selected={selected.has(photo.path)}
                onToggle={() => onToggle(photo.path)}
                loadingPercent={scores[photo.path] === undefined ? scoringPercent : undefined}
              />
            ))}
          </div>
        ) : (
          (() => {
            let firstRendered = false
            return TIERS.map((tier) => {
              const tierPhotos = sorted.filter((p) => tier.test(scores[p.path] ?? -1))
              if (tierPhotos.length === 0) {
                return null
              }

              const isFirst = !firstRendered
              firstRendered = true

              return (
                <TierSection
                  key={tier.key}
                  tier={tier}
                  tierPhotos={tierPhotos}
                  scores={scores}
                  selected={selected}
                  onToggle={onToggle}
                  onSelectAll={onSelectAll}
                  defaultCollapsed={isFirst ? false : undefined}
                />
              )
            })
          })()
        )}
      </div>

      <div className="shrink-0 px-5 py-4 border-t border-surface-200 bg-white flex items-center justify-between">
        <p className="text-[12px] text-surface-500">
          {isScoring ? (
            <>
              Scoring <span className="font-semibold text-surface-800">{progress?.done ?? 0}</span>
              {' / '}
              {progress?.total ?? photos.length}…
            </>
          ) : selected.size > 0 ? (
            <>
              <span className="font-semibold text-surface-800">{selected.size}</span> photo
              {selected.size !== 1 ? 's' : ''} selected to trash
            </>
          ) : (
            'Select photos to mark for trash'
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-surface-500 bg-white border border-dashed border-surface-300 hover:border-surface-400 hover:text-surface-700 hover:bg-surface-50 transition-colors duration-150 cursor-pointer"
          >
            <FolderOpen size={12} strokeWidth={2} />
            Change photos
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-surface-700 bg-white border border-surface-200 hover:border-surface-300 hover:bg-surface-50 transition-colors duration-150 cursor-pointer"
          >
            <RotateCcw size={12} strokeWidth={2} />
            Re-analyse
          </button>
          {!isScoring && selected.size > 0 && (
            <button
              type="button"
              onClick={onReview}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors duration-150 cursor-pointer"
            >
              <Trash2 size={13} strokeWidth={2} />
              Review &amp; Trash
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
