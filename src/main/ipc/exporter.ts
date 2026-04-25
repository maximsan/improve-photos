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

/** Set by CANCEL_EXPORT to interrupt the active EXPORT_BATCH call. */
let activeExportController: { cancelled: boolean } | null = null

export function registerExporterHandlers(): void {
  ipcMain.handle(IPC.CANCEL_EXPORT, () => {
    if (activeExportController) {
      activeExportController.cancelled = true
    }
  })
  ipcMain.handle(
    IPC.EXPORT_BATCH,
    async (
      event,
      photos: PhotoRecord[],
      presets: ExportPreset[],
      outDir: string
    ): Promise<void> => {
      const controller = { cancelled: false }
      activeExportController = controller

      const total = photos.length * presets.length
      let done = 0

      // Create one subdirectory per preset name up front
      await Promise.all(presets.map((p) => mkdir(join(outDir, p.name), { recursive: true })))

      const errors: string[] = []

      for (const photo of photos) {
        if (controller.cancelled) {
          break
        }

        for (const preset of presets) {
          const outputPath = buildOutputPath(photo, preset, outDir)

          try {
            await processExport(photo, preset, outputPath)
          } catch (err) {
            errors.push(
              `${photo.name} (${preset.name}): ${err instanceof Error ? err.message : String(err)}`
            )
          }

          done++

          const progress: ExportProgress = { done, total, currentPath: outputPath }

          if (!event.sender.isDestroyed()) {
            event.sender.send(IPC.EXPORT_PROGRESS, progress)
          }
        }
      }

      activeExportController = null

      if (errors.length > 0) {
        throw new Error(`${errors.length} of ${total} export(s) failed:\n${errors.join('\n')}`)
      }
    }
  )
}
