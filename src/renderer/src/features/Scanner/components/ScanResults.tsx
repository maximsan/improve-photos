import { useMemo } from 'react'
import { RotateCcw } from 'lucide-react'
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
}

export function ScanResults({ photos, folderPath, onRescan }: ScanResultsProps): React.JSX.Element {
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

      <p className="text-[11px] text-surface-400 max-w-sm truncate" title={folderPath}>
        {folderPath}
      </p>

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
