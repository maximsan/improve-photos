import EmptyState from './EmptyState'
import { FormErrorText } from './FormErrorText'
import { PrimaryButton } from './PrimaryButton'

interface PhotosRequiredCalloutProps {
  hasPhotos: boolean
  idleIcon: React.ReactNode
  readyIcon: React.ReactNode
  titleNeedsScan: string
  titleReady: string
  bodyNeedsScan: React.ReactNode
  bodyReady: React.ReactNode
  actionLabel: string
  actionIcon: React.ReactNode
  onAction: () => void | Promise<void>
  error: string | null
}

export function PhotosRequiredCallout({
  hasPhotos,
  idleIcon,
  readyIcon,
  titleNeedsScan,
  titleReady,
  bodyNeedsScan,
  bodyReady,
  actionLabel,
  actionIcon,
  onAction,
  error
}: PhotosRequiredCalloutProps): React.JSX.Element {
  if (!hasPhotos) {
    return <EmptyState icon={idleIcon} title={titleNeedsScan} body={bodyNeedsScan} needsScan />
  }

  return (
    <EmptyState
      icon={readyIcon}
      warm
      title={titleReady}
      body={bodyReady}
      footer={
        <>
          <PrimaryButton onClick={() => void onAction()}>
            {actionIcon}
            {actionLabel}
          </PrimaryButton>
          {error ? <FormErrorText>{error}</FormErrorText> : null}
        </>
      }
    />
  )
}
