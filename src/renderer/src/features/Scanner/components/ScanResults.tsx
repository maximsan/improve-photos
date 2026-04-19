import { useMemo } from 'react'
import { RotateCcw, FolderOpen } from 'lucide-react'
import { formatBytes } from '@renderer/lib/format'
import { StatCard } from './StatCard'
import type { PhotoRecord } from '@shared/ipc'

const MAX_DISPLAYED_FORMATS = 2
const UNKNOWN_FORMAT_LABEL = 'OTHER'

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

function formatYear(iso: string): string {
  return new Date(iso).getFullYear().toString()
}

interface ScanResultsProps {
  photos: PhotoRecord[]
  folderPath: string
  onRescan: () => void
  onChoose: () => void
}

export function ScanResults({
  photos,
  folderPath,
  onRescan,
  onChoose
}: ScanResultsProps): React.JSX.Element {
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

  const dateRangeLabel =
    dateRange === null
      ? '—'
      : dateRange.from.getFullYear() === dateRange.to.getFullYear()
        ? formatYear(dateRange.from.toISOString())
        : `${formatYear(dateRange.from.toISOString())} – ${formatYear(dateRange.to.toISOString())}`

  const formatsLabel = formatCounts
    .slice(0, MAX_DISPLAYED_FORMATS)
    .map(({ ext, count }) => `${ext} ${count}`)
    .join(' · ')

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
        <div className="text-center">
          <div className="font-display text-[64px] leading-none font-semibold text-surface-900">
            {photos.length}
          </div>
          <p className="text-[13px] text-surface-500 mt-2">photos found</p>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
          <StatCard label="Total size" value={formatBytes(totalSize)} />
          <StatCard label="Date range" value={dateRangeLabel} />
          <StatCard label="Formats" value={formatsLabel} />
        </div>
      </div>

      <div className="shrink-0 px-5 py-4 border-t border-surface-200 bg-white flex items-center justify-between">
        <p className="text-[12px] text-surface-400 truncate max-w-xs" title={folderPath}>
          {folderPath}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onChoose}
            className="flex items-center gap-1.5 text-[12px] text-surface-500 hover:text-surface-800 transition-colors duration-150 cursor-default"
          >
            <FolderOpen size={13} strokeWidth={2} />
            Choose different folder
          </button>
          <button
            onClick={onRescan}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-colors duration-150 cursor-default"
          >
            <RotateCcw size={13} strokeWidth={2} />
            Rescan
          </button>
        </div>
      </div>
    </div>
  )
}
