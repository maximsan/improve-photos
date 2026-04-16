import { Copy } from 'lucide-react'
import PanelHeader from '../../components/PanelHeader'
import EmptyState from '../../components/EmptyState'

function Dedup(): React.JSX.Element {
  return (
    <div className="flex flex-col h-full">
      <PanelHeader
        title="Duplicates"
        subtitle="Find visually identical photos using perceptual hashing"
      />

      <EmptyState
        icon={<Copy size={34} strokeWidth={1.4} className="text-surface-500" />}
        title="Find duplicate photos"
        body="Side-by-side review of near-identical photos so you can keep the best and trash the rest."
        needsScan
      />
    </div>
  )
}

export default Dedup
