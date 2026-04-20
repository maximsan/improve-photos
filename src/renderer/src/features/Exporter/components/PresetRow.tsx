import { X } from 'lucide-react'
import type { ExportFormat } from '@shared/ipc'
import type { Preset } from '../types'

const FORMATS: ExportFormat[] = ['jpeg', 'webp', 'png']

interface PresetRowProps {
  preset: Preset
  canRemove: boolean
  onChange: (updated: Preset) => void
  onRemove: () => void
}

export function PresetRow({
  preset,
  canRemove,
  onChange,
  onRemove
}: PresetRowProps): React.JSX.Element {
  const set = (patch: Partial<Preset>): void => onChange({ ...preset, ...patch })

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-surface-200 bg-white">
      <input
        type="text"
        value={preset.name}
        onChange={(e) => set({ name: e.target.value })}
        placeholder="name"
        className="w-20 px-2 py-1 rounded-lg border border-surface-200 bg-surface-50 text-[12px] text-surface-800 placeholder-surface-400 focus:border-primary-400 focus:outline-none"
      />

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

      <div className="flex rounded-lg border border-surface-200 overflow-hidden shrink-0">
        {FORMATS.map((fmt) => (
          <button
            key={fmt}
            onClick={() => set({ format: fmt })}
            className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wide cursor-pointer transition-colors ${
              preset.format === fmt
                ? 'bg-primary-500 text-white'
                : 'bg-white text-surface-500 hover:bg-surface-50'
            }`}
          >
            {fmt === 'jpeg' ? 'JPG' : fmt.toUpperCase()}
          </button>
        ))}
      </div>

      <button
        onClick={onRemove}
        disabled={!canRemove}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-surface-400 hover:text-red-400 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <X size={12} strokeWidth={2} />
      </button>
    </div>
  )
}
