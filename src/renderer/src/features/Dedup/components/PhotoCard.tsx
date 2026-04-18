import type { PhotoRecord } from '@shared/ipc'
import { PhotoInfo } from '@renderer/components/PhotoInfo'
import { PhotoThumbnail } from './PhotoThumbnail'
import { SelectionRow } from './SelectionRow'

interface PhotoCardProps {
  photo: PhotoRecord
  isBest: boolean
  markedForTrash: boolean
  onToggle: () => void
  onTrash?: () => void
}

export function PhotoCard({
  photo,
  isBest,
  markedForTrash,
  onToggle,
  onTrash
}: PhotoCardProps): React.JSX.Element {
  return (
    <div
      className={`relative flex flex-col rounded-xl overflow-hidden border transition-all duration-150 cursor-default select-none ${
        markedForTrash
          ? 'border-red-300 shadow-sm shadow-red-100 opacity-70'
          : 'border-surface-200 hover:border-surface-300'
      }`}
      onClick={markedForTrash ? undefined : onToggle}
    >
      <PhotoThumbnail
        path={photo.path}
        name={photo.name}
        isBest={isBest}
        markedForTrash={markedForTrash}
        onDeselect={onToggle}
        onTrash={onTrash}
      />
      <PhotoInfo name={photo.name} size={photo.size} />
      <SelectionRow markedForTrash={markedForTrash} onToggle={onToggle} />
    </div>
  )
}
