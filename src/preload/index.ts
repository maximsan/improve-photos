import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  ElectronAPI,
  ExportProgress,
  PhotoRecord,
  MoveOperation,
  ExportPreset
} from '@shared/ipc'
import { IPC } from '@shared/ipc'

/**
 * The preload script runs in a special context that has access to both the
 * browser DOM and Node.js / Electron APIs. It acts as a secure bridge between
 * the renderer (React UI) and the main process (file system, image processing).
 *
 * contextBridge.exposeInMainWorld ensures the renderer can only call the
 * functions we explicitly allow — it cannot access any raw Node.js APIs.
 */
const api: ElectronAPI = {
  pickFolder: () => ipcRenderer.invoke(IPC.PICK_FOLDER),

  scan: (folderPath: string) => ipcRenderer.invoke(IPC.SCAN, folderPath),

  computeHashes: (paths: string[]) => ipcRenderer.invoke(IPC.COMPUTE_HASHES, paths),

  getDuplicateGroups: (hashes: Record<string, string>) =>
    ipcRenderer.invoke(IPC.GET_DUPLICATE_GROUPS, hashes),

  getBlurScores: (paths: string[]) => ipcRenderer.invoke(IPC.GET_BLUR_SCORES, paths),

  previewOrganize: (photos: PhotoRecord[]) => ipcRenderer.invoke(IPC.PREVIEW_ORGANIZE, photos),

  executeOrganize: (ops: MoveOperation[]) => ipcRenderer.invoke(IPC.EXECUTE_ORGANIZE, ops),

  trashFiles: (paths: string[]) => ipcRenderer.invoke(IPC.TRASH_FILES, paths),

  exportBatch: (photos: PhotoRecord[], presets: ExportPreset[], outDir: string) =>
    ipcRenderer.invoke(IPC.EXPORT_BATCH, photos, presets, outDir),

  /**
   * Subscribe to export progress events pushed from the main process.
   * Returns an unsubscribe function — call it when the component unmounts.
   */
  onExportProgress: (cb: (progress: ExportProgress) => void) => {
    const handler = (_event: IpcRendererEvent, progress: ExportProgress): void => cb(progress)
    ipcRenderer.on(IPC.EXPORT_PROGRESS, handler)
    return () => ipcRenderer.removeListener(IPC.EXPORT_PROGRESS, handler)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore -- window.electron is not typed when context isolation is disabled
  window.electron = electronAPI
  // @ts-ignore -- window.api is not typed when context isolation is disabled
  window.api = api
}
