import { useEffect, useState } from 'react'
import type { LicenseStatus } from '@shared/ipc'

type LicenseRequestStatus = 'loading' | 'ready' | 'saving' | 'error'

export interface LicenseState {
  status: LicenseRequestStatus
  license: LicenseStatus | null
  error: string | null
  activate: (licenseKey: string) => Promise<void>
  deactivate: () => Promise<void>
}

export function useLicenseState(enabled: boolean): LicenseState {
  const [status, setStatus] = useState<LicenseRequestStatus>('loading')
  const [license, setLicense] = useState<LicenseStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Licensing is only meaningful once payments ship; skip the fetch until then.
    if (!enabled) {
      return
    }

    let isMounted = true

    async function loadLicenseStatus(): Promise<void> {
      try {
        const nextLicense = await window.api.getLicenseStatus()
        if (!isMounted) {
          return
        }
        setLicense(nextLicense)
        setStatus('ready')
      } catch (err) {
        if (!isMounted) {
          return
        }
        setError(err instanceof Error ? err.message : 'Could not load license status')
        setStatus('error')
      }
    }

    void loadLicenseStatus()

    return () => {
      isMounted = false
    }
  }, [enabled])

  async function activate(licenseKey: string): Promise<void> {
    setStatus('saving')
    setError(null)
    try {
      const nextLicense = await window.api.activateLicense(licenseKey)
      setLicense(nextLicense)
      setStatus('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'License activation failed')
      setStatus('error')
    }
  }

  async function deactivate(): Promise<void> {
    setStatus('saving')
    setError(null)
    try {
      const nextLicense = await window.api.deactivateLicense()
      setLicense(nextLicense)
      setStatus('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'License deactivation failed')
      setStatus('error')
    }
  }

  if (!enabled) {
    return { status: 'ready', license: null, error: null, activate, deactivate }
  }

  return { status, license, error, activate, deactivate }
}
