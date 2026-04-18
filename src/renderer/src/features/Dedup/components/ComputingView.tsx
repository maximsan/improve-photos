import type { HashProgress } from '@shared/ipc'

type Props = {
  progress: HashProgress | null
  onCancel: () => void
}

const MAX_FILENAME_CHARS = 40

function truncateMiddle(name: string): string {
  if (name.length <= MAX_FILENAME_CHARS) {
    return name
  }
  const half = Math.floor((MAX_FILENAME_CHARS - 1) / 2)
  return `${name.slice(0, half)}…${name.slice(-half)}`
}

export function ComputingView({ progress, onCancel }: Props): React.JSX.Element {
  const percent = progress ? Math.round((progress.done / progress.total) * 100) : 0
  const filename = progress
    ? truncateMiddle(progress.current.split(/[\\/]/).pop() ?? progress.current)
    : null

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-10">
      <div className="w-full max-w-xs flex flex-col gap-3">
        {/* Counter */}
        <div className="flex justify-between items-baseline">
          <p className="text-[13px] font-medium text-surface-700">
            {progress ? `Hashing photo ${progress.done} of ${progress.total}` : 'Starting…'}
          </p>
          <span className="text-[12px] tabular-nums text-surface-400">{percent}%</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-primary-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary-500 transition-[width] duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Current file */}
        <p className="text-[11px] text-surface-400 truncate text-center min-h-4">
          {filename ?? ''}
        </p>
      </div>

      <button
        onClick={onCancel}
        className="px-4 py-1.5 rounded-md text-[12px] font-medium text-surface-500 border border-surface-300 hover:border-surface-400 hover:text-surface-700 transition-colors duration-150 cursor-default"
      >
        Cancel
      </button>
    </div>
  )
}
