// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSettingsPreferences } from '../../src/renderer/src/features/Settings/hooks/useSettingsPreferences'

const SETTINGS_PREFERENCES_KEY = 'cleanupPhotos.settingsPreferences'

describe('useSettingsPreferences', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('loads default settings when no local preferences exist', () => {
    const { result } = renderHook(() => useSettingsPreferences())

    expect(result.current.preferences).toEqual({
      confirmBeforeTrash: true,
      defaultExportFormat: 'jpeg'
    })
  })

  it('persists confirm-before-trash and default export format settings', () => {
    const { result } = renderHook(() => useSettingsPreferences())

    act(() => result.current.setConfirmBeforeTrash(false))
    act(() => result.current.setDefaultExportFormat('webp'))

    expect(result.current.preferences).toEqual({
      confirmBeforeTrash: false,
      defaultExportFormat: 'webp'
    })
    expect(JSON.parse(window.localStorage.getItem(SETTINGS_PREFERENCES_KEY) ?? '{}')).toEqual({
      confirmBeforeTrash: false,
      defaultExportFormat: 'webp'
    })
  })
})
