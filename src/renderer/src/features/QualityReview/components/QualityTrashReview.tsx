import { formatBytes, fileUrl } from '@renderer/lib/format'
import { TrashReviewChrome } from '@renderer/components/TrashReviewChrome'
import { scoreLabel } from '../scoreLabel'
import type { PhotoRecord, BlurScores } from '@shared/ipc'

interface QualityTrashReviewProps {
  photos: PhotoRecord[]
  scores: BlurScores
  selected: Set<string>
  onBack: () => void
  onConfirm: () => void
}

export function QualityTrashReview({
  photos,
  scores,
  selected,
  onBack,
  onConfirm
}: QualityTrashReviewProps): React.JSX.Element {
  const trashList = photos.filter((p) => selected.has(p.path))

  return (
    <TrashReviewChrome count={trashList.length} onBack={onBack} onConfirm={onConfirm}>
      {trashList.map((photo) => {
        const score = scores[photo.path] ?? 0
        const { label, color } = scoreLabel(score)
        return (
          <div
            key={photo.path}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-50 border border-surface-200"
          >
            <img
              src={fileUrl(photo.path)}
              alt={photo.name}
              className="w-10 h-10 rounded-lg object-cover shrink-0 bg-surface-200"
              draggable={false}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-surface-800 truncate">{photo.name}</p>
              <p className="text-[10px] text-surface-400 truncate">{photo.path}</p>
            </div>
            <span className={`text-[11px] font-semibold shrink-0 ${color}`}>{label}</span>
            <span className="text-[11px] text-surface-400 shrink-0">{formatBytes(photo.size)}</span>
          </div>
        )
      })}
    </TrashReviewChrome>
  )
}
