import { Trash2 } from 'lucide-react'
import { formatBytes, fileUrl } from '@renderer/lib/format'
import { scoreLabel } from '../scoreLabel'
import type { PhotoRecord } from '@shared/ipc'

interface PhotoTileProps {
  photo: PhotoRecord
  score: number
  selected: boolean
  onToggle: () => void
}

export function PhotoTile({
  photo,
  score,
  selected,
  onToggle
}: PhotoTileProps): React.JSX.Element {
  const { label, color } = scoreLabel(score)

  return (
    <div
      onClick={onToggle}
      className={`relative flex flex-col rounded-xl overflow-hidden border transition-all duration-150 cursor-default select-none ${
        selected
          ? 'border-red-300 shadow-sm shadow-red-100 opacity-70'
          : 'border-surface-200 hover:border-surface-300'
      }`}
    >
      <div className="relative w-full aspect-square bg-surface-100 overflow-hidden">
        <img
          src={fileUrl(photo.path)}
          alt={photo.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
        {selected && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center shadow-md">
              <Trash2 size={16} strokeWidth={2} className="text-white" />
            </div>
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/60 to-transparent px-2 py-2">
          <span className={`text-[10px] font-semibold ${color}`}>{label}</span>
        </div>
      </div>

      <div className="px-2.5 py-2 bg-white">
        <p className="text-[11px] font-medium text-surface-700 truncate" title={photo.name}>
          {photo.name}
        </p>
        <p className="text-[10px] text-surface-400 mt-0.5">{formatBytes(photo.size)}</p>
      </div>
    </div>
  )
}
