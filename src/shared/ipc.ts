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

/** Progress event emitted after each file is scored during quality analysis. */
export interface QualityProgress {
  done: number
  total: number
  current: string
}

/** Per-photo score emitted as each file is processed (before the full batch resolves). */
export interface QualityScoreItem {
  path: string
  score: number
}

/** Progress event emitted after each file is read during a folder scan. */
export interface ScanProgress {
  done: number
  total: number
  current: string
}

export interface ScanLimit {
  photoCount: number
  photoLimit: number
}

/** Limit case is returned as data, not thrown, so the renderer shows an upsell instead of a raw IPC error. */
export type ScanResult = { ok: true; photos: PhotoRecord[] } | { ok: false; limit: ScanLimit }

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

// ─── Release feature gates ──────────────────────────────────────────────────

export interface ReleaseFeatureFlags {
  paymentsEnabled: boolean
  autoUpdatesEnabled: boolean
  releasePublishingEnabled: boolean
}

// ─── Licensing ───────────────────────────────────────────────────────────────

export const FREE_PHOTO_LIMIT = 100

// 'disabled' = payments gate off (no activation, unlimited); 'unlicensed' = gate on but no license (100 cap).
export type LicenseState = 'disabled' | 'unlicensed' | 'licensed'

export type LicenseStatus =
  | { state: 'disabled' }
  | { state: 'unlicensed' }
  /** Redacted key for display, e.g. `••••WXYZ`; fixed-length mask so the real key length isn't leaked. */
  | { state: 'licensed'; maskedLicenseKey: string }

export interface EntitlementStatus {
  licensed: boolean
  photoLimit: number | null
}

export interface PhotoCountDecision {
  allowed: boolean
  photoLimit: number | null
  reason: string | null
}

// ─── Auto-updates ────────────────────────────────────────────────────────────

export type UpdateState =
  | 'disabled'
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'ready'
  | 'error'

export interface UpdateStatus {
  state: UpdateState
  version: string | null
  percent: number | null
  message: string | null
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
  CANCEL_SCAN: 'scanner:cancel',
  CANCEL_EXPORT: 'export:cancel',
  CANCEL_QUALITY: 'quality:cancel',
  UNDO_ORGANIZE: 'undo-organize',
  CONFIRM_TRASH: 'dedup:confirm-trash',
  QUALITY_PROGRESS: 'quality:progress',
  QUALITY_SCORE_ITEM: 'quality:score-item',
  SCAN_PROGRESS: 'scanner:progress',
  GET_RELEASE_FEATURE_FLAGS: 'release:get-feature-flags',
  GET_LICENSE_STATUS: 'license:get-status',
  ACTIVATE_LICENSE: 'license:activate',
  DEACTIVATE_LICENSE: 'license:deactivate',
  GET_ENTITLEMENT_STATUS: 'entitlement:get-status',
  CAN_PROCESS_PHOTO_COUNT: 'entitlement:can-process-photo-count',
  GET_UPDATE_STATUS: 'updates:get-status',
  CHECK_FOR_UPDATES: 'updates:check',
  DOWNLOAD_UPDATE: 'updates:download',
  INSTALL_UPDATE: 'updates:install',
  UPDATE_STATUS: 'updates:status'
} as const

// ─── Typed window.api surface (matches preload contextBridge) ────────────────

export interface ElectronAPI {
  /** Opens a native folder-picker dialog; resolves to the chosen path or null if cancelled */
  pickFolder: () => Promise<string | null>
  scan: (folderPath: string) => Promise<ScanResult>
  computeHashes: (paths: string[]) => Promise<PhotoHashes>
  getDuplicateGroups: (hashes: PhotoHashes) => Promise<DuplicateGroup[]>
  getBlurScores: (paths: string[]) => Promise<BlurScores>
  previewOrganize: (photos: PhotoRecord[], scanRoot: string) => Promise<MoveOperation[]>
  executeOrganize: (ops: MoveOperation[]) => Promise<void>
  trashFiles: (paths: string[]) => Promise<void>
  exportBatch: (photos: PhotoRecord[], presets: ExportPreset[], outDir: string) => Promise<void>
  onExportProgress: (cb: (progress: ExportProgress) => void) => () => void
  /** Subscribe to per-file hash progress events. Returns an unsubscribe function. */
  onHashProgress: (cb: (progress: HashProgress) => void) => () => void
  /** Subscribe to per-file quality-scoring progress events. Returns an unsubscribe function. */
  onQualityProgress: (cb: (progress: QualityProgress) => void) => () => void
  /** Subscribe to individual photo score events (fires per photo as scored). Returns an unsubscribe function. */
  onQualityScoreItem: (cb: (item: QualityScoreItem) => void) => () => void
  /** Subscribe to per-file scan progress events. Returns an unsubscribe function. */
  onScanProgress: (cb: (progress: ScanProgress) => void) => () => void
  /** Cancel an in-progress `computeHashes` call. */
  cancelHashes: () => Promise<void>
  /** Cancel an in-progress `scan` call. */
  cancelScan: () => Promise<void>
  /** Reverse a previous `executeOrganize` call by moving files back to their original paths. */
  undoOrganize: (pairs: { from: string; to: string }[]) => Promise<void>
  /** Cancel an in-progress `exportBatch` call. */
  cancelExport: () => Promise<void>
  /** Cancel an in-progress `getBlurScores` call. */
  cancelQuality: () => Promise<void>
  /** Show a native macOS confirmation dialog before trashing. Resolves to true if confirmed. */
  confirmTrash: (count: number) => Promise<boolean>
  /** Read release-mode feature gates. Disabled gates must not make network calls. */
  getReleaseFeatureFlags: () => Promise<ReleaseFeatureFlags>
  /** Read stored license state. */
  getLicenseStatus: () => Promise<LicenseStatus>
  /** Activate a one-time Lemon Squeezy license key. */
  activateLicense: (licenseKey: string) => Promise<LicenseStatus>
  /** Deactivate the stored Lemon Squeezy license instance. */
  deactivateLicense: () => Promise<LicenseStatus>
  /** Read current processing entitlement. */
  getEntitlementStatus: () => Promise<EntitlementStatus>
  /** Check whether a workflow can process the requested photo count. */
  canProcessPhotoCount: (photoCount: number) => Promise<PhotoCountDecision>
  /** Read current update state. */
  getUpdateStatus: () => Promise<UpdateStatus>
  /** Check GitHub Releases for updates when the auto-update gate is enabled. */
  checkForUpdates: () => Promise<UpdateStatus>
  /** Download an available update. */
  downloadUpdate: () => Promise<UpdateStatus>
  /** Install a downloaded update after user confirmation. */
  installUpdate: () => Promise<void>
  /** Subscribe to update status changes. Returns an unsubscribe function. */
  onUpdateStatus: (cb: (status: UpdateStatus) => void) => () => void
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
