import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { PhotoTile } from './PhotoTile'
import type { Tier } from '../tiers'
import type { PhotoRecord, BlurScores } from '@shared/ipc'

interface TierSectionProps {
  tier: Tier
  tierPhotos: PhotoRecord[]
  scores: BlurScores
  selected: Set<string>
  onToggle: (path: string) => void
  onSelectAll: (paths: string[], select: boolean) => void
  defaultCollapsed?: boolean
}

export function TierSection({
  tier,
  tierPhotos,
  scores,
  selected,
  onToggle,
  onSelectAll,
  defaultCollapsed
}: TierSectionProps): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(defaultCollapsed ?? tier.defaultCollapsed)

  const paths = tierPhotos.map((p) => p.path)
  const allSelected = paths.every((p) => selected.has(p))

  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-50 border-b border-surface-100 sticky top-0 z-10">
        <span className={`w-2 h-2 rounded-full shrink-0 ${tier.dotColor}`} />
        <span className="text-[12px] font-semibold text-surface-700 flex-1">{tier.label}</span>
        <span className={`text-[11px] font-medium ${tier.countColor}`}>
          {tierPhotos.length} photo{tierPhotos.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => onSelectAll(paths, !allSelected)}
          className="text-[11px] font-medium text-surface-400 hover:text-surface-700 transition-colors cursor-pointer ml-3"
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="text-surface-400 hover:text-surface-600 transition-colors cursor-pointer ml-1"
        >
          <ChevronDown
            size={14}
            className={`transition-transform duration-150 ${collapsed ? '-rotate-90' : ''}`}
          />
        </button>
      </div>

      {!collapsed && (
        <div className="grid grid-cols-4 gap-3 p-4">
          {tierPhotos.map((photo) => (
            <PhotoTile
              key={photo.path}
              photo={photo}
              score={scores[photo.path] ?? 0}
              selected={selected.has(photo.path)}
              onToggle={() => onToggle(photo.path)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
