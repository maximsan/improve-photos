import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { FormErrorText } from '../../../components/FormErrorText'
import { PrimaryButton } from '../../../components/PrimaryButton'
import type { LicenseStatus } from '@shared/ipc'

interface LicensePanelProps {
  requestStatus: 'loading' | 'ready' | 'saving' | 'error'
  license: LicenseStatus | null
  error: string | null
  onActivate: (licenseKey: string) => Promise<void>
  onDeactivate: () => Promise<void>
}

function licenseCopy(license: LicenseStatus | null): string {
  if (!license || license.state === 'disabled') {
    return 'License activation is paused until payments are enabled for final v1 testing.'
  }
  if (license.state === 'licensed') {
    return `Licensed${license.licenseKeyLast4 ? ` with key ending ${license.licenseKeyLast4}` : ''}.`
  }
  return 'No license is active. Unlicensed use keeps the 100-photo workflow limit.'
}

function LicensePanel({
  requestStatus,
  license,
  error,
  onActivate,
  onDeactivate
}: LicensePanelProps): React.JSX.Element {
  const [licenseKey, setLicenseKey] = useState('')
  const isSaving = requestStatus === 'saving'
  const canActivate = license?.state === 'unlicensed'
  const canDeactivate = license?.state === 'licensed'

  async function handleActivate(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    await onActivate(licenseKey)
    setLicenseKey('')
  }

  return (
    <section className="max-w-3xl">
      <div className="mb-4">
        <h1 className="text-[15px] font-semibold text-surface-900">License</h1>
        <p className="mt-1 text-[12px] leading-relaxed text-surface-500">
          One-time license activation for unlimited local processing.
        </p>
      </div>

      <div className="rounded-lg border border-surface-200 bg-white p-4">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <KeyRound size={17} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold text-surface-900">
              {license?.state === 'licensed' ? 'Licensed' : 'Unlicensed'}
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-surface-500">
              {licenseCopy(license)}
            </p>
          </div>
        </div>

        {canActivate ? (
          <form className="flex flex-wrap items-end gap-2" onSubmit={handleActivate}>
            <label className="min-w-64 flex-1">
              <span className="mb-1 block text-[12px] font-semibold text-surface-700">
                License key
              </span>
              <input
                value={licenseKey}
                onChange={(event) => setLicenseKey(event.currentTarget.value)}
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-[13px] text-surface-800"
                placeholder="Paste license key"
              />
            </label>
            <PrimaryButton type="submit" disabled={isSaving || licenseKey.trim().length === 0}>
              Activate
            </PrimaryButton>
          </form>
        ) : null}

        {canDeactivate ? (
          <button
            type="button"
            onClick={() => void onDeactivate()}
            disabled={isSaving}
            className="rounded-lg border border-surface-200 bg-white px-4 py-2 text-[13px] font-medium text-surface-700 transition-colors duration-150 hover:bg-surface-50 disabled:opacity-40"
          >
            Deactivate license
          </button>
        ) : null}

        {error ? <FormErrorText className="mt-3">{error}</FormErrorText> : null}
      </div>
    </section>
  )
}

export default LicensePanel
