import { Copy } from 'lucide-react'
import PanelHeader from '../../components/PanelHeader'
import EmptyState from '../../components/EmptyState'
import SpinnerView from '../../components/SpinnerView'
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
      return <DoneView />
    }

    if (status === 'reviewing') {
      return (
        <ReviewScreen
          groups={groups}
          toTrash={toTrash}
          onBack={() => setStatus('results')}
          onConfirm={handleConfirmTrash}
        />
      )
    }

    if (status === 'results') {
      return (
        <ResultsView
          groups={groups}
          toTrash={toTrash}
          onToggle={toggleTrash}
          onReview={() => setStatus('reviewing')}
        />
      )
    }

    // idle
    return !hasPhotos ? (
      <EmptyState
        icon={<Copy size={34} strokeWidth={1.4} className="text-surface-500" />}
        title="Find duplicate photos"
        body="Side-by-side review of near-identical photos so you can keep the best and trash the rest."
        needsScan
      />
    ) : (
      <EmptyState
        icon={<Copy size={34} strokeWidth={1.4} className="text-primary-600" />}
        warm
        title="Ready to find duplicates"
        body={
          <>
            <span className="font-semibold text-surface-700">{photos.length}</span> photos loaded.
            Detects near-identical images even with slight edits, re-saves, or different file names.
          </>
        }
        footer={
          <>
            <button
              onClick={handleAnalyze}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-medium text-white cursor-default bg-primary-500 hover:bg-primary-600 transition-colors duration-150"
            >
              <Copy size={15} strokeWidth={2} />
              Find Duplicates
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
        title="Duplicates"
        subtitle="Find near-identical photos and keep only the best ones"
      />
      {renderBody()}
    </div>
  )
}

export default Dedup
