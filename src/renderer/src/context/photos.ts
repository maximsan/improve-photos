import { createContext, useContext } from 'react'
import type { PhotoRecord } from '@shared/ipc'

interface PhotosContextValue {
  photos: PhotoRecord[]
  /** Increments each time Scanner completes a scan or resets. Other tabs watch this to detect stale state. */
  scanRevision: number
  setPhotos: (photos: PhotoRecord[]) => void
  bumpScanRevision: () => void
}

export const PhotosContext = createContext<PhotosContextValue>({
  photos: [],
  scanRevision: 0,
  setPhotos: () => {},
  bumpScanRevision: () => {}
})

export function usePhotos(): PhotosContextValue {
  return useContext(PhotosContext)
}
