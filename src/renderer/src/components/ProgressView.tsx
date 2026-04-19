interface ProgressViewProps {
  label: string
  percent: number
  current?: string
  onCancel?: () => void
}

export function ProgressView({
  label,
  percent,
  current,
  onCancel
}: ProgressViewProps): React.JSX.Element {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-10">
      <div className="w-full max-w-xs flex flex-col gap-3">
        <div className="flex justify-between items-baseline">
          <p className="text-[13px] font-medium text-surface-700">{label}</p>
          <span className="text-[12px] tabular-nums text-surface-400">{percent}%</span>
        </div>

        <div className="h-1.5 w-full rounded-full bg-primary-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary-500 transition-[width] duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="text-[11px] text-surface-400 truncate text-center min-h-4">
          {current ?? ''}
        </p>
      </div>

      {onCancel && (
        <button
          onClick={onCancel}
          className="px-4 py-1.5 rounded-md text-[12px] font-medium text-surface-500 border border-surface-300 hover:border-surface-400 hover:text-surface-700 transition-colors duration-150 cursor-default"
        >
          Cancel
        </button>
      )}
    </div>
  )
}
