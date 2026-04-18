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

/** Perceptual hash keyed by absolute file path */
export interface PhotoHashes {
  [path: string]: string
}

/** Laplacian variance score — lower means blurrier */
export interface BlurScores {
  [path: string]: number
}

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

/** Progress event emitted after each file is hashed (or fails) during deduplication. */
export interface HashProgress {
  done: number
  total: number
  /** Absolute path of the file that just finished processing */
  current: string
}

// ─── IPC channel names (single source of truth) ──────────────────────────────

export const IPC = {
  PICK_FOLDER: 'pick-folder',
  SCAN: 'scan',
  COMPUTE_HASHES: 'compute-hashes',
  GET_DUPLICATE_GROUPS: 'get-duplicate-groups',
  GET_BLUR_SCORES: 'get-blur-scores',
  PREVIEW_ORGANIZE: 'preview-organize',
  EXECUTE_ORGANIZE: 'execute-organize',
  TRASH_FILES: 'trash-files',
  EXPORT_BATCH: 'export-batch',
  EXPORT_PROGRESS: 'export-progress',
  HASH_PROGRESS: 'dedup:hash-progress',
  CANCEL_HASHES: 'dedup:cancel-hashes',
  CONFIRM_TRASH: 'dedup:confirm-trash'
} as const

// ─── Typed window.api surface (matches preload contextBridge) ────────────────

export interface ElectronAPI {
  /** Opens a native folder-picker dialog; resolves to the chosen path or null if cancelled */
  pickFolder: () => Promise<string | null>
  scan: (folderPath: string) => Promise<PhotoRecord[]>
  computeHashes: (paths: string[]) => Promise<PhotoHashes>
  getDuplicateGroups: (hashes: PhotoHashes) => Promise<DuplicateGroup[]>
  getBlurScores: (paths: string[]) => Promise<BlurScores>
  previewOrganize: (photos: PhotoRecord[]) => Promise<MoveOperation[]>
  executeOrganize: (ops: MoveOperation[]) => Promise<void>
  trashFiles: (paths: string[]) => Promise<void>
  exportBatch: (photos: PhotoRecord[], presets: ExportPreset[], outDir: string) => Promise<void>
  onExportProgress: (cb: (progress: ExportProgress) => void) => () => void
  /** Subscribe to per-file hash progress events. Returns an unsubscribe function. */
  onHashProgress: (cb: (progress: HashProgress) => void) => () => void
  /** Cancel an in-progress `computeHashes` call. */
  cancelHashes: () => Promise<void>
  /** Show a native macOS confirmation dialog before trashing. Resolves to true if confirmed. */
  confirmTrash: (count: number) => Promise<boolean>
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
