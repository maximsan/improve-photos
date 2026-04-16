/**
 * Shared TypeScript types used by both the main process and the renderer.
 * Nothing in this file should import from Node.js or Electron — it must be
 * safe to import in the browser (renderer) context.
 */

// ─── Photo record ────────────────────────────────────────────────────────────

export interface PhotoRecord {
  /** Absolute path to the file */
  path: string
  /** File name without directory */
  name: string
  /** File size in bytes */
  size: number
  /** EXIF capture date, if available */
  dateTaken: string | null
  /** Image width in pixels */
  width: number | null
  /** Image height in pixels */
  height: number | null
  /** Camera make + model from EXIF, if available */
  camera: string | null
}

// ─── Deduplication ───────────────────────────────────────────────────────────

export interface DuplicateGroup {
  /** Perceptual hash shared by all members (approximate) */
  hash: string
  /** Photos in this group, sorted largest-file-first */
  photos: PhotoRecord[]
}

// ─── Organizer ───────────────────────────────────────────────────────────────

export interface MoveOperation {
  photo: PhotoRecord
  /** Absolute destination path, e.g. /root/2024/07/15/IMG_001.jpg */
  targetPath: string
  /** Whether a file already exists at targetPath */
  conflict: boolean
}

// ─── Quality / blur ──────────────────────────────────────────────────────────

/** Laplacian variance score — lower means blurrier */
export type BlurScores = Record<string, number>

// ─── Exporter ────────────────────────────────────────────────────────────────

export type ExportFormat = 'jpeg' | 'png' | 'webp'

export interface ExportPreset {
  name: string
  /** Target width in px; omit to preserve aspect ratio with height only */
  width?: number
  /** Target height in px; omit to preserve aspect ratio with width only */
  height?: number
  /** 1–100 */
  quality: number
  format: ExportFormat
}

export interface ExportProgress {
  done: number
  total: number
  currentPath: string
}

// ─── IPC channel names (single source of truth) ──────────────────────────────

export const IPC = {
  SCAN: 'scan',
  COMPUTE_HASHES: 'compute-hashes',
  GET_DUPLICATE_GROUPS: 'get-duplicate-groups',
  GET_BLUR_SCORES: 'get-blur-scores',
  PREVIEW_ORGANIZE: 'preview-organize',
  EXECUTE_ORGANIZE: 'execute-organize',
  TRASH_FILES: 'trash-files',
  EXPORT_BATCH: 'export-batch',
  EXPORT_PROGRESS: 'export-progress'
} as const

// ─── Typed window.api surface (matches preload contextBridge) ────────────────

export interface ElectronAPI {
  scan: (folderPath: string) => Promise<PhotoRecord[]>
  computeHashes: (paths: string[]) => Promise<Record<string, string>>
  getDuplicateGroups: (hashes: Record<string, string>) => Promise<DuplicateGroup[]>
  getBlurScores: (paths: string[]) => Promise<BlurScores>
  previewOrganize: (photos: PhotoRecord[]) => Promise<MoveOperation[]>
  executeOrganize: (ops: MoveOperation[]) => Promise<void>
  trashFiles: (paths: string[]) => Promise<void>
  exportBatch: (photos: PhotoRecord[], presets: ExportPreset[], outDir: string) => Promise<void>
  onExportProgress: (cb: (progress: ExportProgress) => void) => () => void
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
