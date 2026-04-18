import { net, protocol } from 'electron'
import { is } from '@electron-toolkit/utils'
import { pathToFileURL } from 'url'

const allowedRoots = new Set<string>()

/** Call this when the user scans/selects a folder so the protocol may serve files from it. */
export function allowDirectory(dir: string): void {
  allowedRoots.add(dir)
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
  protocol.handle('app', (request) => {
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

    return net.fetch(pathToFileURL(filePath).toString())
  })
}
