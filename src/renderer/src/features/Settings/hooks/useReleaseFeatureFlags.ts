import { useEffect, useState } from 'react'
import type { ReleaseFeatureFlags } from '@shared/ipc'

type ReleaseFeatureFlagsStatus = 'loading' | 'ready' | 'error'

export interface ReleaseFeatureFlagsState {
  status: ReleaseFeatureFlagsStatus
  flags: ReleaseFeatureFlags | null
  error: string | null
}

export function useReleaseFeatureFlags(): ReleaseFeatureFlagsState {
  const [status, setStatus] = useState<ReleaseFeatureFlagsStatus>('loading')
  const [flags, setFlags] = useState<ReleaseFeatureFlags | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadReleaseFeatureFlags(): Promise<void> {
      try {
        const nextFlags = await window.api.getReleaseFeatureFlags()
        if (!isMounted) {
          return
        }

        setFlags(nextFlags)
        setStatus('ready')
      } catch (err) {
        if (!isMounted) {
          return
        }

        setError(err instanceof Error ? err.message : 'Could not load release feature gates')
        setStatus('error')
      }
    }

    void loadReleaseFeatureFlags()

    return () => {
      isMounted = false
    }
  }, [])

  return { status, flags, error }
}
