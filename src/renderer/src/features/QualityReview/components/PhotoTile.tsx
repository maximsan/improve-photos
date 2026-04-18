import { fileUrl } from '@renderer/lib/format'
import { PhotoInfo } from '@renderer/components/PhotoInfo'
import { TrashOverlay } from '@renderer/components/TrashOverlay'
import { scoreLabel } from '../scoreLabel'
import type { PhotoRecord } from '@shared/ipc'

interface PhotoTileProps {
  photo: PhotoRecord
  score: number
  selected: boolean
  onToggle: () => void
}

export function PhotoTile({ photo, score, selected, onToggle }: PhotoTileProps): React.JSX.Element {
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
        {selected && <TrashOverlay />}
        <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/60 to-transparent px-2 py-2">
          <span className={`text-[10px] font-semibold ${color}`}>{label}</span>
        </div>
      </div>
      <PhotoInfo name={photo.name} size={photo.size} />
    </div>
  )
}
