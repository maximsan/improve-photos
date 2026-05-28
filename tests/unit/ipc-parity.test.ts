import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('sharp', () => ({ default: vi.fn() }))
vi.mock('exifr', () => ({ default: { parse: vi.fn() } }))
vi.mock('fs/promises', () => ({
  readdir: vi.fn(),
  stat: vi.fn(),
  rename: vi.fn(),
  access: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn()
}))
vi.mock('electron-updater', () => ({
  autoUpdater: {
    autoDownload: false,
    on: vi.fn(),
    checkForUpdates: vi.fn(),
    downloadUpdate: vi.fn(),
    quitAndInstall: vi.fn()
  }
}))

import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc'
import { registerScannerHandlers } from '../../src/main/ipc/scanner'
import { registerDedupHandlers } from '../../src/main/ipc/dedup'
import { registerOrganizerHandlers } from '../../src/main/ipc/organizer'
import { registerQualityHandlers } from '../../src/main/ipc/quality'
import { registerExporterHandlers } from '../../src/main/ipc/exporter'
import { registerReleaseFeatureFlagHandlers } from '../../src/main/ipc/releaseFeatureFlags'
import { registerLicenseHandlers } from '../../src/main/ipc/license'
import { registerEntitlementHandlers } from '../../src/main/ipc/entitlement'
import { registerUpdateHandlers } from '../../src/main/ipc/updates'

/** Every channel the preload calls via ipcRenderer.invoke must have a handler. */
const INVOKE_CHANNELS = [
  IPC.PICK_FOLDER,
  IPC.SCAN,
  IPC.COMPUTE_HASHES,
  IPC.GET_DUPLICATE_GROUPS,
  IPC.GET_BLUR_SCORES,
  IPC.PREVIEW_ORGANIZE,
  IPC.EXECUTE_ORGANIZE,
  IPC.TRASH_FILES,
  IPC.EXPORT_BATCH,
  IPC.CANCEL_HASHES,
  IPC.CANCEL_SCAN,
  IPC.CANCEL_EXPORT,
  IPC.CANCEL_QUALITY,
  IPC.UNDO_ORGANIZE,
  IPC.CONFIRM_TRASH,
  IPC.GET_RELEASE_FEATURE_FLAGS,
  IPC.GET_LICENSE_STATUS,
  IPC.ACTIVATE_LICENSE,
  IPC.DEACTIVATE_LICENSE,
  IPC.GET_ENTITLEMENT_STATUS,
  IPC.CAN_PROCESS_PHOTO_COUNT,
  IPC.GET_UPDATE_STATUS,
  IPC.CHECK_FOR_UPDATES,
  IPC.DOWNLOAD_UPDATE,
  IPC.INSTALL_UPDATE
] as const

describe('IPC parity: preload ↔ main', () => {
  let registered: Set<string>

  beforeEach(() => {
    registered = new Set()
    vi.spyOn(ipcMain, 'handle').mockImplementation((channel) => {
      registered.add(channel)
    })

    registerScannerHandlers()
    registerDedupHandlers()
    registerOrganizerHandlers()
    registerQualityHandlers()
    registerExporterHandlers()
    registerReleaseFeatureFlagHandlers()
    registerLicenseHandlers()
    registerEntitlementHandlers()
    registerUpdateHandlers()
  })

  it.each(INVOKE_CHANNELS)('channel "%s" has a handler registered in main', (channel) => {
    expect(registered.has(channel), `Missing ipcMain.handle for "${channel}"`).toBe(true)
  })
})
