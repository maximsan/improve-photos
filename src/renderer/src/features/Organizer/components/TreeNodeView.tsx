import { useState } from 'react'
import { FolderOpen, FolderClosed } from 'lucide-react'
import { MoveRow } from './MoveRow'
import type { TreeNode } from '../utils/tree'

const DEFAULT_TREE_OPEN_DEPTH = 3

interface TreeNodeViewProps {
  node: TreeNode
  depth: number
}

export function TreeNodeView({ node, depth }: TreeNodeViewProps): React.JSX.Element {
  const [open, setOpen] = useState(depth < DEFAULT_TREE_OPEN_DEPTH)
  const hasChildren = node.children.size > 0
  const indent = depth * 16

  return (
    <div>
      {node.name && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 w-full text-left py-1 hover:bg-surface-100 rounded transition-colors cursor-default"
          style={{ paddingLeft: `${indent}px` }}
        >
          {hasChildren || node.ops.length > 0 ? (
            open ? (
              <FolderOpen size={13} className="text-primary-500 shrink-0" />
            ) : (
              <FolderClosed size={13} className="text-primary-500 shrink-0" />
            )
          ) : null}
          <span className="text-[12px] font-medium text-surface-700">{node.name}</span>
          {node.ops.length > 0 && (
            <span className="ml-auto mr-2 text-[10px] text-surface-400 font-medium">
              {node.ops.length} photo{node.ops.length !== 1 ? 's' : ''}
            </span>
          )}
        </button>
      )}

      {open && (
        <>
          {[...node.children.values()].map((child) => (
            <TreeNodeView key={child.name} node={child} depth={depth + 1} />
          ))}
          {node.ops.map((op) => (
            <MoveRow key={op.photo.path} op={op} indent={indent + 16} />
          ))}
        </>
      )}
    </div>
  )
}
