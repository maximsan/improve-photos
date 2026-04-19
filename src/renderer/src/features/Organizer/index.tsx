import { CalendarCheck, FolderOpen, CheckCircle2 } from 'lucide-react'
import PanelHeader from '../../components/PanelHeader'
import EmptyState from '../../components/EmptyState'
import SpinnerView from '../../components/SpinnerView'
import { PhotosRequiredCallout } from '../../components/PhotosRequiredCallout'
import { FormErrorText } from '../../components/FormErrorText'
import { usePhotos } from '../../context/photos'
import { useOrganizerState } from './hooks/useOrganizerState'
import { PreviewView } from './components/PreviewView'
import { DoneView } from './components/DoneView'

function Organizer(): React.JSX.Element {
  const { photos } = usePhotos()
  const { status, ops, movedCount, error, handlePreview, handleConfirm, setStatus } =
    useOrganizerState()

  const hasPhotos = photos.length > 0

  function renderBody(): React.JSX.Element {
    if (status === 'previewing') {
      return <SpinnerView message="Building folder preview…" />
    }
    if (status === 'moving') {
      return <SpinnerView message="Moving files…" />
    }
    if (status === 'done') {
      return <DoneView count={movedCount} />
    }

    if (status === 'preview') {
      return (
        <>
          {ops.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 size={34} strokeWidth={1.4} className="text-primary-600" />}
              warm
              title="Already organised"
              body="All photos are already in their correct date folders. Nothing to move."
              footer={
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="text-[12px] font-medium text-surface-500 hover:text-surface-700 cursor-default transition-colors"
                >
                  Back
                </button>
              }
            />
          ) : (
            <PreviewView ops={ops} onConfirm={handleConfirm} onCancel={() => setStatus('idle')} />
          )}
          {error ? (
            <FormErrorText className="shrink-0 px-5 pb-3 text-center">{error}</FormErrorText>
          ) : null}
        </>
      )
    }

    return (
      <PhotosRequiredCallout
        hasPhotos={hasPhotos}
        idleIcon={<CalendarCheck size={34} strokeWidth={1.4} className="text-surface-500" />}
        readyIcon={<CalendarCheck size={34} strokeWidth={1.4} className="text-primary-600" />}
        titleNeedsScan="Organize by date"
        titleReady="Ready to organise"
        bodyNeedsScan={
          <>
            Preview the proposed <span className="font-mono">YYYY/MM/DD</span> folder structure
            before any files are moved.
          </>
        }
        bodyReady={
          <>
            <span className="font-semibold text-surface-700">{photos.length}</span> photos loaded. A
            dry-run preview shows exactly which files will move before anything changes.
          </>
        }
        actionLabel="Preview Changes"
        actionIcon={<FolderOpen size={15} strokeWidth={2} />}
        onAction={handlePreview}
        error={error}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      <PanelHeader
        title="Organize"
        subtitle="Move photos into date-based folders using EXIF metadata"
      />
      <div className="flex-1 min-h-0 flex flex-col">{renderBody()}</div>
    </div>
  )
}

export default Organizer
