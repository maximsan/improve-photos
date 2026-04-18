import { fileUrl } from '@renderer/lib/format'
import { TrashOverlay } from '@renderer/components/TrashOverlay'

interface PhotoThumbnailProps {
  path: string
  name: string
  isBest: boolean
  markedForTrash: boolean
}

export function PhotoThumbnail({
  path,
  name,
  isBest,
  markedForTrash
}: PhotoThumbnailProps): React.JSX.Element {
  return (
    <div className="relative w-full aspect-square bg-surface-100 overflow-hidden">
      <img
        src={fileUrl(path)}
        alt={name}
        className="w-full h-full object-cover"
        draggable={false}
      />
      {markedForTrash && <TrashOverlay />}
      {isBest && !markedForTrash && (
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary-500 text-white text-[10px] font-semibold tracking-wide">
          BEST
        </div>
      )}
    </div>
  )
}
