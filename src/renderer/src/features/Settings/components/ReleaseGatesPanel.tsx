import type { ReleaseFeatureFlags } from '@shared/ipc'
import ReleaseGateRow from './ReleaseGateRow'

interface ReleaseGatesPanelProps {
  flags: ReleaseFeatureFlags
}

const RELEASE_GATE_ROWS = [
  {
    key: 'paymentsEnabled',
    title: 'Payments',
    disabledDescription:
      'Paused until final v1 approval. License activation and payment network calls stay off.',
    enabledDescription: 'Enabled for release testing. License activation may contact Lemon Squeezy.'
  },
  {
    key: 'autoUpdatesEnabled',
    title: 'Auto-updates',
    disabledDescription: 'Paused until final v1 approval. The app will not check update servers.',
    enabledDescription: 'Enabled for release testing. Update checks may contact GitHub Releases.'
  },
  {
    key: 'releasePublishingEnabled',
    title: 'Release publishing',
    disabledDescription:
      'Disabled until manual release approval. Ordinary builds and tests must not publish releases.',
    enabledDescription: 'Enabled only after manual release approval for a ready v1 build.'
  }
] as const

function ReleaseGatesPanel({ flags }: ReleaseGatesPanelProps): React.JSX.Element {
  return (
    <section className="max-w-3xl">
      <div className="mb-4">
        <h1 className="text-[15px] font-semibold text-surface-900">Release feature gates</h1>
        <p className="mt-1 text-[12px] leading-relaxed text-surface-500">
          These switches keep market features off while the v1 workflow is still being tested.
        </p>
      </div>

      <ul className="space-y-3">
        {RELEASE_GATE_ROWS.map((row) => (
          <ReleaseGateRow
            key={row.key}
            title={row.title}
            enabled={flags[row.key]}
            disabledDescription={row.disabledDescription}
            enabledDescription={row.enabledDescription}
          />
        ))}
      </ul>
    </section>
  )
}

export default ReleaseGatesPanel
