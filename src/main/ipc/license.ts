import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc'
import { activateLicense, deactivateLicense, getLicenseStatus } from '../license'

export function registerLicenseHandlers(): void {
  ipcMain.handle(IPC.GET_LICENSE_STATUS, () => getLicenseStatus())
  ipcMain.handle(IPC.ACTIVATE_LICENSE, (_event, licenseKey: string) => activateLicense(licenseKey))
  ipcMain.handle(IPC.DEACTIVATE_LICENSE, () => deactivateLicense())
}
