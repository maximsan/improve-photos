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

import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc'
import { registerScannerHandlers } from '../../src/main/ipc/scanner'
import { registerDedupHandlers } from '../../src/main/ipc/dedup'
import { registerOrganizerHandlers } from '../../src/main/ipc/organizer'
import { registerQualityHandlers } from '../../src/main/ipc/quality'
import { registerExporterHandlers } from '../../src/main/ipc/exporter'

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
  IPC.CONFIRM_TRASH
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
  })

  it.each(INVOKE_CHANNELS)('channel "%s" has a handler registered in main', (channel) => {
    expect(registered.has(channel), `Missing ipcMain.handle for "${channel}"`).toBe(true)
  })
})
