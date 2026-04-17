import { useState } from 'react'
import { Upload, FolderOpen, Plus, X, CheckCircle2 } from 'lucide-react'
import PanelHeader from '../../components/PanelHeader'
import EmptyState from '../../components/EmptyState'
import { usePhotos } from '../../context/photos'
import type { ExportFormat, ExportPreset, ExportProgress } from '@shared/ipc'

type ExporterStatus = 'idle' | 'exporting' | 'done'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Preset extends ExportPreset {
  /** Stable React key — never sent to main process */
  id: string
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const WEB_PRESET_WIDTH = 1920
const WEB_PRESET_QUALITY = 85
const THUMB_PRESET_SIZE = 300
const THUMB_PRESET_QUALITY = 75
const DEFAULT_NEW_PRESET_QUALITY = 80

const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'preset-web',
    name: 'web',
    width: WEB_PRESET_WIDTH,
    height: undefined,
    quality: WEB_PRESET_QUALITY,
    format: 'jpeg'
  },
  {
    id: 'preset-thumb',
    name: 'thumb',
    width: THUMB_PRESET_SIZE,
    height: THUMB_PRESET_SIZE,
    quality: THUMB_PRESET_QUALITY,
    format: 'webp'
  }
]

const FORMATS: ExportFormat[] = ['jpeg', 'webp', 'png']

function nextId(): string {
  return `preset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// ─── Preset row ───────────────────────────────────────────────────────────────

interface PresetRowProps {
  preset: Preset
  onChange: (updated: Preset) => void
  onRemove: () => void
  canRemove: boolean
}

function PresetRow({ preset, onChange, onRemove, canRemove }: PresetRowProps): React.JSX.Element {
  const set = (patch: Partial<Preset>): void => onChange({ ...preset, ...patch })

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-surface-200 bg-white">
      {/* Name */}
      <input
        type="text"
        value={preset.name}
        onChange={(e) => set({ name: e.target.value })}
        placeholder="name"
        className="w-20 px-2 py-1 rounded-lg border border-surface-200 bg-surface-50 text-[12px] text-surface-800 placeholder-surface-400 focus:border-primary-400 focus:outline-none"
      />

      {/* Width */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={1}
          value={preset.width ?? ''}
          onChange={(e) =>
            set({ width: e.target.value === '' ? undefined : Number(e.target.value) })
          }
          placeholder="W"
          className="w-14 px-2 py-1 rounded-lg border border-surface-200 bg-surface-50 text-[12px] text-surface-800 placeholder-surface-300 focus:border-primary-400 focus:outline-none"
        />
        <span className="text-[11px] text-surface-300">×</span>
        <input
          type="number"
          min={1}
          value={preset.height ?? ''}
          onChange={(e) =>
            set({ height: e.target.value === '' ? undefined : Number(e.target.value) })
          }
          placeholder="H"
          className="w-14 px-2 py-1 rounded-lg border border-surface-200 bg-surface-50 text-[12px] text-surface-800 placeholder-surface-300 focus:border-primary-400 focus:outline-none"
        />
      </div>

      {/* Quality */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <input
          type="range"
          min={1}
          max={100}
          value={preset.quality}
          onChange={(e) => set({ quality: Number(e.target.value) })}
          className="flex-1 min-w-0 accent-amber-500 h-1"
        />
        <span className="text-[11px] font-medium text-surface-600 w-8 text-right tabular-nums">
          {preset.quality}%
        </span>
      </div>

      {/* Format */}
      <div className="flex rounded-lg border border-surface-200 overflow-hidden shrink-0">
        {FORMATS.map((fmt) => (
          <button
            key={fmt}
            onClick={() => set({ format: fmt })}
            className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wide cursor-default transition-colors ${
              preset.format === fmt
                ? 'bg-primary-500 text-white'
                : 'bg-white text-surface-500 hover:bg-surface-50'
            }`}
          >
            {fmt === 'jpeg' ? 'JPG' : fmt.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        disabled={!canRemove}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-surface-400 hover:text-red-400 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-default"
      >
        <X size={12} strokeWidth={2} />
      </button>
    </div>
  )
}

// ─── Done view ────────────────────────────────────────────────────────────────

function DoneView({
  count,
  outDir,
  onReset
}: {
  count: number
  outDir: string
  onReset: () => void
}): React.JSX.Element {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5">
      <div className="w-18 h-18 rounded-2xl flex items-center justify-center bg-primary-100">
        <CheckCircle2 size={34} strokeWidth={1.4} className="text-primary-600" />
      </div>
      <div className="text-center max-w-xs">
        <h2 className="text-[16px] font-semibold text-surface-800">
          {count} file{count !== 1 ? 's' : ''} exported
        </h2>
        <p className="text-[12px] mt-1 text-surface-500 truncate" title={outDir}>
          {outDir}
        </p>
      </div>
      <button
        onClick={onReset}
        className="text-[12px] font-medium text-primary-600 hover:text-primary-700 cursor-default transition-colors"
      >
        Export again with different presets
      </button>
    </div>
  )
}

// ─── Exporting view ───────────────────────────────────────────────────────────

function ExportingView({ progress }: { progress: ExportProgress | null }): React.JSX.Element {
  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0
  const filename = progress ? (progress.currentPath.split('/').pop() ?? '') : ''

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
      <div className="w-full max-w-sm space-y-3">
        <div className="flex justify-between text-[12px] text-surface-500">
          <span>{progress ? `${progress.done} / ${progress.total} files` : 'Starting…'}</span>
          <span className="font-medium text-surface-700">{pct}%</span>
        </div>
        <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
        {filename && (
          <p className="text-[11px] text-surface-400 truncate text-center" title={filename}>
            {filename}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

function Exporter(): React.JSX.Element {
  const { photos } = usePhotos()
  const [status, setStatus] = useState<ExporterStatus>('idle')
  const [outDir, setOutDir] = useState<string | null>(null)
  const [presets, setPresets] = useState<Preset[]>(DEFAULT_PRESETS)
  const [progress, setProgress] = useState<ExportProgress | null>(null)
  const [exportedCount, setExportedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const hasPhotos = photos.length > 0
  const totalFiles = photos.length * presets.length
  const canExport = hasPhotos && outDir !== null && presets.length > 0

  const updatePreset = (id: string, updated: Preset): void => {
    setPresets((prev) => prev.map((p) => (p.id === id ? updated : p)))
  }

  const removePreset = (id: string): void => {
    setPresets((prev) => prev.filter((p) => p.id !== id))
  }

  const addPreset = (): void => {
    setPresets((prev) => [
      ...prev,
      {
        id: nextId(),
        name: 'preset',
        width: undefined,
        height: undefined,
        quality: DEFAULT_NEW_PRESET_QUALITY,
        format: 'jpeg'
      }
    ])
  }

  async function handlePickFolder(): Promise<void> {
    const path = await window.api.pickFolder()
    if (path) setOutDir(path)
  }

  async function handleExport(): Promise<void> {
    if (!outDir) return
    setError(null)
    setProgress(null)
    setStatus('exporting')

    // Build ExportPreset objects without the internal `id` field
    const ipcPresets = presets.map(
      (p): ExportPreset => ({
        name: p.name,
        width: p.width,
        height: p.height,
        quality: p.quality,
        format: p.format
      })
    )

    const unsubscribe = window.api.onExportProgress((p) => setProgress(p))
    try {
      await window.api.exportBatch(photos, ipcPresets, outDir)
      setExportedCount(totalFiles)
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
      setStatus('idle')
    } finally {
      unsubscribe()
    }
  }

  if (status === 'exporting') {
    return (
      <div className="flex flex-col h-full">
        <PanelHeader
          title="Export"
          subtitle="Batch resize and convert photos using named presets"
        />
        <ExportingView progress={progress} />
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="flex flex-col h-full">
        <PanelHeader
          title="Export"
          subtitle="Batch resize and convert photos using named presets"
        />
        <DoneView count={exportedCount} outDir={outDir ?? ''} onReset={() => setStatus('idle')} />
      </div>
    )
  }

  if (!hasPhotos) {
    return (
      <div className="flex flex-col h-full">
        <PanelHeader
          title="Export"
          subtitle="Batch resize and convert photos using named presets"
        />
        <EmptyState
          icon={<Upload size={34} strokeWidth={1.4} className="text-surface-500" />}
          title="Batch export photos"
          body="Define presets (size, quality, format) and export the entire library in one pass. Originals are never touched."
          needsScan
        />
      </div>
    )
  }

  // idle with photos
  return (
    <div className="flex flex-col h-full">
      <PanelHeader title="Export" subtitle="Batch resize and convert photos using named presets" />

      {/* Settings */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Output folder */}
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

        {/* Presets */}
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

          {/* Column headers */}
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
                onChange={(updated) => updatePreset(preset.id, updated)}
                onRemove={() => removePreset(preset.id)}
                canRemove={presets.length > 1}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-5 py-4 border-t border-surface-200 bg-white">
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-surface-500">
            <span className="font-semibold text-surface-800">{photos.length}</span> photos ×{' '}
            <span className="font-semibold text-surface-800">{presets.length}</span> preset
            {presets.length !== 1 ? 's' : ''} ={' '}
            <span className="font-semibold text-surface-800">{totalFiles}</span> files
          </p>
          <button
            onClick={handleExport}
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
