import { ArrowRight, AlertTriangle } from 'lucide-react'
import { shortPath } from '../utils/tree'
import type { MoveOperation } from '@shared/ipc'

interface MoveRowProps {
  op: MoveOperation
  indent: number
}

export function MoveRow({ op, indent }: MoveRowProps): React.JSX.Element {
  return (
    <div
      className="flex items-center gap-2 py-1.5 rounded hover:bg-surface-100 transition-colors"
      style={{ paddingLeft: `${indent}px`, paddingRight: '8px' }}
    >
      {op.conflict ? (
        <AlertTriangle size={11} className="text-amber-500 shrink-0" />
      ) : (
        <ArrowRight size={11} className="text-primary-400 shrink-0" />
      )}
      <span className="text-[11px] text-surface-400 truncate max-w-45" title={op.photo.path}>
        {shortPath(op.photo.path, 3)}
      </span>
      <ArrowRight size={10} className="text-surface-300 shrink-0" />
      <span className="text-[11px] font-medium text-surface-700 truncate" title={op.targetPath}>
        {op.photo.name}
      </span>
      {op.conflict && (
        <span className="ml-auto shrink-0 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
          conflict
        </span>
      )}
    </div>
  )
}
