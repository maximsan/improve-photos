import { ScanSearch } from 'lucide-react'
import PanelHeader from '../../components/PanelHeader'
import EmptyState from '../../components/EmptyState'

function Scanner(): React.JSX.Element {
  return (
    <div className="flex flex-col h-full">
      <PanelHeader title="Scan Folder" subtitle="Walk a directory and read photo metadata" />

      <EmptyState
        icon={<ScanSearch size={34} strokeWidth={1.4} className="text-primary-600" />}
        warm
        title="Choose a folder to scan"
        body="Cleanup reads EXIF metadata and dimensions from every photo in the folder. No files are moved or changed."
        footer={
          <>
            <button className="px-5 py-2.5 rounded-lg text-[13px] font-medium text-white cursor-default bg-primary-500 hover:bg-primary-600 transition-colors duration-150">
              Choose Folder
            </button>
            <p className="text-[11px] text-surface-400">Supports JPEG, HEIC, PNG, WebP, TIFF</p>
          </>
        }
      />
    </div>
  )
}

export default Scanner
