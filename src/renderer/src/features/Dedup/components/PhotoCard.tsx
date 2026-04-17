import { Trash2 } from 'lucide-react'
import { formatBytes, fileUrl } from '@renderer/lib/format'
import type { PhotoRecord } from '@shared/ipc'

interface PhotoCardProps {
  photo: PhotoRecord
  isBest: boolean
  markedForTrash: boolean
  onToggle: () => void
}

export function PhotoCard({
  photo,
  isBest,
  markedForTrash,
  onToggle
}: PhotoCardProps): React.JSX.Element {
  return (
    <div
      className={`relative flex flex-col rounded-xl overflow-hidden border transition-all duration-150 cursor-default select-none ${
        markedForTrash
          ? 'border-red-300 shadow-sm shadow-red-100 opacity-70'
          : 'border-surface-200 hover:border-surface-300'
      }`}
      onClick={onToggle}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-square bg-surface-100 overflow-hidden">
        <img
          src={fileUrl(photo.path)}
          alt={photo.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
        {markedForTrash && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center shadow-md">
              <Trash2 size={16} strokeWidth={2} className="text-white" />
            </div>
          </div>
        )}
        {isBest && !markedForTrash && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary-500 text-white text-[10px] font-semibold tracking-wide">
            BEST
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 py-2.5 bg-white">
        <p className="text-[11px] font-medium text-surface-700 truncate" title={photo.name}>
          {photo.name}
        </p>
        <p className="text-[10px] text-surface-400 mt-0.5">{formatBytes(photo.size)}</p>
      </div>

      {/* Checkbox row */}
      <div className="px-3 pb-2.5 bg-white flex items-center gap-1.5">
        <div
          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
            markedForTrash ? 'bg-red-500 border-red-500' : 'border-surface-300 bg-white'
          }`}
        >
          {markedForTrash && (
            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
              <path
                d="M1 3L3 5L7 1"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <span className="text-[10px] text-surface-500">
          {markedForTrash ? 'Marked for trash' : 'Keep'}
        </span>
      </div>
    </div>
  )
}
