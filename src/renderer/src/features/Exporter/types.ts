import type { ExportPreset } from '@shared/ipc'

/** ExportPreset extended with a stable React key — never sent to the main process. */
export interface Preset extends ExportPreset {
  id: string
}
