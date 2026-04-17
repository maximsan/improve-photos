import { ShieldCheck } from 'lucide-react'

export function DoneView(): React.JSX.Element {
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
