import { useState } from 'react'
import type { ExportFormat } from '@shared/ipc'

const SETTINGS_PREFERENCES_KEY = 'cleanupPhotos.settingsPreferences'

export interface SettingsPreferences {
  confirmBeforeTrash: boolean
  defaultExportFormat: ExportFormat
}

const DEFAULT_SETTINGS_PREFERENCES: SettingsPreferences = {
  confirmBeforeTrash: true,
  defaultExportFormat: 'jpeg'
}

function isExportFormat(value: unknown): value is ExportFormat {
  return value === 'jpeg' || value === 'png' || value === 'webp'
}

function readSettingsPreferences(): SettingsPreferences {
  try {
    const raw = window.localStorage.getItem(SETTINGS_PREFERENCES_KEY)
    if (!raw) {
      return DEFAULT_SETTINGS_PREFERENCES
    }

    const parsed = JSON.parse(raw) as Partial<SettingsPreferences>
    return {
      confirmBeforeTrash:
        typeof parsed.confirmBeforeTrash === 'boolean'
          ? parsed.confirmBeforeTrash
          : DEFAULT_SETTINGS_PREFERENCES.confirmBeforeTrash,
      defaultExportFormat: isExportFormat(parsed.defaultExportFormat)
        ? parsed.defaultExportFormat
        : DEFAULT_SETTINGS_PREFERENCES.defaultExportFormat
    }
  } catch {
    return DEFAULT_SETTINGS_PREFERENCES
  }
}

function persistSettingsPreferences(preferences: SettingsPreferences): void {
  window.localStorage.setItem(SETTINGS_PREFERENCES_KEY, JSON.stringify(preferences))
}

export interface SettingsPreferencesState {
  preferences: SettingsPreferences
  setConfirmBeforeTrash: (confirmBeforeTrash: boolean) => void
  setDefaultExportFormat: (defaultExportFormat: ExportFormat) => void
}

export function useSettingsPreferences(): SettingsPreferencesState {
  const [preferences, setPreferences] = useState(readSettingsPreferences)

  function updatePreferences(updated: SettingsPreferences): void {
    persistSettingsPreferences(updated)
    setPreferences(updated)
  }

  function setConfirmBeforeTrash(confirmBeforeTrash: boolean): void {
    updatePreferences({ ...preferences, confirmBeforeTrash })
  }

  function setDefaultExportFormat(defaultExportFormat: ExportFormat): void {
    updatePreferences({ ...preferences, defaultExportFormat })
  }

  return { preferences, setConfirmBeforeTrash, setDefaultExportFormat }
}
