import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { net, protocol } from 'electron'
import { is } from '@electron-toolkit/utils'
import { pathToFileURL } from 'url'

const execFileAsync = promisify(execFile)

const allowedRoots = new Set<string>()

/** HEIC/HEIF files cannot be rendered by Chromium — serve as JPEG instead. */
const HEIC_EXTENSIONS = new Set(['.heic', '.heif'])

/**
 * In-memory cache of HEIC→JPEG conversions keyed by original file path.
 * Avoids re-spawning sips on every render of the same thumbnail.
 * Cleared when the user scans a new folder via {@link clearPreviewCache}.
 */
const previewCache = new Map<string, Buffer>()

/** Clear the preview cache when a new folder is scanned. */
export function clearPreviewCache(): void {
  previewCache.clear()
}

/** Call this when the user scans/selects a folder so the protocol may serve files from it. */
export function allowDirectory(dir: string): void {
  allowedRoots.add(dir)
}

/**
 * Converts a HEIC/HEIF file to JPEG using the macOS `sips` CLI and returns
 * the result as a `Response` with `Content-Type: image/jpeg`.
 *
 * sips flags:
 *   -Z 1200         Resample so the longest edge fits within 1200 px,
 *                   preserving aspect ratio. Enough for retina thumbnails
 *                   without loading full-resolution originals into the renderer.
 *   -s format jpeg  Set the output encoding to JPEG.
 *   --out <path>    Write to a new file instead of modifying the source.
 */
async function serveHeicAsJpeg(filePath: string): Promise<Response> {
  const cached = previewCache.get(filePath)
  if (cached) {
    return new Response(new Uint8Array(cached), { headers: { 'Content-Type': 'image/jpeg' } })
  }

  const tmpPath = path.join(
    os.tmpdir(),
    `cleanup-photos-preview-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
  )

  try {
    await execFileAsync('sips', ['-Z', '1200', '-s', 'format', 'jpeg', filePath, '--out', tmpPath])
    const buffer = await fs.readFile(tmpPath)
    previewCache.set(filePath, buffer)
    return new Response(new Uint8Array(buffer), { headers: { 'Content-Type': 'image/jpeg' } })
  } catch (err) {
    console.warn('[localProtocol] failed to convert HEIC for preview:', filePath, err)
    return new Response(null, { status: 500 })
  } finally {
    await fs.unlink(tmpPath).catch(() => {})
  }
}

/**
 * Registers the `app://images/` protocol handler that maps
 * `app://images/absolute/path.jpg` → the corresponding local file.
 *
 * Security:
 * - Rejects requests outside `images` host
 * - Rejects paths containing `..` (directory traversal)
 * - Only serves files under directories registered via {@link allowDirectory}
 *
 * Must be called inside `app.whenReady()`.
 */
export function registerAppProtocol(): void {
  protocol.handle('app', async (request) => {
    const url = new URL(request.url)

    if (url.host !== 'images') {
      if (is.dev) {
        console.warn('[localProtocol] 400 unexpected host:', url.host)
      }
      return new Response(null, { status: 400 })
    }

    const filePath = decodeURIComponent(url.pathname)

    if (filePath.includes('..')) {
      if (is.dev) {
        console.warn('[localProtocol] 403 directory traversal attempt:', filePath)
      }
      return new Response(null, { status: 403 })
    }

    const isAllowed = [...allowedRoots].some((root) => filePath.startsWith(root + '/'))
    if (!isAllowed) {
      if (is.dev) {
        console.warn('[localProtocol] 403 path outside allowed roots:', filePath)
      }
      return new Response(null, { status: 403 })
    }

    const ext = path.extname(filePath).toLowerCase()
    if (HEIC_EXTENSIONS.has(ext)) {
      return serveHeicAsJpeg(filePath)
    }

    return net.fetch(pathToFileURL(filePath).toString())
  })
}
