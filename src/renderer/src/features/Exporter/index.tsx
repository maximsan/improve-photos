import { Upload, FolderOpen, Plus } from 'lucide-react'
import PanelHeader from '../../components/PanelHeader'
import EmptyState from '../../components/EmptyState'
import { usePhotos } from '../../context/photos'
import { useExporterState } from './hooks/useExporterState'
import { usePresets } from './hooks/usePresets'
import { PresetRow } from './components/PresetRow'
import { ExportingView } from './components/ExportingView'
import { DoneView } from './components/DoneView'

const PANEL_HEADER = (
  <PanelHeader title="Export" subtitle="Batch resize and convert photos using named presets" />
)

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
      <div className="flex flex-col h-full">
        {PANEL_HEADER}
        <ExportingView progress={progress} />
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="flex flex-col h-full">
        {PANEL_HEADER}
        <DoneView count={exportedCount} outDir={outDir ?? ''} onReset={reset} />
      </div>
    )
  }

  if (!hasPhotos) {
    return (
      <div className="flex flex-col h-full">
        {PANEL_HEADER}
        <EmptyState
          icon={<Upload size={34} strokeWidth={1.4} className="text-surface-500" />}
          title="Batch export photos"
          body="Define presets (size, quality, format) and export the entire library in one pass. Originals are never touched."
          needsScan
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {PANEL_HEADER}

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <section>
          <h3 className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-2">
            Output Folder
          </h3>
          <button
            onClick={handlePickFolder}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-surface-200 bg-white hover:border-surface-300 transition-colors cursor-default"
          >
            <FolderOpen size={16} className="text-primary-500 shrink-0" />
            <span
              className={`text-[12px] flex-1 text-left truncate ${outDir ? 'text-surface-800' : 'text-surface-400'}`}
            >
              {outDir ?? 'Choose output folder…'}
            </span>
            <span className="text-[11px] font-medium text-primary-600 shrink-0">
              {outDir ? 'Change' : 'Browse'}
            </span>
          </button>
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider">
              Presets
            </h3>
            <button
              onClick={addPreset}
              className="flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:text-primary-700 cursor-default transition-colors"
            >
              <Plus size={12} strokeWidth={2.5} />
              Add Preset
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 mb-1">
            <span className="w-20 text-[10px] font-medium text-surface-400 uppercase tracking-wide">
              Name
            </span>
            <span className="w-31 text-[10px] font-medium text-surface-400 uppercase tracking-wide">
              Size (px)
            </span>
            <span className="flex-1 text-[10px] font-medium text-surface-400 uppercase tracking-wide">
              Quality
            </span>
            <span className="w-27 text-[10px] font-medium text-surface-400 uppercase tracking-wide">
              Format
            </span>
            <span className="w-6" />
          </div>

          <div className="space-y-2">
            {presets.map((preset) => (
              <PresetRow
                key={preset.id}
                preset={preset}
                canRemove={presets.length > 1}
                onChange={(updated) => updatePreset(preset.id, updated)}
                onRemove={() => removePreset(preset.id)}
              />
            ))}
          </div>
        </section>
      </div>

      <div className="shrink-0 px-5 py-4 border-t border-surface-200 bg-white">
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-surface-500">
            <span className="font-semibold text-surface-800">{photos.length}</span> photos ×{' '}
            <span className="font-semibold text-surface-800">{presets.length}</span> preset
            {presets.length !== 1 ? 's' : ''} ={' '}
            <span className="font-semibold text-surface-800">{totalFiles}</span> files
          </p>
          <button
            onClick={() => handleExport(presets)}
            disabled={!canExport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-default"
          >
            <Upload size={14} strokeWidth={2} />
            Export {totalFiles} File{totalFiles !== 1 ? 's' : ''}
          </button>
        </div>
        {error && <p className="text-[11px] text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  )
}

export default Exporter
