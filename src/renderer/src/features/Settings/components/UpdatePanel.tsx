import { Download } from 'lucide-react'
import { FormErrorText } from '../../../components/FormErrorText'
import { PrimaryButton } from '../../../components/PrimaryButton'
import type { UpdateStatus } from '@shared/ipc'

interface UpdatePanelProps {
  requestStatus: 'loading' | 'ready' | 'saving' | 'error'
  updateStatus: UpdateStatus | null
  error: string | null
  onCheck: () => Promise<void>
  onDownload: () => Promise<void>
  onInstall: () => Promise<void>
}

function updateCopy(updateStatus: UpdateStatus | null): string {
  if (!updateStatus) {
    return 'Update status is loading.'
  }
  if (updateStatus.message) {
    return updateStatus.message
  }
  if (updateStatus.state === 'idle') {
    return 'Ready to check for updates.'
  }
  return `Update status: ${updateStatus.state}.`
}

function UpdatePanel({
  requestStatus,
  updateStatus,
  error,
  onCheck,
  onDownload,
  onInstall
}: UpdatePanelProps): React.JSX.Element {
  const isSaving = requestStatus === 'saving'
  const canCheck = updateStatus?.state !== 'disabled'
  const canDownload = updateStatus?.state === 'available'
  const canInstall = updateStatus?.state === 'ready'

  return (
    <section className="max-w-3xl">
      <div className="mb-4">
        <h1 className="text-[15px] font-semibold text-surface-900">Updates</h1>
        <p className="mt-1 text-[12px] leading-relaxed text-surface-500">
          GitHub Releases checks stay paused until the auto-update gate is enabled.
        </p>
      </div>

      <div className="rounded-lg border border-surface-200 bg-white p-4">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Download size={17} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold text-surface-900">
              {updateStatus?.state ?? 'loading'}
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-surface-500">
              {updateCopy(updateStatus)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <PrimaryButton onClick={() => void onCheck()} disabled={!canCheck || isSaving}>
            Check for updates
          </PrimaryButton>
          <button
            type="button"
            onClick={() => void onDownload()}
            disabled={!canDownload || isSaving}
            className="rounded-lg border border-surface-200 bg-white px-4 py-2 text-[13px] font-medium text-surface-700 transition-colors duration-150 hover:bg-surface-50 disabled:opacity-40"
          >
            Download
          </button>
          <button
            type="button"
            onClick={() => void onInstall()}
            disabled={!canInstall || isSaving}
            className="rounded-lg border border-surface-200 bg-white px-4 py-2 text-[13px] font-medium text-surface-700 transition-colors duration-150 hover:bg-surface-50 disabled:opacity-40"
          >
            Install
          </button>
        </div>

        {error ? <FormErrorText className="mt-3">{error}</FormErrorText> : null}
      </div>
    </section>
  )
}

export default UpdatePanel
