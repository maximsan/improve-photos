import { useMemo } from 'react'
import { CalendarCheck, AlertTriangle } from 'lucide-react'
import { TreeNodeView } from './TreeNodeView'
import { buildTree } from '../utils/tree'
import type { MoveOperation } from '@shared/ipc'

interface PreviewViewProps {
  ops: MoveOperation[]
  onConfirm: () => void
  onCancel: () => void
}

export function PreviewView({ ops, onConfirm, onCancel }: PreviewViewProps): React.JSX.Element {
  const { conflictCount, moveCount, tree } = useMemo(() => {
    let conflictCount = 0
    let moveCount = 0
    for (const op of ops) {
      if (op.conflict) conflictCount++
      else moveCount++
    }
    return { conflictCount, moveCount, tree: buildTree(ops) }
  }, [ops])

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-5 py-3 border-b border-surface-200 bg-white flex items-center gap-4">
        <span className="text-[12px] text-surface-600">
          <span className="font-semibold text-surface-900">{moveCount}</span> files to move
        </span>
        {conflictCount > 0 && (
          <span className="flex items-center gap-1.5 text-[12px] text-amber-700">
            <AlertTriangle size={12} className="text-amber-500" />
            <span className="font-semibold">{conflictCount}</span> conflict
            {conflictCount !== 1 ? 's' : ''} — will be skipped
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {[...tree.children.values()].map((child) => (
          <TreeNodeView key={child.name} node={child} depth={0} />
        ))}
      </div>

      <div className="shrink-0 px-5 py-4 border-t border-surface-200 bg-white flex items-center justify-between gap-3">
        <button
          onClick={onCancel}
          className="text-[12px] font-medium text-surface-500 hover:text-surface-800 transition-colors cursor-default"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={moveCount === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-default"
        >
          <CalendarCheck size={14} strokeWidth={2} />
          Move {moveCount} File{moveCount !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  )
}
