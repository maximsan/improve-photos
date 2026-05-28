import { BadgeCheck, Download, KeyRound } from 'lucide-react'
import type { EntitlementStatus, ReleaseFeatureFlags } from '@shared/ipc'

interface StatusSummaryPanelProps {
  flags: ReleaseFeatureFlags
  entitlement: EntitlementStatus | null
}

function StatusSummaryPanel({ flags, entitlement }: StatusSummaryPanelProps): React.JSX.Element {
  const freeLimitCopy = entitlement?.licensed
    ? 'Licensed use has unlimited local processing.'
    : `Unlicensed use is limited to ${entitlement?.photoLimit ?? 100} photos per workflow action.`

  return (
    <section className="max-w-3xl">
      <div className="mb-4">
        <h1 className="text-[15px] font-semibold text-surface-900">App status</h1>
        <p className="mt-1 text-[12px] leading-relaxed text-surface-500">
          Local workflow limits and release services for this build.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-surface-200 bg-white p-4">
          <KeyRound size={17} strokeWidth={1.8} className="mb-3 text-primary-600" />
          <h2 className="text-[13px] font-semibold text-surface-900">License</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-surface-500">
            {flags.paymentsEnabled
              ? 'Activation is available for release testing.'
              : 'Activation is paused until v1 approval.'}
          </p>
        </article>

        <article className="rounded-lg border border-surface-200 bg-white p-4">
          <Download size={17} strokeWidth={1.8} className="mb-3 text-primary-600" />
          <h2 className="text-[13px] font-semibold text-surface-900">Updates</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-surface-500">
            {flags.autoUpdatesEnabled
              ? 'GitHub Releases checks are available for release testing.'
              : 'Update checks are paused for this build.'}
          </p>
        </article>

        <article className="rounded-lg border border-surface-200 bg-white p-4">
          <BadgeCheck size={17} strokeWidth={1.8} className="mb-3 text-primary-600" />
          <h2 className="text-[13px] font-semibold text-surface-900">Free limit</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-surface-500">{freeLimitCopy}</p>
        </article>
      </div>
    </section>
  )
}

export default StatusSummaryPanel
