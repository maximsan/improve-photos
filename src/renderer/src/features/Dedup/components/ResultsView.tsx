import { ShieldCheck, Trash2 } from 'lucide-react'
import EmptyState from '../../../components/EmptyState'
import { DuplicateGroupCard } from './DuplicateGroupCard'
import type { DuplicateGroup } from '@shared/ipc'

interface ResultsViewProps {
  groups: DuplicateGroup[]
  toTrash: Set<string>
  onToggle: (path: string) => void
  onTrash: () => void
  onReview: () => void
  onReset: () => void
}

export function ResultsView({
  groups,
  toTrash,
  onToggle,
  onTrash,
  onReview,
  onReset
}: ResultsViewProps): React.JSX.Element {
  const trashCount = toTrash.size

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={<ShieldCheck size={34} strokeWidth={1.4} className="text-primary-600" />}
        warm
        title="No duplicates found"
        body="Every photo in this folder appears to be unique. Nothing to clean up here."
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {groups.map((group, i) => (
          <DuplicateGroupCard
            key={group.hash}
            group={group}
            groupIndex={i}
            toTrash={toTrash}
            onToggle={onToggle}
            onTrash={onTrash}
          />
        ))}
      </div>

      <div className="shrink-0 px-5 py-4 border-t border-surface-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-[12px] text-surface-500">
            {trashCount === 0 ? (
              'Select photos to mark for trash'
            ) : (
              <>
                <span className="font-semibold text-surface-800">{trashCount}</span> photo
                {trashCount !== 1 ? 's' : ''} selected
              </>
            )}
          </p>
          <button
            type="button"
            onClick={onReset}
            className="text-[12px] font-medium text-surface-400 hover:text-surface-700 cursor-default transition-colors duration-150"
          >
            Start over
          </button>
        </div>
        <div className="flex items-center gap-3">
          {trashCount > 0 && (
            <button
              onClick={onReview}
              className="text-[12px] text-surface-500 hover:text-surface-800 transition-colors duration-150 cursor-default"
            >
              Review →
            </button>
          )}
          <button
            onClick={onTrash}
            disabled={trashCount === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 cursor-default"
          >
            <Trash2 size={13} strokeWidth={2} />
            {trashCount > 0
              ? `Trash ${trashCount} photo${trashCount !== 1 ? 's' : ''}`
              : 'Trash selected'}
          </button>
        </div>
      </div>
    </div>
  )
}
