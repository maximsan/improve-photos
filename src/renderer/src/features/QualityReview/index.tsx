import { Sparkles } from 'lucide-react'
import PanelHeader from '../../components/PanelHeader'
import EmptyState from '../../components/EmptyState'

function QualityReview(): React.JSX.Element {
  return (
    <div className="flex flex-col h-full">
      <PanelHeader
        title="Quality"
        subtitle="Sort photos by sharpness score and trash the blurry ones"
      />

      <EmptyState
        icon={<Sparkles size={34} strokeWidth={1.4} className="text-surface-500" />}
        title="Review photo quality"
        body="Photos are ranked by Laplacian variance — blurry shots appear first so you can quickly select and trash them."
        needsScan
      />
    </div>
  )
}

export default QualityReview
