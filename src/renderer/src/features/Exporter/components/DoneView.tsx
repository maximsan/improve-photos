import { CheckCircle2 } from 'lucide-react'

interface DoneViewProps {
  count: number
  outDir: string
  onReset: () => void
}

export function DoneView({ count, outDir, onReset }: DoneViewProps): React.JSX.Element {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5">
      <div className="w-18 h-18 rounded-2xl flex items-center justify-center bg-primary-100">
        <CheckCircle2 size={34} strokeWidth={1.4} className="text-primary-600" />
      </div>
      <div className="text-center max-w-xs">
        <h2 className="text-[16px] font-semibold text-surface-800">
          {count} file{count !== 1 ? 's' : ''} exported
        </h2>
        <p className="text-[12px] mt-1 text-surface-500 truncate" title={outDir}>
          {outDir}
        </p>
      </div>
      <button
        onClick={onReset}
        className="text-[12px] font-medium text-primary-600 hover:text-primary-700 cursor-default transition-colors"
      >
        Export again with different presets
      </button>
    </div>
  )
}
