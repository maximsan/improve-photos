import { ScanSearch, FolderOpen } from 'lucide-react'
import PanelHeader from '../../components/PanelHeader'
import EmptyState from '../../components/EmptyState'
import SpinnerView from '../../components/SpinnerView'
import { PrimaryButton } from '../../components/PrimaryButton'
import { FormErrorText } from '../../components/FormErrorText'
import { useScannerState } from './hooks/useScannerState'
import { ScanResults } from './components/ScanResults'

function Scanner(): React.JSX.Element {
  const { status, localPhotos, folderPath, error, handleChooseFolder, handleRescan } =
    useScannerState()

  function renderBody(): React.JSX.Element | null {
    if (status === 'scanning') {
      return <SpinnerView message="Reading metadata…" />
    }

    if (status === 'done' && folderPath) {
      return (
        <ScanResults
          photos={localPhotos}
          folderPath={folderPath}
          onRescan={handleRescan}
          onChoose={handleChooseFolder}
        />
      )
    }

    if (status === 'idle') {
      return (
        <EmptyState
          icon={<ScanSearch size={34} strokeWidth={1.4} className="text-primary-600" />}
          warm
          title="Choose a folder to scan"
          body="Cleanup reads EXIF metadata and dimensions from every photo in the folder. No files are moved or changed."
          footer={
            <>
              <PrimaryButton onClick={handleChooseFolder}>
                <FolderOpen size={15} strokeWidth={2} />
                Choose Folder
              </PrimaryButton>
              {error ? <FormErrorText>{error}</FormErrorText> : null}
              {!error ? (
                <p className="text-[11px] text-surface-400">Supports JPEG, HEIC, PNG, WebP, TIFF</p>
              ) : null}
            </>
          }
        />
      )
    }

    return null
  }

  return (
    <div className="flex flex-col h-full">
      <PanelHeader title="Scan Folder" subtitle="Walk a directory and read photo metadata" />
      <div className="flex-1 min-h-0 flex flex-col">{renderBody()}</div>
    </div>
  )
}

export default Scanner
