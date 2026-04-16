import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readdir, stat } from 'fs/promises'
import { join, extname, basename } from 'path'
import sharp from 'sharp'
import exifr from 'exifr'
import type { PhotoRecord } from '@shared/ipc'
import { IPC } from '@shared/ipc'

export const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.heic',
  '.heif',
  '.png',
  '.webp',
  '.tiff',
  '.tif'
])

/** In-memory cache — populated by the last successful scan. */
let photoCache: PhotoRecord[] = []

export function getCachedPhotos(): PhotoRecord[] {
  return photoCache
}

/**
 * Recursively walks `dir` and returns absolute paths of all image files.
 * Hidden directories (names starting with `.`) are skipped.
 */
export async function walkDir(dir: string): Promise<string[]> {
  const results: string[] = []
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      const nested = await walkDir(fullPath)
      results.push(...nested)
    } else if (IMAGE_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      results.push(fullPath)
    }
  }

  return results
}

/**
 * Reads file stats, image dimensions via `sharp`, and EXIF metadata via `exifr`
 * for a single file. Returns `null` if the file cannot be processed.
 */
export async function buildPhotoRecord(filePath: string): Promise<PhotoRecord | null> {
  try {
    const [fileStat, metadata, exif] = await Promise.all([
      stat(filePath),
      sharp(filePath).metadata(),
      exifr
        .parse(filePath, { pick: ['DateTimeOriginal', 'Make', 'Model'] })
        .catch(() => null) as Promise<{
        DateTimeOriginal?: Date
        Make?: string
        Model?: string
      } | null>
    ])

    const make = exif?.Make ?? null
    const model = exif?.Model ?? null
    const camera = make && model ? `${make} ${model}` : (model ?? make ?? null)
    const dateTaken =
      exif?.DateTimeOriginal instanceof Date ? exif.DateTimeOriginal.toISOString() : null

    return {
      path: filePath,
      name: basename(filePath),
      size: fileStat.size,
      dateTaken,
      width: metadata.width ?? null,
      height: metadata.height ?? null,
      camera
    }
  } catch {
    return null
  }
}

export function registerScannerHandlers(): void {
  ipcMain.handle(IPC.PICK_FOLDER, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const { canceled, filePaths } = await dialog.showOpenDialog(win!, {
      properties: ['openDirectory']
    })
    return canceled ? null : filePaths[0]
  })

  ipcMain.handle(IPC.SCAN, async (_event, folderPath: string): Promise<PhotoRecord[]> => {
    const paths = await walkDir(folderPath)
    const records = await Promise.all(paths.map(buildPhotoRecord))
    photoCache = records.filter((r): r is PhotoRecord => r !== null)
    return photoCache
  })
}
