import { Upload } from 'lucide-react'
import PanelHeader from '../../components/PanelHeader'
import EmptyState from '../../components/EmptyState'

function Exporter(): React.JSX.Element {
  return (
    <div className="flex flex-col h-full">
      <PanelHeader title="Export" subtitle="Batch resize and convert photos using named presets" />

      <EmptyState
        icon={<Upload size={34} strokeWidth={1.4} className="text-surface-500" />}
        title="Batch export photos"
        body="Define presets (size, quality, format) and export the entire library in one pass. Originals are never touched."
        needsScan
      />
    </div>
  )
}

export default Exporter
