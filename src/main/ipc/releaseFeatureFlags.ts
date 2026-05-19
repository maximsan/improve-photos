import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc'
import { getReleaseFeatureFlags } from '../releaseFeatureFlags'

export function registerReleaseFeatureFlagHandlers(): void {
  ipcMain.handle(IPC.GET_RELEASE_FEATURE_FLAGS, () => getReleaseFeatureFlags())
}
