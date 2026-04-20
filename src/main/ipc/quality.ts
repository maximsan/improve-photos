import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { is } from '@electron-toolkit/utils'
import sharp from 'sharp'
import type { BlurScores } from '@shared/ipc'
import { IPC } from '@shared/ipc'

const MAX_CONCURRENT = 4

/**
 * High-frequency energy measure: stdev(original) − stdev(blur_3px).
 * Sharp images have fine detail that blurring destroys → large difference.
 * Blurry images already lack detail → small difference.
 *
 * Decodes the HEIC once to a raw greyscale buffer, then runs both stats
 * computations on that in-memory buffer — avoids clone() issues and double
 * file reads.
 */
export async function computeBlurScore(filePath: string): Promise<number> {
  const { data, info } = await sharp(filePath, { failOn: 'error' })
    .greyscale()
    .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true })

  const rawInput = { raw: { width: info.width, height: info.height, channels: 1 as const } }

  const [original, blurred] = await Promise.all([
    sharp(data, rawInput).stats(),
    sharp(data, rawInput).blur(3).stats()
  ])

  return original.channels[0].stdev - blurred.channels[0].stdev
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
            const score = await computeBlurScore(p)
            scores[p] = score
            event.sender.send(IPC.QUALITY_SCORE_ITEM, { path: p, score })
          } catch (e) {
            if (is.dev) {
              console.warn('[quality] failed to score file:', p, e)
            }
            event.sender.send(IPC.QUALITY_SCORE_ITEM, { path: p, score: -1 })
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
