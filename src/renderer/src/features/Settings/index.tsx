import { Settings as SettingsIcon } from 'lucide-react'
import PanelHeader from '../../components/PanelHeader'
import EmptyState from '../../components/EmptyState'
import { FormErrorText } from '../../components/FormErrorText'
import SpinnerView from '../../components/SpinnerView'
import AppLinksPanel from './components/AppLinksPanel'
import LicensePanel from './components/LicensePanel'
import PreferencesPanel from './components/PreferencesPanel'
import ReleaseGatesPanel from './components/ReleaseGatesPanel'
import StatusSummaryPanel from './components/StatusSummaryPanel'
import UpdatePanel from './components/UpdatePanel'
import { useReleaseFeatureFlags } from './hooks/useReleaseFeatureFlags'
import { useEntitlementState } from './hooks/useEntitlementState'
import { useLicenseState } from './hooks/useLicenseState'
import { useSettingsPreferences } from './hooks/useSettingsPreferences'
import { useUpdateState } from './hooks/useUpdateState'

function Settings(): React.JSX.Element {
  const { status, flags, error } = useReleaseFeatureFlags()
  const { entitlement } = useEntitlementState()
  const licenseState = useLicenseState(flags?.paymentsEnabled ?? false)
  const updateState = useUpdateState()
  const { preferences, setConfirmBeforeTrash, setDefaultExportFormat } = useSettingsPreferences()

  function renderBody(): React.JSX.Element {
    if (status === 'loading') {
      return <SpinnerView message="Loading release gates..." />
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
      <div className="flex-1 space-y-8 overflow-auto p-6">
        <StatusSummaryPanel flags={flags} entitlement={entitlement} />
        {flags.paymentsEnabled ? (
          <LicensePanel
            requestStatus={licenseState.status}
            license={licenseState.license}
            error={licenseState.error}
            onActivate={licenseState.activate}
            onDeactivate={licenseState.deactivate}
          />
        ) : null}
        <UpdatePanel
          requestStatus={updateState.status}
          updateStatus={updateState.updateStatus}
          error={updateState.error}
          onCheck={updateState.checkForUpdates}
          onDownload={updateState.downloadUpdate}
          onInstall={updateState.installUpdate}
        />
        <PreferencesPanel
          preferences={preferences}
          onConfirmBeforeTrashChange={setConfirmBeforeTrash}
          onDefaultExportFormatChange={setDefaultExportFormat}
        />
        <ReleaseGatesPanel flags={flags} />
        <AppLinksPanel />
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
