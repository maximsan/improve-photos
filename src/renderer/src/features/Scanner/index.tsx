import { ScanSearch, FolderOpen } from 'lucide-react'
import PanelHeader from '../../components/PanelHeader'
import EmptyState from '../../components/EmptyState'
import SpinnerView from '../../components/SpinnerView'
import { useScannerState } from './hooks/useScannerState'
import { ScanResults } from './components/ScanResults'

function Scanner(): React.JSX.Element {
  const { status, localPhotos, folderPath, error, handleChooseFolder, handleRescan } =
    useScannerState()

  return (
    <div className="flex flex-col h-full">
      <PanelHeader title="Scan Folder" subtitle="Walk a directory and read photo metadata" />

      {status === 'scanning' && <SpinnerView message="Reading metadata…" />}

      {status === 'done' && folderPath && (
        <ScanResults
          photos={localPhotos}
          folderPath={folderPath}
          onRescan={handleRescan}
          onChoose={handleChooseFolder}
        />
      )}

      {status === 'idle' && (
        <EmptyState
          icon={<ScanSearch size={34} strokeWidth={1.4} className="text-primary-600" />}
          warm
          title="Choose a folder to scan"
          body="Cleanup reads EXIF metadata and dimensions from every photo in the folder. No files are moved or changed."
          footer={
            <>
              <button
                onClick={handleChooseFolder}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-medium text-white cursor-default bg-primary-500 hover:bg-primary-600 transition-colors duration-150"
              >
                <FolderOpen size={15} strokeWidth={2} />
                Choose Folder
              </button>
              {error && <p className="text-[11px] text-red-500">{error}</p>}
              {!error && (
                <p className="text-[11px] text-surface-400">Supports JPEG, HEIC, PNG, WebP, TIFF</p>
              )}
            </>
          }
        />
      )}
    </div>
  )
}

export default Scanner
