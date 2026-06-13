import { ipcMain } from 'electron'
import { rename } from 'fs/promises'
import { join, dirname, basename } from 'path'
import { access } from 'fs/promises'
import type { ExecuteOrganizeResult, MoveOperation, PhotoRecord } from '@shared/ipc'
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
    async (_event, photos: PhotoRecord[], scanRoot: string): Promise<MoveOperation[]> => {
      if (!scanRoot) {
        throw new Error('Scan root is required to preview organize changes')
      }

      const ops = await Promise.all(
        photos.map(async (photo): Promise<MoveOperation> => {
          const targetPath = deriveTargetPath(photo, scanRoot)
          const conflict = targetPath !== photo.path && (await fileExists(targetPath))
          return { photo, targetPath, conflict }
        })
      )

      // Only return photos that would actually move
      return ops.filter((op) => op.targetPath !== op.photo.path)
    }
  )

  ipcMain.handle(
    IPC.EXECUTE_ORGANIZE,
    async (_event, ops: MoveOperation[]): Promise<ExecuteOrganizeResult> => {
      const { mkdir } = await import('fs/promises')
      const pending = ops.filter((op) => !op.conflict)
      const movedPaths = new Map<string, string>()
      const errors: string[] = []

      // Process sequentially so each successful file can be reflected in the cache.
      for (const op of pending) {
        try {
          await mkdir(dirname(op.targetPath), { recursive: true })
          await rename(op.photo.path, op.targetPath)
          movedPaths.set(op.photo.path, op.targetPath)
        } catch (err) {
          errors.push(`${op.photo.path}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }

      // Refresh the in-memory cache for every file that succeeded
      const cached = getCachedPhotos()
      for (const record of cached) {
        const newPath = movedPaths.get(record.path)
        if (newPath) {
          record.path = newPath
          record.name = basename(newPath)
        }
      }

      const movedPairs = Array.from(movedPaths.entries()).map(([from, to]) => ({ from, to }))

      return {
        movedPairs,
        errors,
        requestedCount: pending.length,
        movedCount: movedPairs.length
      }
    }
  )

  ipcMain.handle(
    IPC.UNDO_ORGANIZE,
    async (_event, pairs: { from: string; to: string }[]): Promise<void> => {
      const errors: string[] = []
      const reversedPaths = new Map<string, string>()

      for (const { from, to } of pairs) {
        try {
          await rename(to, from)
          reversedPaths.set(to, from)
        } catch (err) {
          errors.push(`${to}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }

      const cached = getCachedPhotos()
      for (const record of cached) {
        const originalPath = reversedPaths.get(record.path)
        if (originalPath) {
          record.path = originalPath
          record.name = basename(originalPath)
        }
      }

      if (errors.length > 0) {
        throw new Error(
          `${errors.length} of ${pairs.length} file(s) could not be reverted:\n${errors.join('\n')}`
        )
      }
    }
  )
}
