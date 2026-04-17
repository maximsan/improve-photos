import { useState, useMemo } from 'react'
import { ScanSearch, FolderOpen, RotateCcw } from 'lucide-react'
import { formatBytes } from '@renderer/lib/format'
import PanelHeader from '../../components/PanelHeader'
import EmptyState from '../../components/EmptyState'
import SpinnerView from '../../components/SpinnerView'
import { usePhotos } from '../../context/photos'
import type { PhotoRecord } from '@shared/ipc'

type ScanStatus = 'idle' | 'scanning' | 'done'

const UNKNOWN_FORMAT_LABEL = 'OTHER'
const MAX_DISPLAYED_FORMATS = 2

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatYear(iso: string): string {
  return new Date(iso).getFullYear().toString()
}

interface FormatCount {
  ext: string
  count: number
}

function getFormatCounts(photos: PhotoRecord[]): FormatCount[] {
  const counts: { [ext: string]: number } = {}
  for (const p of photos) {
    const ext = p.name.split('.').pop()?.toUpperCase() ?? UNKNOWN_FORMAT_LABEL
    counts[ext] = (counts[ext] ?? 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([ext, count]) => ({ ext, count }))
}

interface ScanResultsProps {
  photos: PhotoRecord[]
  folderPath: string
  onRescan: () => void
}

function ScanResults({ photos, folderPath, onRescan }: ScanResultsProps): React.JSX.Element {
  const { totalSize, dateRange, formatCounts } = useMemo(() => {
    const totalSize = photos.reduce((sum, p) => sum + p.size, 0)
    const dates = photos.flatMap((p) => (p.dateTaken ? [new Date(p.dateTaken).getTime()] : []))
    const dateRange =
      dates.length > 0
        ? { from: new Date(Math.min(...dates)), to: new Date(Math.max(...dates)) }
        : null
    const formatCounts = getFormatCounts(photos)
    return { totalSize, dateRange, formatCounts }
  }, [photos])

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
      {/* Photo count */}
      <div className="text-center">
        <div className="font-display text-[64px] leading-none font-semibold text-surface-900">
          {photos.length}
        </div>
        <p className="text-[13px] text-surface-500 mt-2">photos found</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
        <StatCard label="Total size" value={formatBytes(totalSize)} />
        <StatCard
          label="Date range"
          value={
            dateRange
              ? dateRange.from.getFullYear() === dateRange.to.getFullYear()
                ? formatYear(dateRange.from.toISOString())
                : `${formatYear(dateRange.from.toISOString())} – ${formatYear(dateRange.to.toISOString())}`
              : '—'
          }
        />
        <StatCard
          label="Formats"
          value={formatCounts
            .slice(0, MAX_DISPLAYED_FORMATS)
            .map(({ ext, count }) => `${ext} ${count}`)
            .join(' · ')}
        />
      </div>

      {/* Folder path */}
      <p className="text-[11px] text-surface-400 max-w-sm truncate" title={folderPath}>
        {folderPath}
      </p>

      {/* Rescan */}
      <button
        onClick={onRescan}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium text-surface-600 border border-surface-200 hover:border-surface-300 hover:bg-surface-100 transition-colors duration-150 cursor-default"
      >
        <RotateCcw size={13} strokeWidth={2} />
        Choose different folder
      </button>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
}

function StatCard({ label, value }: StatCardProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl bg-surface-100">
      <span className="text-[11px] text-surface-400 font-medium">{label}</span>
      <span className="text-[13px] font-semibold text-surface-700 text-center leading-tight">
        {value}
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

function Scanner(): React.JSX.Element {
  const { setPhotos } = usePhotos()
  const [status, setStatus] = useState<ScanStatus>('idle')
  const [localPhotos, setLocalPhotos] = useState<PhotoRecord[]>([])
  const [folderPath, setFolderPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleChooseFolder(): Promise<void> {
    setError(null)
    try {
      const path = await window.api.pickFolder()
      if (!path) return

      setFolderPath(path)
      setStatus('scanning')
      const result = await window.api.scan(path)
      setLocalPhotos(result)
      setPhotos(result)
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed')
      setStatus('idle')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PanelHeader title="Scan Folder" subtitle="Walk a directory and read photo metadata" />

      {status === 'scanning' && <SpinnerView message="Reading metadata…" />}

      {status === 'done' && folderPath && (
        <ScanResults photos={localPhotos} folderPath={folderPath} onRescan={handleChooseFolder} />
      )}

      {status === 'idle' && (
        <EmptyState
          icon={<ScanSearch size={34} strokeWidth={1.4} className="text-primary-600" />}
          warm
          title="Choose a folder to scan"
          body="Cleanup reads EXIF metadata and dimensions from every photo in the folder. No files are moved or changed."
          footer={
            <>
              <button
                onClick={handleChooseFolder}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-medium text-white cursor-default bg-primary-500 hover:bg-primary-600 transition-colors duration-150"
              >
                <FolderOpen size={15} strokeWidth={2} />
                Choose Folder
              </button>
              {error && <p className="text-[11px] text-red-500">{error}</p>}
              {!error && (
                <p className="text-[11px] text-surface-400">Supports JPEG, HEIC, PNG, WebP, TIFF</p>
              )}
            </>
          }
        />
      )}
    </div>
  )
}

export default Scanner
