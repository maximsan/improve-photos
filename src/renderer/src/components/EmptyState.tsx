import { useNavigation } from '../context/navigation'

interface EmptyStateProps {
  /** Lucide icon or any React node rendered inside the icon container */
  icon: React.ReactNode
  /** Amber/warm tint for the icon container — use for the primary action panel (Scanner) */
  warm?: boolean
  title: string
  /** ReactNode so callers can include styled inline elements */
  body: React.ReactNode
  /** Custom footer content (e.g. a CTA button). Mutually exclusive with needsScan. */
  footer?: React.ReactNode
  /** Renders the standard "Scan a folder first" hint. Use for all non-Scanner panels. */
  needsScan?: boolean
}

function NeedsScanHint(): React.JSX.Element {
  const { setActiveTab } = useNavigation()
  return (
    <p className="text-[12px] font-medium text-surface-400">
      Scan a folder first in the{' '}
      <button
        type="button"
        onClick={() => setActiveTab('scanner')}
        className="text-primary-500 hover:text-primary-600 cursor-pointer transition-colors duration-150"
      >
        Scan
      </button>{' '}
      tab
    </p>
  )
}

function EmptyState({
  icon,
  warm = false,
  title,
  body,
  footer,
  needsScan = false
}: EmptyStateProps): React.JSX.Element {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
      <div
        className={`w-18 h-18 rounded-2xl flex items-center justify-center ${warm ? 'bg-primary-100' : 'bg-surface-200'}`}
      >
        {icon}
      </div>

      <div className="text-center max-w-75">
        <h2 className="text-[16px] font-semibold mb-2 text-surface-800">{title}</h2>
        <p className="text-[13px] leading-relaxed text-surface-500">{body}</p>
      </div>

      {footer}

      {needsScan && <NeedsScanHint />}
    </div>
  )
}

export default EmptyState
