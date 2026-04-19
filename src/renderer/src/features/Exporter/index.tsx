import { Upload } from 'lucide-react'
import EmptyState from '../../components/EmptyState'
import { usePhotos } from '../../context/photos'
import { useExporterState } from './hooks/useExporterState'
import { usePresets } from './hooks/usePresets'
import { ExportingView } from './components/ExportingView'
import { DoneView } from './components/DoneView'
import { ExporterLayout } from './components/ExporterLayout'
import { OutputFolderSection } from './components/OutputFolderSection'
import { PresetsTableSection } from './components/PresetsTableSection'
import { ExportActionsFooter } from './components/ExportActionsFooter'

function Exporter(): React.JSX.Element {
  const { photos } = usePhotos()
  const { status, outDir, progress, exportedCount, error, handlePickFolder, handleExport, reset } =
    useExporterState()
  const { presets, updatePreset, removePreset, addPreset } = usePresets()

  const hasPhotos = photos.length > 0
  const totalFiles = photos.length * presets.length
  const canExport = hasPhotos && outDir !== null && presets.length > 0

  if (status === 'exporting') {
    return (
      <ExporterLayout>
        <ExportingView progress={progress} />
      </ExporterLayout>
    )
  }

  if (status === 'done') {
    return (
      <ExporterLayout>
        <DoneView count={exportedCount} outDir={outDir ?? ''} onReset={reset} />
      </ExporterLayout>
    )
  }

  if (!hasPhotos) {
    return (
      <ExporterLayout>
        <EmptyState
          icon={<Upload size={34} strokeWidth={1.4} className="text-surface-500" />}
          title="Batch export photos"
          body="Define presets (size, quality, format) and export the entire library in one pass. Originals are never touched."
          needsScan
        />
      </ExporterLayout>
    )
  }

  return (
    <ExporterLayout>
      <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
        <OutputFolderSection outDir={outDir} onPickFolder={handlePickFolder} />
        <PresetsTableSection
          presets={presets}
          onUpdatePreset={updatePreset}
          onRemovePreset={removePreset}
          onAddPreset={addPreset}
        />
      </div>

      <ExportActionsFooter
        photoCount={photos.length}
        presetCount={presets.length}
        totalFiles={totalFiles}
        canExport={canExport}
        error={error}
        presets={presets}
        onExport={handleExport}
      />
    </ExporterLayout>
  )
}

export default Exporter
