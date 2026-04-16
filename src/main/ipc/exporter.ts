import { ipcMain } from 'electron'
import { mkdir } from 'fs/promises'
import { join, basename, extname } from 'path'
import sharp from 'sharp'
import type { ExportPreset, ExportProgress, PhotoRecord } from '@shared/ipc'
import { IPC } from '@shared/ipc'

/** Derives the output file path for a single photo + preset combination. */
export function buildOutputPath(photo: PhotoRecord, preset: ExportPreset, outDir: string): string {
  const ext = preset.format === 'jpeg' ? 'jpg' : preset.format
  const stem = basename(photo.name, extname(photo.name))
  return join(outDir, preset.name, `${stem}.${ext}`)
}

/**
 * Runs the sharp pipeline for a single photo + preset combination.
 * Exported for unit testing.
 */
export async function processExport(
  photo: PhotoRecord,
  preset: ExportPreset,
  outputPath: string
): Promise<void> {
  let pipeline = sharp(photo.path)

  if (preset.width !== undefined || preset.height !== undefined) {
    pipeline = pipeline.resize(preset.width ?? null, preset.height ?? null, {
      fit: 'inside',
      withoutEnlargement: true
    })
  }

  switch (preset.format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: preset.quality })
      break
    case 'webp':
      pipeline = pipeline.webp({ quality: preset.quality })
      break
    case 'png':
      pipeline = pipeline.png({
        compressionLevel: Math.round(((100 - preset.quality) / 100) * 9)
      })
      break
  }

  await pipeline.toFile(outputPath)
}

export function registerExporterHandlers(): void {
  ipcMain.handle(
    IPC.EXPORT_BATCH,
    async (
      event,
      photos: PhotoRecord[],
      presets: ExportPreset[],
      outDir: string
    ): Promise<void> => {
      const total = photos.length * presets.length
      let done = 0

      // Create one subdirectory per preset name up front
      await Promise.all(presets.map((p) => mkdir(join(outDir, p.name), { recursive: true })))

      for (const photo of photos) {
        for (const preset of presets) {
          const outputPath = buildOutputPath(photo, preset, outDir)
          await processExport(photo, preset, outputPath)
          done++
          const progress: ExportProgress = { done, total, currentPath: outputPath }
          if (!event.sender.isDestroyed()) {
            event.sender.send(IPC.EXPORT_PROGRESS, progress)
          }
        }
      }
    }
  )
}
