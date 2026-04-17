import { ArrowLeft, AlertTriangle, Trash2 } from 'lucide-react'
import { formatBytes, fileUrl } from '@renderer/lib/format'
import type { DuplicateGroup } from '@shared/ipc'

interface ReviewScreenProps {
  groups: DuplicateGroup[]
  toTrash: Set<string>
  onBack: () => void
  onConfirm: () => void
}

export function ReviewScreen({
  groups,
  toTrash,
  onBack,
  onConfirm
}: ReviewScreenProps): React.JSX.Element {
  const trashList = groups.flatMap((g) => g.photos).filter((p) => toTrash.has(p.path))
  const hasAllTrashed = groups.some((g) => g.photos.every((p) => toTrash.has(p.path)))

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-surface-200 bg-white shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[12px] font-medium text-surface-500 hover:text-surface-800 transition-colors cursor-default"
        >
          <ArrowLeft size={13} strokeWidth={2} />
          Back
        </button>
        <span className="text-[13px] font-semibold text-surface-800">
          Review {trashList.length} photo{trashList.length !== 1 ? 's' : ''} to trash
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-2">
        {hasAllTrashed && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 mb-4">
            <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[12px] text-amber-700 leading-relaxed">
              One or more groups would be entirely trashed. Go back and keep at least one photo per
              group.
            </p>
          </div>
        )}
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
          </div>
        ))}
      </div>

      <div className="shrink-0 px-5 py-4 border-t border-surface-200 bg-white">
        <button
          onClick={onConfirm}
          disabled={hasAllTrashed}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-colors duration-150 cursor-default disabled:opacity-40 disabled:cursor-not-allowed bg-red-500 hover:bg-red-600 disabled:hover:bg-red-500"
        >
          <Trash2 size={14} strokeWidth={2} />
          Move {trashList.length} photo{trashList.length !== 1 ? 's' : ''} to Trash
        </button>
        <p className="text-center text-[10px] text-surface-400 mt-2">
          Files go to macOS Trash — you can restore them any time.
        </p>
      </div>
    </div>
  )
}
