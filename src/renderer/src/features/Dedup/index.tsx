import { Copy } from 'lucide-react'
import PanelHeader from '../../components/PanelHeader'
import SpinnerView from '../../components/SpinnerView'
import { PhotosRequiredCallout } from '../../components/PhotosRequiredCallout'
import { usePhotos } from '../../context/photos'
import { useDedupState } from './hooks/useDedupState'
import { ComputingView } from './components/ComputingView'
import { DoneView } from './components/DoneView'
import { ReviewScreen } from './components/ReviewScreen'
import { ResultsView } from './components/ResultsView'

function Dedup(): React.JSX.Element {
  const { photos } = usePhotos()
  const {
    status,
    groups,
    toTrash,
    error,
    progress,
    toggleTrash,
    handleAnalyze,
    handleCancel,
    handleTrashWithConfirm,
    handleConfirmTrash,
    setStatus
  } = useDedupState(photos)

  const hasPhotos = photos.length > 0

  function renderBody(): React.JSX.Element {
    if (status === 'computing') {
      return <ComputingView progress={progress} onCancel={handleCancel} />
    }
    if (status === 'trashing') {
      return <SpinnerView message="Moving files to Trash…" variant="danger" />
    }
    if (status === 'done') {
      return <DoneView onFindMore={() => setStatus('idle')} />
    }

    if (status === 'reviewing') {
      return (
        <ReviewScreen
          groups={groups}
          toTrash={toTrash}
          onBack={() => setStatus('results')}
          onConfirm={handleConfirmTrash}
          onToggle={toggleTrash}
        />
      )
    }

    if (status === 'results') {
      return (
        <ResultsView
          groups={groups}
          toTrash={toTrash}
          onToggle={toggleTrash}
          onTrash={handleTrashWithConfirm}
          onReview={() => setStatus('reviewing')}
          onReanalyze={handleAnalyze}
        />
      )
    }

    return (
      <PhotosRequiredCallout
        hasPhotos={hasPhotos}
        idleIcon={<Copy size={34} strokeWidth={1.4} className="text-surface-500" />}
        readyIcon={<Copy size={34} strokeWidth={1.4} className="text-primary-600" />}
        titleNeedsScan="Find duplicate photos"
        titleReady="Ready to find duplicates"
        bodyNeedsScan="Side-by-side review of near-identical photos so you can keep the best and trash the rest."
        bodyReady={
          <>
            <span className="font-semibold text-surface-700">{photos.length}</span> photos loaded.
            Detects near-identical images even with slight edits, re-saves, or different file names.
          </>
        }
        actionLabel="Find Duplicates"
        actionIcon={<Copy size={15} strokeWidth={2} />}
        onAction={handleAnalyze}
        error={error}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      <PanelHeader
        title="Duplicates"
        subtitle="Find near-identical photos and keep only the best ones"
      />
      <div className="flex-1 min-h-0 flex flex-col">{renderBody()}</div>
    </div>
  )
}

export default Dedup
