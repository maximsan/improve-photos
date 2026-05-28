import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc'
import { checkForUpdates, downloadUpdate, getUpdateStatus, installUpdate } from '../updates'

export function registerUpdateHandlers(): void {
  ipcMain.handle(IPC.GET_UPDATE_STATUS, () => getUpdateStatus())
  ipcMain.handle(IPC.CHECK_FOR_UPDATES, () => checkForUpdates())
  ipcMain.handle(IPC.DOWNLOAD_UPDATE, () => downloadUpdate())
  ipcMain.handle(IPC.INSTALL_UPDATE, () => installUpdate())
}
