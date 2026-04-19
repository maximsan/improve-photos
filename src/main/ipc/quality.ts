import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { is } from '@electron-toolkit/utils'
import sharp from 'sharp'
import type { BlurScores } from '@shared/ipc'
import { IPC } from '@shared/ipc'

const MAX_CONCURRENT = 4

const LAPLACIAN_2D = {
  width: 3,
  height: 3,
  // Standard 2D Laplacian kernel — detects edges in all directions
  kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0],
  scale: 1,
  // Offset so the neutral (zero-Laplacian) value is 128 in the output buffer
  offset: 128
}

/**
 * Computes a sharpness score for a single image.
 *
 * Uses the standard deviation of the 2D Laplacian response at 1024×1024.
 * Sharp images have high edge energy → high stdev; blurry images have low
 * edge energy → low stdev.
 *
 * Returns a non-negative number — lower means blurrier.
 */
export async function computeBlurScore(filePath: string): Promise<number> {
  const stats = await sharp(filePath)
    .greyscale()
    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
    .convolve(LAPLACIAN_2D)
    .stats()

  return stats.channels[0].stdev
}

export function registerQualityHandlers(): void {
  ipcMain.handle(
    IPC.GET_BLUR_SCORES,
    async (event: IpcMainInvokeEvent, paths: string[]): Promise<BlurScores> => {
      const scores: BlurScores = {}
      let done = 0
      const total = paths.length

      const iter = paths[Symbol.iterator]()

      async function worker(): Promise<void> {
        for (const p of { [Symbol.iterator]: () => iter }) {
          try {
            scores[p] = await computeBlurScore(p)
          } catch (e) {
            if (is.dev) {
              console.warn('[quality] failed to score file:', p, e)
            }
          }
          done++
          event.sender.send(IPC.QUALITY_PROGRESS, { done, total, current: p })
        }
      }

      await Promise.all(Array.from({ length: MAX_CONCURRENT }, worker))

      if (is.dev) {
        const scored = Object.keys(scores).length
        const failed = total - scored
        console.log(`[quality] ${scored} photos scored${failed > 0 ? `, ${failed} failed` : ''}`)
      }

      return scores
    }
  )
}
