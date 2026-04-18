import { dialog, ipcMain, shell } from 'electron'
import { is } from '@electron-toolkit/utils'
import type { PhotoHashes, DuplicateGroup, HashProgress } from '@shared/ipc'
import { IPC } from '@shared/ipc'
import { computePHash, hammingDistance } from '../lib/hash'
import { getCachedPhotos } from './scanner'

/** Bit distance at or below which two photos are considered near-duplicates. */
const DUPLICATE_THRESHOLD = 10

/**
 * Maximum number of photos hashed concurrently.
 * Higher values risk OOM on large HEIC folders: each sips conversion briefly
 * allocates memory proportional to the output image size.
 */
const HASH_CONCURRENCY = 4

/** Set by CANCEL_HASHES to interrupt the active COMPUTE_HASHES call. */
let activeController: { cancelled: boolean } | null = null

export function registerDedupHandlers(): void {
  ipcMain.handle(IPC.CANCEL_HASHES, () => {
    if (activeController) {
      activeController.cancelled = true
      console.log('[dedup] hash cancelled by user')
    }
  })

  ipcMain.handle(IPC.COMPUTE_HASHES, async (event, paths: string[]): Promise<PhotoHashes> => {
    const controller = { cancelled: false }
    activeController = controller

    const hashes: PhotoHashes = {}
    let done = 0
    let failed = 0
    const total = paths.length
    const queue = [...paths]

    const worker = async (): Promise<void> => {
      while (queue.length > 0 && !controller.cancelled) {
        const p = queue.shift()!
        try {
          hashes[p] = await computePHash(p)
        } catch (e) {
          failed++
          console.warn('[dedup] failed to hash file:', p, e)
        }
        done++
        event.sender.send(IPC.HASH_PROGRESS, { done, total, current: p } satisfies HashProgress)
      }
    }

    await Promise.all(Array.from({ length: Math.min(HASH_CONCURRENCY, total) }, worker))

    const status = controller.cancelled ? 'cancelled' : 'completed'
    console.log(`[dedup] hashing ${status}: ${done}/${total} processed, ${failed} failed`)

    activeController = null
    return hashes
  })

  ipcMain.handle(
    IPC.GET_DUPLICATE_GROUPS,
    async (_event, hashes: PhotoHashes): Promise<DuplicateGroup[]> => {
      const cached = getCachedPhotos()
      const photoMap = new Map(cached.map((p) => [p.path, p]))
      const paths = Object.keys(hashes).filter((p) => photoMap.has(p))

      // Union-Find with path compression
      const parent = new Map<string, string>()

      const find = (x: string): string => {
        if (!parent.has(x)) {
          parent.set(x, x)
        }
        const root = parent.get(x)!
        if (root === x) {
          return x
        }
        const canonical = find(root)
        parent.set(x, canonical)

        return canonical
      }

      const union = (a: string, b: string): void => {
        parent.set(find(a), find(b))
      }

      // O(n²) pair scan — acceptable for libraries up to ~1 000 photos
      for (let i = 0; i < paths.length; i++) {
        for (let j = i + 1; j < paths.length; j++) {
          if (hammingDistance(hashes[paths[i]], hashes[paths[j]]) <= DUPLICATE_THRESHOLD) {
            union(paths[i], paths[j])
          }
        }
      }

      // Collect into buckets keyed by canonical root
      const buckets = new Map<string, string[]>()
      for (const p of paths) {
        const root = find(p)
        if (!buckets.has(root)) {
          buckets.set(root, [])
        }
        buckets.get(root)!.push(p)
      }

      const groups = [...buckets.values()]
        .filter((g) => g.length >= 2)
        .map((g) => {
          const groupPhotos = g.map((p) => photoMap.get(p)!).sort((a, b) => b.size - a.size) // largest (highest quality) first

          return { hash: hashes[groupPhotos[0].path], photos: groupPhotos }
        })

      if (is.dev) {
        console.log(`[dedup] ${groups.length} duplicate group(s) found from ${paths.length} photos`)
      }

      return groups
    }
  )

  ipcMain.handle(IPC.CONFIRM_TRASH, async (_event, count: number): Promise<boolean> => {
    const label = `Move ${count} photo${count !== 1 ? 's' : ''} to Trash`
    const { response } = await dialog.showMessageBox({
      type: 'warning',
      buttons: ['Cancel', label],
      defaultId: 1,
      cancelId: 0,
      message: `${label}?`,
      detail: 'Files go to macOS Trash and can be restored at any time.'
    })
    return response === 1
  })

  ipcMain.handle(IPC.TRASH_FILES, async (_event, paths: string[]): Promise<void> => {
    await Promise.all(paths.map((p) => shell.trashItem(p)))
  })
}
