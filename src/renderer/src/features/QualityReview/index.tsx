import { Sparkles } from 'lucide-react'
import PanelHeader from '../../components/PanelHeader'
import { ProgressView } from '../../components/ProgressView'
import { PhotosRequiredCallout } from '../../components/PhotosRequiredCallout'
import { FormErrorText } from '../../components/FormErrorText'
import { usePhotos } from '../../context/photos'
import { useQualityReviewState } from './hooks/useQualityReviewState'
import { qualityReviewSubtitle } from './lib/qualityReviewSubtitle'
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
    progress,
    isScoring,
    toggleSelect,
    selectAll,
    handleScore,
    handleConfirmTrash,
    handleReset,
    setStatus
  } = useQualityReviewState(photos)

  const hasPhotos = photos.length > 0

  function renderBody(): React.JSX.Element {
    if (status === 'trashing') {
      return <ProgressView label="Moving files to Trash…" percent={100} />
    }
    if (status === 'done') {
      return <DoneView onReset={handleReset} />
    }

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
          {error ? (
            <FormErrorText className="shrink-0 px-5 pb-3 text-center">{error}</FormErrorText>
          ) : null}
        </>
      )
    }

    if (status === 'results') {
      return (
        <ResultsGrid
          photos={photos}
          scores={scores}
          selected={selected}
          isScoring={isScoring}
          progress={progress}
          onToggle={toggleSelect}
          onSelectAll={selectAll}
          onReview={() => setStatus('reviewing')}
          onReset={handleScore}
          onClear={handleReset}
        />
      )
    }

    return (
      <PhotosRequiredCallout
        hasPhotos={hasPhotos}
        idleIcon={<Sparkles size={34} strokeWidth={1.4} className="text-surface-500" />}
        readyIcon={<Sparkles size={34} strokeWidth={1.4} className="text-primary-600" />}
        titleNeedsScan="Review photo quality"
        titleReady="Ready to score"
        bodyNeedsScan="Photos are ranked by Laplacian variance — blurry shots appear first so you can quickly select and trash them."
        bodyReady={
          <>
            <span className="font-semibold text-surface-700">{photos.length}</span> photos loaded.
            Sharpness is measured by Laplacian variance — blurry photos score lower.
          </>
        }
        actionLabel="Analyse Sharpness"
        actionIcon={<Sparkles size={15} strokeWidth={2} />}
        onAction={handleScore}
        error={error}
      />
    )
  }

  const subtitle = qualityReviewSubtitle(status, photos.length, selected.size)

  return (
    <div className="flex flex-col h-full">
      <PanelHeader title="Quality" subtitle={subtitle} />
      <div className="flex-1 min-h-0 flex flex-col">{renderBody()}</div>
    </div>
  )
}

export default QualityReview
