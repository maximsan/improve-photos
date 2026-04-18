import type { ExportProgress } from '@shared/ipc'

interface ExportingViewProps {
  progress: ExportProgress | null
}

export function ExportingView({ progress }: ExportingViewProps): React.JSX.Element {
  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0
  const filename = progress ? (progress.currentPath.split('/').pop() ?? '') : ''

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
      <div className="w-full max-w-sm space-y-3">
        <div className="flex justify-between text-[12px] text-surface-500">
          <span>{progress ? `${progress.done} / ${progress.total} files` : 'Starting…'}</span>
          <span className="font-medium text-surface-700">{pct}%</span>
        </div>
        <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
        {filename && (
          <p className="text-[11px] text-surface-400 truncate text-center" title={filename}>
            {filename}
          </p>
        )}
      </div>
    </div>
  )
}
