import { CheckCircle2, RotateCcw } from 'lucide-react'
import { FormErrorText } from '@renderer/components/FormErrorText'

type DoneVariant = 'organized' | 'reverted'

interface OrganizeDoneViewProps {
  count: number
  variant: DoneVariant
  onReset: () => void
  onUndo?: () => void
  error?: string | null
}

export function OrganizeDoneView({
  count,
  variant,
  onReset,
  onUndo,
  error
}: OrganizeDoneViewProps): React.JSX.Element {
  const isReverted = variant === 'reverted'

  const title = isReverted ? 'Files reverted' : `${count} file${count !== 1 ? 's' : ''} organized`

  const body = isReverted
    ? 'All photos are back in their original locations.'
    : 'Photos have been moved into their date folders.'

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5">
      <div className="w-18 h-18 rounded-2xl flex items-center justify-center bg-primary-100">
        <CheckCircle2 size={34} strokeWidth={1.4} className="text-primary-600" />
      </div>

      <div className="text-center max-w-xs">
        <h2 className="text-[16px] font-semibold text-surface-800">{title}</h2>
        <p className="text-[13px] mt-1 text-surface-500">{body}</p>
      </div>

      <div className="flex items-center gap-4">
        {onUndo && !isReverted && (
          <button
            type="button"
            onClick={onUndo}
            className="flex items-center gap-1.5 text-[12px] font-medium text-surface-500 hover:text-surface-700 cursor-pointer transition-colors"
          >
            <RotateCcw size={12} strokeWidth={2} />
            Undo
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          className="text-[12px] font-medium text-primary-600 hover:text-primary-700 cursor-pointer transition-colors"
        >
          {isReverted ? 'Done' : 'Organize again'}
        </button>
      </div>

      {error && <FormErrorText className="max-w-xs text-center">{error}</FormErrorText>}
    </div>
  )
}
