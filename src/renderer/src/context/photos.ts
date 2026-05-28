import { createContext, useContext } from 'react'
import type { PhotoRecord } from '@shared/ipc'

interface PhotosContextValue {
  photos: PhotoRecord[]
  scanRoot: string | null
  /** Increments each time Scanner completes a scan or resets. Other tabs watch this to detect stale state. */
  scanRevision: number
  setPhotos: (photos: PhotoRecord[]) => void
  setScanRoot: (scanRoot: string | null) => void
  removePhotosByPath: (paths: string[]) => void
  bumpScanRevision: () => void
}

export const PhotosContext = createContext<PhotosContextValue>({
  photos: [],
  scanRoot: null,
  scanRevision: 0,
  setPhotos: () => {},
  setScanRoot: () => {},
  removePhotosByPath: () => {},
  bumpScanRevision: () => {}
})

export function usePhotos(): PhotosContextValue {
  return useContext(PhotosContext)
}
