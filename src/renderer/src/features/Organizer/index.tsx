import { CalendarCheck, FolderOpen, CheckCircle2 } from 'lucide-react'
import PanelHeader from '../../components/PanelHeader'
import EmptyState from '../../components/EmptyState'
import SpinnerView from '../../components/SpinnerView'
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
    if (status === 'previewing') return <SpinnerView message="Building folder preview…" />
    if (status === 'moving') return <SpinnerView message="Moving files…" />
    if (status === 'done') return <DoneView count={movedCount} />

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
          {error && (
            <p className="shrink-0 px-5 pb-3 text-[11px] text-red-500 text-center">{error}</p>
          )}
        </>
      )
    }

    // idle
    return !hasPhotos ? (
      <EmptyState
        icon={<CalendarCheck size={34} strokeWidth={1.4} className="text-surface-500" />}
        title="Organize by date"
        body={
          <>
            Preview the proposed <span className="font-mono">YYYY/MM/DD</span> folder structure
            before any files are moved.
          </>
        }
        needsScan
      />
    ) : (
      <EmptyState
        icon={<CalendarCheck size={34} strokeWidth={1.4} className="text-primary-600" />}
        warm
        title="Ready to organise"
        body={
          <>
            <span className="font-semibold text-surface-700">{photos.length}</span> photos loaded. A
            dry-run preview shows exactly which files will move before anything changes.
          </>
        }
        footer={
          <>
            <button
              onClick={handlePreview}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-medium text-white cursor-default bg-primary-500 hover:bg-primary-600 transition-colors duration-150"
            >
              <FolderOpen size={15} strokeWidth={2} />
              Preview Changes
            </button>
            {error && <p className="text-[11px] text-red-500">{error}</p>}
          </>
        }
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      <PanelHeader
        title="Organize"
        subtitle="Move photos into date-based folders using EXIF metadata"
      />
      {renderBody()}
    </div>
  )
}

export default Organizer
