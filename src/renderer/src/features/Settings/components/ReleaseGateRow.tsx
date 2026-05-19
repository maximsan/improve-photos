import { CheckCircle2, CircleOff } from 'lucide-react'

interface ReleaseGateRowProps {
  title: string
  enabled: boolean
  disabledDescription: string
  enabledDescription: string
}

function ReleaseGateRow({
  title,
  enabled,
  disabledDescription,
  enabledDescription
}: ReleaseGateRowProps): React.JSX.Element {
  const Icon = enabled ? CheckCircle2 : CircleOff
  const description = enabled ? enabledDescription : disabledDescription
  const badgeLabel = enabled ? 'Enabled' : 'Paused'

  return (
    <li className="flex items-start gap-3 rounded-lg border border-surface-200 bg-white px-4 py-3">
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
        }`}
      >
        <Icon size={16} strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-[13px] font-semibold text-surface-900">{title}</h2>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
              enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {badgeLabel}
          </span>
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-surface-500">{description}</p>
      </div>
    </li>
  )
}

export default ReleaseGateRow
