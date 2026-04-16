import { ipcMain } from 'electron'
import { rename } from 'fs/promises'
import { join, dirname, basename } from 'path'
import { access } from 'fs/promises'
import type { MoveOperation, PhotoRecord } from '@shared/ipc'
import { IPC } from '@shared/ipc'
import { getCachedPhotos } from './scanner'

/**
 * Derives the destination path for a photo using its EXIF date.
 * Falls back to "undated" when no date is available.
 *
 * Layout: <rootDir>/YYYY/MM/DD/<filename>
 */
export function deriveTargetPath(photo: PhotoRecord, rootDir: string): string {
  if (photo.dateTaken) {
    const d = new Date(photo.dateTaken)
    const year = d.getUTCFullYear().toString()
    const month = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    return join(rootDir, year, month, day, basename(photo.path))
  }
  return join(rootDir, 'undated', basename(photo.path))
}

/** Returns true when `filePath` already exists on disk. */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

export function registerOrganizerHandlers(): void {
  ipcMain.handle(
    IPC.PREVIEW_ORGANIZE,
    async (_event, photos: PhotoRecord[]): Promise<MoveOperation[]> => {
      // Determine the common root directory from the first photo's current path.
      // All photos from a single scan share the same root.
      const rootDir = dirname(dirname(photos[0].path))

      const ops = await Promise.all(
        photos.map(async (photo): Promise<MoveOperation> => {
          const targetPath = deriveTargetPath(photo, rootDir)
          const conflict = targetPath !== photo.path && (await fileExists(targetPath))
          return { photo, targetPath, conflict }
        })
      )

      // Only return photos that would actually move
      return ops.filter((op) => op.targetPath !== op.photo.path)
    }
  )

  ipcMain.handle(IPC.EXECUTE_ORGANIZE, async (_event, ops: MoveOperation[]): Promise<void> => {
    const { mkdir } = await import('fs/promises')
    await Promise.all(
      ops
        .filter((op) => !op.conflict)
        .map(async (op) => {
          await mkdir(dirname(op.targetPath), { recursive: true })
          await rename(op.photo.path, op.targetPath)
        })
    )

    // Refresh the in-memory cache with updated paths
    const cached = getCachedPhotos()
    const movedPaths = new Map(ops.map((op) => [op.photo.path, op.targetPath]))
    for (const record of cached) {
      const newPath = movedPaths.get(record.path)
      if (newPath) {
        record.path = newPath
        record.name = basename(newPath)
      }
    }
  })
}
