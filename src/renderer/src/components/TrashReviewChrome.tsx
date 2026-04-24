import { ArrowLeft, Trash2 } from 'lucide-react'

interface TrashReviewChromeProps {
  count: number
  onBack: () => void
  onConfirm: () => void
  confirmDisabled?: boolean
  warning?: React.ReactNode
  children: React.ReactNode
}

export function TrashReviewChrome({
  count,
  onBack,
  onConfirm,
  confirmDisabled,
  warning,
  children
}: TrashReviewChromeProps): React.JSX.Element {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-surface-200 bg-white shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-surface-700 bg-white border border-surface-200 hover:border-surface-300 hover:bg-surface-50 transition-colors duration-150 cursor-pointer"
        >
          <ArrowLeft size={13} strokeWidth={2} />
          Back
        </button>
        <span className="text-[13px] font-semibold text-surface-800">
          Review {count} photo{count !== 1 ? 's' : ''} to trash
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-2">
        {warning}
        {children}
      </div>

      <div className="shrink-0 px-5 py-4 border-t border-surface-200 bg-white">
        <button
          onClick={onConfirm}
          disabled={confirmDisabled}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-red-500 hover:bg-red-600 disabled:hover:bg-red-500"
        >
          <Trash2 size={14} strokeWidth={2} />
          Move {count} photo{count !== 1 ? 's' : ''} to Trash
        </button>
        <p className="text-center text-[10px] text-surface-400 mt-2">
          Files go to macOS Trash — you can restore them any time.
        </p>
      </div>
    </div>
  )
}
