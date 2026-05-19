import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { randomBytes } from 'node:crypto'
import { readFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join as pathJoin } from 'node:path'
import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { is } from '@electron-toolkit/utils'
import sharp from 'sharp'
import type { BlurScores } from '@shared/ipc'
import { IPC } from '@shared/ipc'

/** Disable libvips file cache: avoids HEIC/seek noise under parallel reads (sharp#4506). */
if (typeof sharp.cache === 'function') {
  sharp.cache(false)
}

const MAX_CONCURRENT = 4
const HEIC_RE = /\.(heic|heif)$/i
const execFileAsync = promisify(execFile)

/**
 * Prebuilt `sharp` ships libvips without HEVC-in-HEIF decode (licensing; see
 * https://sharp.pixelplumbing.com/api-output#heif). iPhone photos are almost
 * always HEVC. On macOS, `sips` uses the system ImageIO decoder instead.
 * Set `CLEANUP_PHOTOS_NO_SIPS_HEIC=1` to force `sharp` (e.g. unit tests on Darwin).
 */
function heicPathUsesSips(): boolean {
  if (process.platform !== 'darwin' || process.env['CLEANUP_PHOTOS_NO_SIPS_HEIC'] === '1') {
    return false
  }
  return true
}

/**
 * Decode HEIC/HEIF to an in-memory JPEG via macOS `sips`, then delete the temp file
 * before Sharp runs. Passing a path into Sharp left a race: libvips can read the file
 * lazily and another worker may have already unlinked a *different* temp, or tmp
 * cleanup can interleave — leading to "Input file is missing" for the decoded path.
 */
async function heicToJpegBufferViaSips(inPath: string): Promise<Buffer> {
  const outPath = pathJoin(tmpdir(), `cleanup-qc-${randomBytes(8).toString('hex')}.jpg`)
  await execFileAsync('sips', ['-s', 'format', 'jpeg', inPath, '--out', outPath], {
    maxBuffer: 10 * 1024 * 1024
  })
  try {
    return await readFile(outPath)
  } finally {
    await unlink(outPath).catch(() => {
      /* best-effort */
    })
  }
}

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
  if (HEIC_RE.test(filePath) && heicPathUsesSips()) {
    const jpegBuf = await heicToJpegBufferViaSips(filePath)
    return await runBlurScorePipeline(jpegBuf)
  }
  return await runBlurScorePipeline(filePath)
}

async function runBlurScorePipeline(input: string | Buffer): Promise<number> {
  const { data, info } = await sharp(input, { failOn: 'error' })
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
