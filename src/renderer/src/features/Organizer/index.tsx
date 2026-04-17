import { useState, useMemo } from 'react'
import {
  CalendarCheck,
  FolderOpen,
  FolderClosed,
  ArrowRight,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react'
import PanelHeader from '../../components/PanelHeader'
import EmptyState from '../../components/EmptyState'
import SpinnerView from '../../components/SpinnerView'
import { usePhotos } from '../../context/photos'
import type { MoveOperation } from '@shared/ipc'

type OrganizerStatus = 'idle' | 'previewing' | 'preview' | 'moving' | 'done'

const DEFAULT_TREE_OPEN_DEPTH = 3

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the last N segments of an absolute path for compact display. */
function shortPath(fullPath: string, segments = 4): string {
  const parts = fullPath.split('/')
  return parts.slice(-segments).join('/')
}

interface TreeNode {
  name: string
  children: Map<string, TreeNode>
  ops: MoveOperation[]
}

function buildTree(ops: MoveOperation[]): TreeNode {
  const root: TreeNode = { name: '', children: new Map(), ops: [] }
  for (const op of ops) {
    const parts = op.targetPath.split('/').filter(Boolean)
    let node = root
    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i]
      if (!node.children.has(seg)) {
        node.children.set(seg, { name: seg, children: new Map(), ops: [] })
      }
      // children.has(seg) was asserted above, so the value is always present
      const next = node.children.get(seg)
      if (next) node = next
    }
    node.ops.push(op)
  }
  return root
}

// ─── Tree node component ──────────────────────────────────────────────────────

interface TreeNodeViewProps {
  node: TreeNode
  depth: number
}

function TreeNodeView({ node, depth }: TreeNodeViewProps): React.JSX.Element {
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

// ─── Move row ─────────────────────────────────────────────────────────────────

interface MoveRowProps {
  op: MoveOperation
  indent: number
}

function MoveRow({ op, indent }: MoveRowProps): React.JSX.Element {
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

// ─── Preview view ─────────────────────────────────────────────────────────────

interface PreviewViewProps {
  ops: MoveOperation[]
  onConfirm: () => void
  onCancel: () => void
}

function PreviewView({ ops, onConfirm, onCancel }: PreviewViewProps): React.JSX.Element {
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
      {/* Stats bar */}
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

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-4">
        {[...tree.children.values()].map((child) => (
          <TreeNodeView key={child.name} node={child} depth={0} />
        ))}
      </div>

      {/* Action bar */}
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

// ─── Done view ────────────────────────────────────────────────────────────────

function DoneView({ count }: { count: number }): React.JSX.Element {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5">
      <div className="w-18 h-18 rounded-2xl flex items-center justify-center bg-primary-100">
        <CheckCircle2 size={34} strokeWidth={1.4} className="text-primary-600" />
      </div>
      <div className="text-center">
        <h2 className="text-[16px] font-semibold text-surface-800">
          {count} file{count !== 1 ? 's' : ''} organised
        </h2>
        <p className="text-[13px] mt-1 text-surface-500">
          Photos have been moved into their date folders.
        </p>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

function Organizer(): React.JSX.Element {
  const { photos, setPhotos } = usePhotos()
  const [status, setStatus] = useState<OrganizerStatus>('idle')
  const [ops, setOps] = useState<MoveOperation[]>([])
  const [movedCount, setMovedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const hasPhotos = photos.length > 0

  async function handlePreview(): Promise<void> {
    setError(null)
    setStatus('previewing')
    try {
      const result = await window.api.previewOrganize(photos)
      setOps(result)
      setStatus('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed')
      setStatus('idle')
    }
  }

  async function handleConfirm(): Promise<void> {
    setStatus('moving')
    try {
      await window.api.executeOrganize(ops)
      const { moved, movedPaths } = ops.reduce<{ moved: number; movedPaths: Map<string, string> }>(
        (acc, op) => {
          if (!op.conflict) {
            acc.moved++
            acc.movedPaths.set(op.photo.path, op.targetPath)
          }
          return acc
        },
        { moved: 0, movedPaths: new Map() }
      )
      setMovedCount(moved)
      setPhotos(
        photos.map((p) => {
          const newPath = movedPaths.get(p.path)
          return newPath ? { ...p, path: newPath, name: newPath.split('/').pop() ?? p.name } : p
        })
      )
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Move failed')
      setStatus('preview')
    }
  }

  function renderBody(): React.JSX.Element {
    if (status === 'previewing') return <SpinnerView message="Building folder preview…" />
    if (status === 'moving') return <SpinnerView message="Moving files…" />
    if (status === 'done') return <DoneView count={movedCount} />

    if (status === 'preview') {
      return (
        <>
          {ops.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 size={34} strokeWidth={1.4} className="text-primary-600" />}
              warm
              title="Already organised"
              body="All photos are already in their correct date folders. Nothing to move."
              footer={
                <button
                  onClick={() => setStatus('idle')}
                  className="text-[12px] font-medium text-surface-500 hover:text-surface-700 cursor-default transition-colors"
                >
                  Back
                </button>
              }
            />
          ) : (
            <PreviewView ops={ops} onConfirm={handleConfirm} onCancel={() => setStatus('idle')} />
          )}
          {error && (
            <p className="shrink-0 px-5 pb-3 text-[11px] text-red-500 text-center">{error}</p>
          )}
        </>
      )
    }

    // idle
    return !hasPhotos ? (
      <EmptyState
        icon={<CalendarCheck size={34} strokeWidth={1.4} className="text-surface-500" />}
        title="Organize by date"
        body={
          <>
            Preview the proposed <span className="font-mono">YYYY/MM/DD</span> folder structure
            before any files are moved.
          </>
        }
        needsScan
      />
    ) : (
      <EmptyState
        icon={<CalendarCheck size={34} strokeWidth={1.4} className="text-primary-600" />}
        warm
        title="Ready to organise"
        body={
          <>
            <span className="font-semibold text-surface-700">{photos.length}</span> photos loaded. A
            dry-run preview shows exactly which files will move before anything changes.
          </>
        }
        footer={
          <>
            <button
              onClick={handlePreview}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-medium text-white cursor-default bg-primary-500 hover:bg-primary-600 transition-colors duration-150"
            >
              <FolderOpen size={15} strokeWidth={2} />
              Preview Changes
            </button>
            {error && <p className="text-[11px] text-red-500">{error}</p>}
          </>
        }
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      <PanelHeader
        title="Organize"
        subtitle="Move photos into date-based folders using EXIF metadata"
      />
      {renderBody()}
    </div>
  )
}

export default Organizer
