import { CheckCircle2 } from 'lucide-react'

interface DoneViewProps {
  count: number
}

export function DoneView({ count }: DoneViewProps): React.JSX.Element {
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
