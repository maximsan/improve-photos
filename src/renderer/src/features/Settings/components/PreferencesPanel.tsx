import type { ExportFormat } from '@shared/ipc'
import type { SettingsPreferences } from '../hooks/useSettingsPreferences'

interface PreferencesPanelProps {
  preferences: SettingsPreferences
  onConfirmBeforeTrashChange: (confirmBeforeTrash: boolean) => void
  onDefaultExportFormatChange: (defaultExportFormat: ExportFormat) => void
}

const EXPORT_FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' },
  { value: 'png', label: 'PNG' }
]

function PreferencesPanel({
  preferences,
  onConfirmBeforeTrashChange,
  onDefaultExportFormatChange
}: PreferencesPanelProps): React.JSX.Element {
  return (
    <section className="max-w-3xl">
      <div className="mb-4">
        <h1 className="text-[15px] font-semibold text-surface-900">Preferences</h1>
        <p className="mt-1 text-[12px] leading-relaxed text-surface-500">
          These settings are stored locally on this Mac.
        </p>
      </div>

      <div className="space-y-3">
        <label className="flex items-start justify-between gap-4 rounded-lg border border-surface-200 bg-white px-4 py-3">
          <span>
            <span className="block text-[13px] font-semibold text-surface-900">
              Confirm before Trash
            </span>
            <span className="mt-1 block text-[12px] leading-relaxed text-surface-500">
              Show a confirmation before moving selected photos to macOS Trash.
            </span>
          </span>
          <input
            type="checkbox"
            checked={preferences.confirmBeforeTrash}
            onChange={(event) => onConfirmBeforeTrashChange(event.currentTarget.checked)}
            className="mt-1 h-4 w-4 accent-primary-600"
          />
        </label>

        <label className="flex items-center justify-between gap-4 rounded-lg border border-surface-200 bg-white px-4 py-3">
          <span>
            <span className="block text-[13px] font-semibold text-surface-900">
              Default export format
            </span>
            <span className="mt-1 block text-[12px] leading-relaxed text-surface-500">
              Used as the preferred format for new export presets.
            </span>
          </span>
          <select
            value={preferences.defaultExportFormat}
            onChange={(event) =>
              onDefaultExportFormatChange(event.currentTarget.value as ExportFormat)
            }
            className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-[13px] text-surface-700"
          >
            {EXPORT_FORMAT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  )
}

export default PreferencesPanel
