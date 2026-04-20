import { fileUrl } from '@renderer/lib/format'
import { PhotoInfo } from '@renderer/components/PhotoInfo'
import { TrashOverlay } from '@renderer/components/TrashOverlay'
import { useLazyRef } from '@renderer/hooks/useLazyRef'
import { scoreLabel } from '../scoreLabel'
import type { PhotoRecord } from '@shared/ipc'

interface PhotoTileProps {
  photo: PhotoRecord
  score: number
  selected: boolean
  onToggle: () => void
  /** Global scoring percent (0–100). Present while scoring is in-flight and this photo has no score yet. */
  loadingPercent?: number
}

export function PhotoTile({
  photo,
  score,
  selected,
  onToggle,
  loadingPercent
}: PhotoTileProps): React.JSX.Element {
  const [containerRef, visible] = useLazyRef('10%')
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
      <div ref={containerRef} className="relative w-full aspect-square bg-surface-100 overflow-hidden">
        <img
          src={visible ? fileUrl(photo.path) : undefined}
          alt={photo.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
        {selected && <TrashOverlay onDeselect={onToggle} />}

        {loadingPercent !== undefined ? (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-2 border-white/30 border-t-white animate-spin absolute" />
              <span className="text-[11px] font-semibold text-white tabular-nums">
                {loadingPercent}%
              </span>
            </div>
          </div>
        ) : (
          <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/60 to-transparent px-2 py-2">
            <span className={`text-[10px] font-semibold ${color}`}>{label}</span>
          </div>
        )}
      </div>
      <PhotoInfo name={photo.name} size={photo.size} />
    </div>
  )
}
