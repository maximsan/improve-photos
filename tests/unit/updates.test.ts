import { describe, expect, it, vi } from 'vitest'

vi.mock('electron-updater', () => ({
  autoUpdater: {
    autoDownload: true,
    on: vi.fn(),
    checkForUpdates: vi.fn(),
    downloadUpdate: vi.fn(),
    quitAndInstall: vi.fn()
  }
}))

import { autoUpdater } from 'electron-updater'
import { checkForUpdates, downloadUpdate, getUpdateStatus } from '../../src/main/updates'
import { RELEASE_FEATURE_FLAG_ENV } from '../../src/main/releaseFeatureFlags'

const AUTO_UPDATES_ENABLED_ENV = {
  [RELEASE_FEATURE_FLAG_ENV.autoUpdatesEnabled]: 'true'
}

describe('update service', () => {
  it('returns disabled status and makes no update request while the gate is off', async () => {
    await expect(checkForUpdates({ env: {} })).resolves.toMatchObject({ state: 'disabled' })
    await expect(downloadUpdate({ env: {} })).resolves.toMatchObject({ state: 'disabled' })

    expect(autoUpdater.checkForUpdates).not.toHaveBeenCalled()
    expect(autoUpdater.downloadUpdate).not.toHaveBeenCalled()
  })

  it('checks for updates when the gate is enabled', async () => {
    vi.mocked(autoUpdater.checkForUpdates).mockResolvedValueOnce(null)

    await checkForUpdates({ env: AUTO_UPDATES_ENABLED_ENV })

    expect(autoUpdater.autoDownload).toBe(false)
    expect(autoUpdater.checkForUpdates).toHaveBeenCalledTimes(1)
    expect(getUpdateStatus({ env: AUTO_UPDATES_ENABLED_ENV }).state).toBe('checking')
  })
})
