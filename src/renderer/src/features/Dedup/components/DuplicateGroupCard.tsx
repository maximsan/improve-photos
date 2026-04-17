import { AlertTriangle } from 'lucide-react'
import { PhotoCard } from './PhotoCard'
import type { DuplicateGroup } from '@shared/ipc'

const MAX_DUPLICATE_GRID_COLUMNS = 4

interface DuplicateGroupCardProps {
  group: DuplicateGroup
  groupIndex: number
  toTrash: Set<string>
  onToggle: (path: string) => void
}

export function DuplicateGroupCard({
  group,
  groupIndex,
  toTrash,
  onToggle
}: DuplicateGroupCardProps): React.JSX.Element {
  const allTrashed = group.photos.every((p) => toTrash.has(p.path))

  return (
    <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
        <span className="text-[12px] font-semibold text-surface-700">Group {groupIndex + 1}</span>
        <span className="text-[11px] text-surface-400">
          {group.photos.length} near-identical photos
        </span>
      </div>

      <div className="p-4">
        {allTrashed && (
          <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle size={13} className="text-amber-600 shrink-0" />
            <p className="text-[11px] text-amber-700">Keep at least one photo per group.</p>
          </div>
        )}
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${Math.min(group.photos.length, MAX_DUPLICATE_GRID_COLUMNS)}, 1fr)`
          }}
        >
          {group.photos.map((photo, i) => (
            <PhotoCard
              key={photo.path}
              photo={photo}
              isBest={i === 0}
              markedForTrash={toTrash.has(photo.path)}
              onToggle={() => onToggle(photo.path)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
