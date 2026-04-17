import { useMemo } from 'react'
import { Trash2 } from 'lucide-react'
import { PhotoTile } from './PhotoTile'
import type { PhotoRecord, BlurScores } from '@shared/ipc'

interface ResultsGridProps {
  photos: PhotoRecord[]
  scores: BlurScores
  selected: Set<string>
  onToggle: (path: string) => void
  onReview: () => void
}

export function ResultsGrid({
  photos,
  scores,
  selected,
  onToggle,
  onReview
}: ResultsGridProps): React.JSX.Element {
  const sorted = useMemo(
    () => [...photos].sort((a, b) => (scores[a.path] ?? 0) - (scores[b.path] ?? 0)),
    [photos, scores]
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-4 gap-3">
          {sorted.map((photo) => (
            <PhotoTile
              key={photo.path}
              photo={photo}
              score={scores[photo.path] ?? 0}
              selected={selected.has(photo.path)}
              onToggle={() => onToggle(photo.path)}
            />
          ))}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="shrink-0 px-5 py-4 border-t border-surface-200 bg-white flex items-center justify-between">
          <p className="text-[12px] text-surface-500">
            <span className="font-semibold text-surface-800">{selected.size}</span> photo
            {selected.size !== 1 ? 's' : ''} selected to trash
          </p>
          <button
            onClick={onReview}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors duration-150 cursor-default"
          >
            <Trash2 size={13} strokeWidth={2} />
            Review &amp; Trash
          </button>
        </div>
      )}
    </div>
  )
}
