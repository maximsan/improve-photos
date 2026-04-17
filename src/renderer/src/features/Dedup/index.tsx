import { useState } from 'react'
import { Copy, Trash2, ShieldCheck, ArrowLeft, AlertTriangle } from 'lucide-react'
import { formatBytes, fileUrl } from '@renderer/lib/format'
import PanelHeader from '../../components/PanelHeader'
import EmptyState from '../../components/EmptyState'
import { usePhotos } from '../../context/photos'
import type { DuplicateGroup, PhotoRecord } from '@shared/ipc'

type DedupStatus = 'idle' | 'computing' | 'results' | 'reviewing' | 'trashing' | 'done'

// ─── Sub-views ────────────────────────────────────────────────────────────────

function ComputingView(): React.JSX.Element {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-primary-200 border-t-primary-500 animate-spin" />
      <p className="text-[13px] text-surface-500">Computing perceptual hashes…</p>
    </div>
  )
}

function TrashingView(): React.JSX.Element {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-red-200 border-t-red-400 animate-spin" />
      <p className="text-[13px] text-surface-500">Moving files to Trash…</p>
    </div>
  )
}

function DoneView(): React.JSX.Element {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5">
      <div className="w-18 h-18 rounded-2xl flex items-center justify-center bg-primary-100">
        <ShieldCheck size={34} strokeWidth={1.4} className="text-primary-600" />
      </div>
      <div className="text-center">
        <h2 className="text-[16px] font-semibold text-surface-800">Files moved to Trash</h2>
        <p className="text-[13px] mt-1 text-surface-500">
          You can undo this from the macOS Trash if needed.
        </p>
      </div>
    </div>
  )
}

// ─── Photo card ───────────────────────────────────────────────────────────────

interface PhotoCardProps {
  photo: PhotoRecord
  isBest: boolean
  markedForTrash: boolean
  onToggle: () => void
}

function PhotoCard({ photo, isBest, markedForTrash, onToggle }: PhotoCardProps): React.JSX.Element {
  return (
    <div
      className={`relative flex flex-col rounded-xl overflow-hidden border transition-all duration-150 cursor-default select-none ${
        markedForTrash
          ? 'border-red-300 shadow-sm shadow-red-100 opacity-70'
          : 'border-surface-200 hover:border-surface-300'
      }`}
      onClick={onToggle}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-square bg-surface-100 overflow-hidden">
        <img
          src={fileUrl(photo.path)}
          alt={photo.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
        {/* Trash overlay */}
        {markedForTrash && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center shadow-md">
              <Trash2 size={16} strokeWidth={2} className="text-white" />
            </div>
          </div>
        )}
        {/* Best badge */}
        {isBest && !markedForTrash && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary-500 text-white text-[10px] font-semibold tracking-wide">
            BEST
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 py-2.5 bg-white">
        <p className="text-[11px] font-medium text-surface-700 truncate" title={photo.name}>
          {photo.name}
        </p>
        <p className="text-[10px] text-surface-400 mt-0.5">{formatBytes(photo.size)}</p>
      </div>

      {/* Checkbox row */}
      <div className="px-3 pb-2.5 bg-white flex items-center gap-1.5">
        <div
          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
            markedForTrash ? 'bg-red-500 border-red-500' : 'border-surface-300 bg-white'
          }`}
        >
          {markedForTrash && (
            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
              <path
                d="M1 3L3 5L7 1"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <span className="text-[10px] text-surface-500">
          {markedForTrash ? 'Mark to trash' : 'Keep'}
        </span>
      </div>
    </div>
  )
}

// ─── Duplicate group card ─────────────────────────────────────────────────────

interface DuplicateGroupCardProps {
  group: DuplicateGroup
  groupIndex: number
  toTrash: Set<string>
  onToggle: (path: string) => void
}

function DuplicateGroupCard({
  group,
  groupIndex,
  toTrash,
  onToggle
}: DuplicateGroupCardProps): React.JSX.Element {
  const allTrashed = group.photos.every((p) => toTrash.has(p.path))

  return (
    <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
      {/* Group header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
        <span className="text-[12px] font-semibold text-surface-700">Group {groupIndex + 1}</span>
        <span className="text-[11px] text-surface-400">
          {group.photos.length} near-identical photos
        </span>
      </div>

      {/* Photos */}
      <div className="p-4">
        {allTrashed && (
          <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle size={13} className="text-amber-600 shrink-0" />
            <p className="text-[11px] text-amber-700">Keep at least one photo per group.</p>
          </div>
        )}
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${Math.min(group.photos.length, 4)}, 1fr)` }}
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

// ─── Review screen ────────────────────────────────────────────────────────────

interface ReviewScreenProps {
  groups: DuplicateGroup[]
  toTrash: Set<string>
  onBack: () => void
  onConfirm: () => void
}

function ReviewScreen({
  groups,
  toTrash,
  onBack,
  onConfirm
}: ReviewScreenProps): React.JSX.Element {
  const trashList = groups.flatMap((g) => g.photos).filter((p) => toTrash.has(p.path))

  const hasAllTrashed = groups.some((g) => g.photos.every((p) => toTrash.has(p.path)))

  return (
    <div className="flex flex-col h-full">
      {/* Back header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-surface-200 bg-white shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[12px] font-medium text-surface-500 hover:text-surface-800 transition-colors cursor-default"
        >
          <ArrowLeft size={13} strokeWidth={2} />
          Back
        </button>
        <span className="text-[13px] font-semibold text-surface-800">
          Review {trashList.length} photo{trashList.length !== 1 ? 's' : ''} to trash
        </span>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto p-5 space-y-2">
        {hasAllTrashed && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 mb-4">
            <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[12px] text-amber-700 leading-relaxed">
              One or more groups would be entirely trashed. Go back and keep at least one photo per
              group.
            </p>
          </div>
        )}
        {trashList.map((photo) => (
          <div
            key={photo.path}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-50 border border-surface-200"
          >
            <img
              src={fileUrl(photo.path)}
              alt={photo.name}
              className="w-10 h-10 rounded-lg object-cover shrink-0 bg-surface-200"
              draggable={false}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-surface-800 truncate">{photo.name}</p>
              <p className="text-[10px] text-surface-400 truncate">{photo.path}</p>
            </div>
            <span className="text-[11px] text-surface-400 shrink-0">{formatBytes(photo.size)}</span>
          </div>
        ))}
      </div>

      {/* Confirm bar */}
      <div className="shrink-0 px-5 py-4 border-t border-surface-200 bg-white">
        <button
          onClick={onConfirm}
          disabled={hasAllTrashed}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-colors duration-150 cursor-default disabled:opacity-40 disabled:cursor-not-allowed bg-red-500 hover:bg-red-600 disabled:hover:bg-red-500"
        >
          <Trash2 size={14} strokeWidth={2} />
          Move {trashList.length} photo{trashList.length !== 1 ? 's' : ''} to Trash
        </button>
        <p className="text-center text-[10px] text-surface-400 mt-2">
          Files go to macOS Trash — you can restore them any time.
        </p>
      </div>
    </div>
  )
}

// ─── Results view ─────────────────────────────────────────────────────────────

interface ResultsViewProps {
  groups: DuplicateGroup[]
  toTrash: Set<string>
  onToggle: (path: string) => void
  onReview: () => void
}

function ResultsView({ groups, toTrash, onToggle, onReview }: ResultsViewProps): React.JSX.Element {
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
          />
        ))}
      </div>

      {/* Bottom action bar */}
      {trashCount > 0 && (
        <div className="shrink-0 px-5 py-4 border-t border-surface-200 bg-white flex items-center justify-between">
          <p className="text-[12px] text-surface-500">
            <span className="font-semibold text-surface-800">{trashCount}</span> photo
            {trashCount !== 1 ? 's' : ''} selected to trash
          </p>
          <button
            onClick={onReview}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors duration-150 cursor-default"
          >
            <Trash2 size={13} strokeWidth={2} />
            Review &amp; Trash
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

function Dedup(): React.JSX.Element {
  const { photos } = usePhotos()
  const [status, setStatus] = useState<DedupStatus>('idle')
  const [groups, setGroups] = useState<DuplicateGroup[]>([])
  const [toTrash, setToTrash] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const hasPhotos = photos.length > 0

  const toggleTrash = (path: string): void => {
    setToTrash((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  async function handleAnalyze(): Promise<void> {
    setError(null)
    setToTrash(new Set())
    setStatus('computing')
    try {
      const hashes = await window.api.computeHashes(photos.map((p) => p.path))
      const found = await window.api.getDuplicateGroups(hashes)
      setGroups(found)
      setStatus('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setStatus('idle')
    }
  }

  async function handleConfirmTrash(): Promise<void> {
    setStatus('trashing')
    try {
      await window.api.trashFiles([...toTrash])
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trash failed')
      setStatus('reviewing')
    }
  }

  if (status === 'computing') {
    return (
      <div className="flex flex-col h-full">
        <PanelHeader
          title="Duplicates"
          subtitle="Find visually identical photos using perceptual hashing"
        />
        <ComputingView />
      </div>
    )
  }

  if (status === 'trashing') {
    return (
      <div className="flex flex-col h-full">
        <PanelHeader
          title="Duplicates"
          subtitle="Find visually identical photos using perceptual hashing"
        />
        <TrashingView />
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="flex flex-col h-full">
        <PanelHeader
          title="Duplicates"
          subtitle="Find visually identical photos using perceptual hashing"
        />
        <DoneView />
      </div>
    )
  }

  if (status === 'reviewing') {
    return (
      <div className="flex flex-col h-full">
        <PanelHeader
          title="Duplicates"
          subtitle="Find visually identical photos using perceptual hashing"
        />
        <ReviewScreen
          groups={groups}
          toTrash={toTrash}
          onBack={() => setStatus('results')}
          onConfirm={handleConfirmTrash}
        />
      </div>
    )
  }

  if (status === 'results') {
    return (
      <div className="flex flex-col h-full">
        <PanelHeader
          title="Duplicates"
          subtitle="Find visually identical photos using perceptual hashing"
        />
        <ResultsView
          groups={groups}
          toTrash={toTrash}
          onToggle={toggleTrash}
          onReview={() => setStatus('reviewing')}
        />
      </div>
    )
  }

  // idle
  return (
    <div className="flex flex-col h-full">
      <PanelHeader
        title="Duplicates"
        subtitle="Find visually identical photos using perceptual hashing"
      />

      {!hasPhotos ? (
        <EmptyState
          icon={<Copy size={34} strokeWidth={1.4} className="text-surface-500" />}
          title="Find duplicate photos"
          body="Side-by-side review of near-identical photos so you can keep the best and trash the rest."
          needsScan
        />
      ) : (
        <EmptyState
          icon={<Copy size={34} strokeWidth={1.4} className="text-primary-600" />}
          warm
          title="Ready to find duplicates"
          body={
            <>
              <span className="font-semibold text-surface-700">{photos.length}</span> photos loaded.
              Perceptual hashing detects near-identical images even with slight edits or re-saves.
            </>
          }
          footer={
            <>
              <button
                onClick={handleAnalyze}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-medium text-white cursor-default bg-primary-500 hover:bg-primary-600 transition-colors duration-150"
              >
                <Copy size={15} strokeWidth={2} />
                Find Duplicates
              </button>
              {error && <p className="text-[11px] text-red-500">{error}</p>}
            </>
          }
        />
      )}
    </div>
  )
}

export default Dedup
