import { Sparkles } from 'lucide-react'
import PanelHeader from '../../components/PanelHeader'
import EmptyState from '../../components/EmptyState'
import SpinnerView from '../../components/SpinnerView'
import { usePhotos } from '../../context/photos'
import { useQualityReviewState } from './hooks/useQualityReviewState'
import { DoneView } from './components/DoneView'
import { ReviewScreen } from './components/ReviewScreen'
import { ResultsGrid } from './components/ResultsGrid'

function QualityReview(): React.JSX.Element {
  const { photos } = usePhotos()
  const {
    status,
    scores,
    selected,
    error,
    toggleSelect,
    selectAll,
    handleScore,
    handleConfirmTrash,
    setStatus
  } = useQualityReviewState(photos)

  const hasPhotos = photos.length > 0

  function renderBody(): React.JSX.Element {
    if (status === 'scoring') return <SpinnerView message="Analysing sharpness…" />
    if (status === 'trashing')
      return <SpinnerView message="Moving files to Trash…" variant="danger" />
    if (status === 'done') return <DoneView />

    if (status === 'reviewing') {
      return (
        <>
          <ReviewScreen
            photos={photos}
            scores={scores}
            selected={selected}
            onBack={() => setStatus('results')}
            onConfirm={handleConfirmTrash}
          />
          {error && (
            <p className="shrink-0 px-5 pb-3 text-[11px] text-red-500 text-center">{error}</p>
          )}
        </>
      )
    }

    if (status === 'results') {
      return (
        <ResultsGrid
          photos={photos}
          scores={scores}
          selected={selected}
          onToggle={toggleSelect}
          onSelectAll={selectAll}
          onReview={() => setStatus('reviewing')}
        />
      )
    }

    // idle
    return !hasPhotos ? (
      <EmptyState
        icon={<Sparkles size={34} strokeWidth={1.4} className="text-surface-500" />}
        title="Review photo quality"
        body="Photos are ranked by Laplacian variance — blurry shots appear first so you can quickly select and trash them."
        needsScan
      />
    ) : (
      <EmptyState
        icon={<Sparkles size={34} strokeWidth={1.4} className="text-primary-600" />}
        warm
        title="Ready to score"
        body={
          <>
            <span className="font-semibold text-surface-700">{photos.length}</span> photos loaded.
            Sharpness is measured by Laplacian variance — blurry photos score lower.
          </>
        }
        footer={
          <>
            <button
              onClick={handleScore}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-medium text-white cursor-default bg-primary-500 hover:bg-primary-600 transition-colors duration-150"
            >
              <Sparkles size={15} strokeWidth={2} />
              Analyse Sharpness
            </button>
            {error && <p className="text-[11px] text-red-500">{error}</p>}
          </>
        }
      />
    )
  }

  const subtitle =
    status === 'results' || status === 'reviewing'
      ? selected.size > 0
        ? `${photos.length} photos · ${selected.size} selected to trash`
        : `${photos.length} photos analysed`
      : 'Sort photos by sharpness score and trash the blurry ones'

  return (
    <div className="flex flex-col h-full">
      <PanelHeader title="Quality" subtitle={subtitle} />
      {renderBody()}
    </div>
  )
}

export default QualityReview
