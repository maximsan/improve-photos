import { useState } from 'react'
import type { Preset } from '../types'

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

function nextId(): string {
  return `preset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export type PresetsState = {
  presets: Preset[]
  updatePreset: (id: string, updated: Preset) => void
  removePreset: (id: string) => void
  addPreset: () => void
}

export function usePresets(): PresetsState {
  const [presets, setPresets] = useState<Preset[]>(DEFAULT_PRESETS)

  function updatePreset(id: string, updated: Preset): void {
    setPresets((prev) => prev.map((p) => (p.id === id ? updated : p)))
  }

  function removePreset(id: string): void {
    setPresets((prev) => prev.filter((p) => p.id !== id))
  }

  function addPreset(): void {
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

  return { presets, updatePreset, removePreset, addPreset }
}
