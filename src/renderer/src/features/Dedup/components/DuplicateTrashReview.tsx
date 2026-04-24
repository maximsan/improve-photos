import { AlertTriangle, X } from 'lucide-react'
import { formatBytes, fileUrl } from '@renderer/lib/format'
import { TrashReviewChrome } from '@renderer/components/TrashReviewChrome'
import type { DuplicateGroup } from '@shared/ipc'

interface DuplicateTrashReviewProps {
  groups: DuplicateGroup[]
  toTrash: Set<string>
  onBack: () => void
  onConfirm: () => void
  onToggle: (path: string) => void
}

export function DuplicateTrashReview({
  groups,
  toTrash,
  onBack,
  onConfirm,
  onToggle
}: DuplicateTrashReviewProps): React.JSX.Element {
  const trashList = groups.flatMap((g) => g.photos).filter((p) => toTrash.has(p.path))
  const hasAllTrashed = groups.some((g) => g.photos.every((p) => toTrash.has(p.path)))

  const warning = hasAllTrashed ? (
    <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 mb-4">
      <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
      <p className="text-[12px] text-amber-700 leading-relaxed">
        One or more groups would be entirely trashed. Go back and keep at least one photo per group.
      </p>
    </div>
  ) : null

  return (
    <TrashReviewChrome
      count={trashList.length}
      onBack={onBack}
      onConfirm={onConfirm}
      confirmDisabled={hasAllTrashed}
      warning={warning}
    >
      {trashList.map((photo) => (
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
          <span className="text-[11px] text-surface-400 shrink-0">{formatBytes(photo.size)}</span>
          <button
            onClick={() => onToggle(photo.path)}
            title="Remove from trash list"
            className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-surface-400 hover:text-surface-700 hover:bg-surface-200 transition-colors duration-150 cursor-pointer"
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        </div>
      ))}
    </TrashReviewChrome>
  )
}
