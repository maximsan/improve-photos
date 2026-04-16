import { CalendarCheck } from 'lucide-react'
import PanelHeader from '../../components/PanelHeader'
import EmptyState from '../../components/EmptyState'

function Organizer(): React.JSX.Element {
  return (
    <div className="flex flex-col h-full">
      <PanelHeader
        title="Organize"
        subtitle="Move photos into date-based folders using EXIF metadata"
      />

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
    </div>
  )
}

export default Organizer
