import { ipcMain, shell } from 'electron'
import type { PhotoHashes, DuplicateGroup } from '@shared/ipc'
import { IPC } from '@shared/ipc'
import { computePHash, hammingDistance } from '../lib/hash'
import { getCachedPhotos } from './scanner'

/** Bit distance at or below which two photos are considered near-duplicates. */
const DUPLICATE_THRESHOLD = 10

export function registerDedupHandlers(): void {
  ipcMain.handle(IPC.COMPUTE_HASHES, async (_event, paths: string[]): Promise<PhotoHashes> => {
    const hashes: PhotoHashes = {}
    await Promise.all(
      paths.map(async (p) => {
        try {
          hashes[p] = await computePHash(p)
        } catch {
          // skip files that cannot be hashed (corrupt, unsupported format)
        }
      })
    )
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
        if (!parent.has(x)) parent.set(x, x)
        const root = parent.get(x)!
        if (root === x) return x
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
        if (!buckets.has(root)) buckets.set(root, [])
        buckets.get(root)!.push(p)
      }

      return [...buckets.values()]
        .filter((g) => g.length >= 2)
        .map((g) => {
          const groupPhotos = g.map((p) => photoMap.get(p)!).sort((a, b) => b.size - a.size) // largest (highest quality) first
          return { hash: hashes[groupPhotos[0].path], photos: groupPhotos }
        })
    }
  )

  ipcMain.handle(IPC.TRASH_FILES, async (_event, paths: string[]): Promise<void> => {
    await Promise.all(paths.map((p) => shell.trashItem(p)))
  })
}
