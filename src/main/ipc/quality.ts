import { ipcMain } from 'electron'
import sharp from 'sharp'
import type { BlurScores } from '@shared/ipc'
import { IPC } from '@shared/ipc'

/**
 * Computes the Laplacian variance of a greyscale pixel buffer.
 *
 * The discrete Laplacian kernel [-1, 2, -1] is applied in one dimension
 * (horizontal) as a fast approximation. The variance of the resulting
 * response measures the amount of high-frequency (edge) energy — sharp
 * images produce high variance, blurry images produce low variance.
 *
 * Exported for unit testing.
 */
export function laplacianVariance(pixels: Uint8Array | Buffer, width: number): number {
  if (width < 3 || pixels.length < 3) return 0

  const responses: number[] = []
  for (let i = 1; i < pixels.length - 1; i++) {
    // Skip pixels at the left/right edge of each row
    const col = i % width
    if (col === 0 || col === width - 1) continue
    const response = -pixels[i - 1] + 2 * pixels[i] - pixels[i + 1]
    responses.push(response)
  }

  if (responses.length === 0) return 0

  const mean = responses.reduce((a, b) => a + b, 0) / responses.length
  const variance = responses.reduce((sum, v) => sum + (v - mean) ** 2, 0) / responses.length
  return variance
}

/**
 * Computes the blur score for a single image file.
 * Returns a non-negative number — lower means blurrier.
 * Exported for unit testing.
 */
export async function computeBlurScore(filePath: string): Promise<number> {
  const { data, info } = await sharp(filePath)
    .greyscale()
    .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true })

  return laplacianVariance(data, info.width)
}

export function registerQualityHandlers(): void {
  ipcMain.handle(IPC.GET_BLUR_SCORES, async (_event, paths: string[]): Promise<BlurScores> => {
    const scores: BlurScores = {}
    await Promise.all(
      paths.map(async (p) => {
        try {
          scores[p] = await computeBlurScore(p)
        } catch {
          // skip files that cannot be processed
        }
      })
    )
    return scores
  })
}
