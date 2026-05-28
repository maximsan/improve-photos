import { useEffect, useState } from 'react'
import type { UpdateStatus } from '@shared/ipc'

type UpdateRequestStatus = 'loading' | 'ready' | 'saving' | 'error'

export interface UpdateState {
  status: UpdateRequestStatus
  updateStatus: UpdateStatus | null
  error: string | null
  checkForUpdates: () => Promise<void>
  downloadUpdate: () => Promise<void>
  installUpdate: () => Promise<void>
}

export function useUpdateState(): UpdateState {
  const [status, setStatus] = useState<UpdateRequestStatus>('loading')
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const unsubscribe = window.api.onUpdateStatus((nextStatus) => {
      setUpdateStatus(nextStatus)
      setStatus('ready')
    })

    async function loadUpdateStatus(): Promise<void> {
      try {
        const nextStatus = await window.api.getUpdateStatus()
        if (!isMounted) {
          return
        }
        setUpdateStatus(nextStatus)
        setStatus('ready')
      } catch (err) {
        if (!isMounted) {
          return
        }
        setError(err instanceof Error ? err.message : 'Could not load update status')
        setStatus('error')
      }
    }

    void loadUpdateStatus()

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  async function runUpdateAction(action: () => Promise<UpdateStatus | void>): Promise<void> {
    setStatus('saving')
    setError(null)
    try {
      const nextStatus = await action()
      if (nextStatus) {
        setUpdateStatus(nextStatus)
      }
      setStatus('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update action failed')
      setStatus('error')
    }
  }

  return {
    status,
    updateStatus,
    error,
    checkForUpdates: () => runUpdateAction(window.api.checkForUpdates),
    downloadUpdate: () => runUpdateAction(window.api.downloadUpdate),
    installUpdate: () => runUpdateAction(window.api.installUpdate)
  }
}
