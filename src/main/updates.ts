import { BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { UpdateStatus } from '@shared/ipc'
import { IPC } from '@shared/ipc'
import type { ReleaseFeatureFlagEnvironment } from './releaseFeatureFlags'
import { getReleaseFeatureFlags } from './releaseFeatureFlags'

interface UpdateOptions {
  env?: ReleaseFeatureFlagEnvironment
}

let currentStatus: UpdateStatus = {
  state: 'idle',
  version: null,
  percent: null,
  message: null
}
let configured = false

function autoUpdatesEnabled(options: UpdateOptions = {}): boolean {
  return getReleaseFeatureFlags(options.env).autoUpdatesEnabled
}

function disabledStatus(): UpdateStatus {
  return {
    state: 'disabled',
    version: null,
    percent: null,
    message: 'Auto-updates are paused until final v1 approval.'
  }
}

function setStatus(status: UpdateStatus): UpdateStatus {
  currentStatus = status
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(IPC.UPDATE_STATUS, status)
  }
  return status
}

export function configureAutoUpdates(): void {
  if (configured) {
    return
  }
  configured = true

  autoUpdater.autoDownload = false
  autoUpdater.on('checking-for-update', () => {
    setStatus({ state: 'checking', version: null, percent: null, message: null })
  })
  autoUpdater.on('update-available', (info) => {
    setStatus({
      state: 'available',
      version: info.version,
      percent: null,
      message: 'An update is available.'
    })
  })
  autoUpdater.on('update-not-available', (info) => {
    setStatus({
      state: 'not-available',
      version: info.version,
      percent: null,
      message: 'This app is up to date.'
    })
  })
  autoUpdater.on('download-progress', (progress) => {
    setStatus({
      state: 'downloading',
      version: currentStatus.version,
      percent: Math.round(progress.percent),
      message: 'Downloading update.'
    })
  })
  autoUpdater.on('update-downloaded', (info) => {
    setStatus({
      state: 'ready',
      version: info.version,
      percent: 100,
      message: 'Update ready to install.'
    })
  })
  autoUpdater.on('error', (error) => {
    setStatus({
      state: 'error',
      version: currentStatus.version,
      percent: null,
      message: error.message
    })
  })
}

export function getUpdateStatus(options: UpdateOptions = {}): UpdateStatus {
  if (!autoUpdatesEnabled(options)) {
    return disabledStatus()
  }
  return currentStatus
}

export async function checkForUpdates(options: UpdateOptions = {}): Promise<UpdateStatus> {
  if (!autoUpdatesEnabled(options)) {
    return disabledStatus()
  }

  configureAutoUpdates()
  setStatus({ state: 'checking', version: null, percent: null, message: null })
  await autoUpdater.checkForUpdates()
  return currentStatus
}

export async function downloadUpdate(options: UpdateOptions = {}): Promise<UpdateStatus> {
  if (!autoUpdatesEnabled(options)) {
    return disabledStatus()
  }

  configureAutoUpdates()
  setStatus({
    state: 'downloading',
    version: currentStatus.version,
    percent: 0,
    message: 'Downloading update.'
  })
  await autoUpdater.downloadUpdate()
  return currentStatus
}

export function installUpdate(options: UpdateOptions = {}): void {
  if (!autoUpdatesEnabled(options)) {
    return
  }

  autoUpdater.quitAndInstall(false, true)
}
