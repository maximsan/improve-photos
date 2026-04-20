import { Plus } from 'lucide-react'
import { PresetRow } from './PresetRow'
import type { Preset } from '../types'

interface PresetsTableSectionProps {
  presets: Preset[]
  onUpdatePreset: (id: string, updated: Preset) => void
  onRemovePreset: (id: string) => void
  onAddPreset: () => void
}

export function PresetsTableSection({
  presets,
  onUpdatePreset,
  onRemovePreset,
  onAddPreset
}: PresetsTableSectionProps): React.JSX.Element {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider">
          Presets
        </h3>
        <button
          type="button"
          onClick={onAddPreset}
          className="flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:text-primary-700 cursor-pointer transition-colors"
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
            onChange={(updated) => onUpdatePreset(preset.id, updated)}
            onRemove={() => onRemovePreset(preset.id)}
          />
        ))}
      </div>
    </section>
  )
}
