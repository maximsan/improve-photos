import { useEffect, useState } from 'react'
import type { EntitlementStatus } from '@shared/ipc'

type EntitlementRequestStatus = 'loading' | 'ready' | 'error'

export interface EntitlementState {
  status: EntitlementRequestStatus
  entitlement: EntitlementStatus | null
  error: string | null
}

export function useEntitlementState(): EntitlementState {
  const [status, setStatus] = useState<EntitlementRequestStatus>('loading')
  const [entitlement, setEntitlement] = useState<EntitlementStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadEntitlementStatus(): Promise<void> {
      try {
        const nextEntitlement = await window.api.getEntitlementStatus()
        if (!isMounted) {
          return
        }
        setEntitlement(nextEntitlement)
        setStatus('ready')
      } catch (err) {
        if (!isMounted) {
          return
        }
        setError(err instanceof Error ? err.message : 'Could not load free-limit status')
        setStatus('error')
      }
    }

    void loadEntitlementStatus()

    return () => {
      isMounted = false
    }
  }, [])

  return { status, entitlement, error }
}
