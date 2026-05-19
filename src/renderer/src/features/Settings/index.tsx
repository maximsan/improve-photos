import { Settings as SettingsIcon } from 'lucide-react'
import PanelHeader from '../../components/PanelHeader'
import EmptyState from '../../components/EmptyState'
import { FormErrorText } from '../../components/FormErrorText'
import { SpinnerView } from '../../components/SpinnerView'
import ReleaseGatesPanel from './components/ReleaseGatesPanel'
import { useReleaseFeatureFlags } from './hooks/useReleaseFeatureFlags'

function Settings(): React.JSX.Element {
  const { status, flags, error } = useReleaseFeatureFlags()

  function renderBody(): React.JSX.Element {
    if (status === 'loading') {
      return <SpinnerView label="Loading release gates..." />
    }

    if (status === 'error' || !flags) {
      return (
        <EmptyState
          icon={<SettingsIcon size={34} strokeWidth={1.4} className="text-surface-600" />}
          title="Settings unavailable"
          body="Release feature gate status could not be loaded."
          footer={error ? <FormErrorText>{error}</FormErrorText> : null}
        />
      )
    }

    return (
      <div className="flex-1 overflow-auto p-6">
        <ReleaseGatesPanel flags={flags} />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <PanelHeader title="Settings" subtitle="Release-readiness controls and app status" />
      {renderBody()}
    </div>
  )
}

export default Settings
