import { createContext, useContext } from 'react'
import type { PhotoRecord } from '@shared/ipc'

interface PhotosContextValue {
  photos: PhotoRecord[]
  setPhotos: (photos: PhotoRecord[]) => void
}

export const PhotosContext = createContext<PhotosContextValue>({
  photos: [],
  setPhotos: () => {}
})

export function usePhotos(): PhotosContextValue {
  return useContext(PhotosContext)
}
