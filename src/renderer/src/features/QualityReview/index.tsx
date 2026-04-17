import { useState, useMemo } from 'react'
import { Sparkles, Trash2, ShieldCheck } from 'lucide-react'
import { formatBytes, fileUrl } from '@renderer/lib/format'
import PanelHeader from '../../components/PanelHeader'
import EmptyState from '../../components/EmptyState'
import { usePhotos } from '../../context/photos'
import type { PhotoRecord, BlurScores } from '@shared/ipc'

type QualityStatus = 'idle' | 'scoring' | 'results' | 'reviewing' | 'trashing' | 'done'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Maps a blur score to a human-readable label + color. */
function scoreLabel(score: number): { label: string; color: string } {
  if (score < 50) return { label: 'Very blurry', color: 'text-red-500' }
  if (score < 200) return { label: 'Blurry', color: 'text-orange-500' }
  if (score < 600) return { label: 'Soft', color: 'text-amber-500' }
  return { label: 'Sharp', color: 'text-emerald-500' }
}

// ─── Photo tile ───────────────────────────────────────────────────────────────

interface PhotoTileProps {
  photo: PhotoRecord
  score: number
  selected: boolean
  onToggle: () => void
}

function PhotoTile({ photo, score, selected, onToggle }: PhotoTileProps): React.JSX.Element {
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
      {/* Thumbnail */}
      <div className="relative w-full aspect-square bg-surface-100 overflow-hidden">
        <img
          src={fileUrl(photo.path)}
          alt={photo.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
        {selected && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center shadow-md">
              <Trash2 size={16} strokeWidth={2} className="text-white" />
            </div>
          </div>
        )}
        {/* Score badge */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-2">
          <span className={`text-[10px] font-semibold ${color}`}>{label}</span>
        </div>
      </div>

      {/* Info */}
      <div className="px-2.5 py-2 bg-white">
        <p className="text-[11px] font-medium text-surface-700 truncate" title={photo.name}>
          {photo.name}
        </p>
        <p className="text-[10px] text-surface-400 mt-0.5">{formatBytes(photo.size)}</p>
      </div>
    </div>
  )
}

// ─── Results grid ─────────────────────────────────────────────────────────────

interface ResultsGridProps {
  photos: PhotoRecord[]
  scores: BlurScores
  selected: Set<string>
  onToggle: (path: string) => void
  onReview: () => void
}

function ResultsGrid({
  photos,
  scores,
  selected,
  onToggle,
  onReview
}: ResultsGridProps): React.JSX.Element {
  const sorted = useMemo(
    () => [...photos].sort((a, b) => (scores[a.path] ?? 0) - (scores[b.path] ?? 0)),
    [photos, scores]
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-4 gap-3">
          {sorted.map((photo) => (
            <PhotoTile
              key={photo.path}
              photo={photo}
              score={scores[photo.path] ?? 0}
              selected={selected.has(photo.path)}
              onToggle={() => onToggle(photo.path)}
            />
          ))}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="shrink-0 px-5 py-4 border-t border-surface-200 bg-white flex items-center justify-between">
          <p className="text-[12px] text-surface-500">
            <span className="font-semibold text-surface-800">{selected.size}</span> photo
            {selected.size !== 1 ? 's' : ''} selected to trash
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

// ─── Review screen ────────────────────────────────────────────────────────────

interface ReviewScreenProps {
  photos: PhotoRecord[]
  scores: BlurScores
  selected: Set<string>
  onBack: () => void
  onConfirm: () => void
}

function ReviewScreen({
  photos,
  scores,
  selected,
  onBack,
  onConfirm
}: ReviewScreenProps): React.JSX.Element {
  const trashList = photos.filter((p) => selected.has(p.path))

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-surface-200 bg-white shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[12px] font-medium text-surface-500 hover:text-surface-800 transition-colors cursor-default"
        >
          ← Back
        </button>
        <span className="text-[13px] font-semibold text-surface-800">
          Review {trashList.length} photo{trashList.length !== 1 ? 's' : ''} to trash
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-2">
        {trashList.map((photo) => {
          const score = scores[photo.path] ?? 0
          const { label, color } = scoreLabel(score)
          return (
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
              <span className={`text-[11px] font-semibold shrink-0 ${color}`}>{label}</span>
              <span className="text-[11px] text-surface-400 shrink-0">
                {formatBytes(photo.size)}
              </span>
            </div>
          )
        })}
      </div>

      <div className="shrink-0 px-5 py-4 border-t border-surface-200 bg-white">
        <button
          onClick={onConfirm}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors duration-150 cursor-default"
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

// ─── Spinner views ────────────────────────────────────────────────────────────

function ScoringView(): React.JSX.Element {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-primary-200 border-t-primary-500 animate-spin" />
      <p className="text-[13px] text-surface-500">Analysing sharpness…</p>
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

// ─── Main component ───────────────────────────────────────────────────────────

function QualityReview(): React.JSX.Element {
  const { photos } = usePhotos()
  const [status, setStatus] = useState<QualityStatus>('idle')
  const [scores, setScores] = useState<BlurScores>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const hasPhotos = photos.length > 0

  const toggleSelect = (path: string): void => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  async function handleScore(): Promise<void> {
    setError(null)
    setSelected(new Set())
    setStatus('scoring')
    try {
      const result = await window.api.getBlurScores(photos.map((p) => p.path))
      setScores(result)
      setStatus('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scoring failed')
      setStatus('idle')
    }
  }

  async function handleConfirmTrash(): Promise<void> {
    setStatus('trashing')
    try {
      await window.api.trashFiles([...selected])
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trash failed')
      setStatus('reviewing')
    }
  }

  const header = (
    <PanelHeader
      title="Quality"
      subtitle="Sort photos by sharpness score and trash the blurry ones"
    />
  )

  if (status === 'scoring')
    return (
      <div className="flex flex-col h-full">
        {header}
        <ScoringView />
      </div>
    )
  if (status === 'trashing')
    return (
      <div className="flex flex-col h-full">
        {header}
        <TrashingView />
      </div>
    )
  if (status === 'done')
    return (
      <div className="flex flex-col h-full">
        {header}
        <DoneView />
      </div>
    )

  if (status === 'reviewing') {
    return (
      <div className="flex flex-col h-full">
        {header}
        <ReviewScreen
          photos={photos}
          scores={scores}
          selected={selected}
          onBack={() => setStatus('results')}
          onConfirm={handleConfirmTrash}
        />
        {error && (
          <p className="shrink-0 px-5 pb-3 text-[11px] text-red-500 text-center">{error}</p>
        )}
      </div>
    )
  }

  if (status === 'results') {
    return (
      <div className="flex flex-col h-full">
        {header}
        <ResultsGrid
          photos={photos}
          scores={scores}
          selected={selected}
          onToggle={toggleSelect}
          onReview={() => setStatus('reviewing')}
        />
      </div>
    )
  }

  // idle
  return (
    <div className="flex flex-col h-full">
      {header}
      {!hasPhotos ? (
        <EmptyState
          icon={<Sparkles size={34} strokeWidth={1.4} className="text-surface-500" />}
          title="Review photo quality"
          body="Photos are ranked by Laplacian variance — blurry shots appear first so you can quickly select and trash them."
          needsScan
        />
      ) : (
        <EmptyState
          icon={<Sparkles size={34} strokeWidth={1.4} className="text-primary-600" />}
          warm
          title="Ready to score"
          body={
            <>
              <span className="font-semibold text-surface-700">{photos.length}</span> photos loaded.
              Sharpness is measured by Laplacian variance — blurry photos score lower.
            </>
          }
          footer={
            <>
              <button
                onClick={handleScore}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-medium text-white cursor-default bg-primary-500 hover:bg-primary-600 transition-colors duration-150"
              >
                <Sparkles size={15} strokeWidth={2} />
                Analyse Sharpness
              </button>
              {error && <p className="text-[11px] text-red-500">{error}</p>}
            </>
          }
        />
      )}
    </div>
  )
}

export default QualityReview
