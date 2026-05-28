import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc'
import { canProcessPhotoCount, getEntitlementStatus } from '../entitlement'

export function registerEntitlementHandlers(): void {
  ipcMain.handle(IPC.GET_ENTITLEMENT_STATUS, () => getEntitlementStatus())
  ipcMain.handle(IPC.CAN_PROCESS_PHOTO_COUNT, (_event, photoCount: number) =>
    canProcessPhotoCount(photoCount)
  )
}
