import { basename } from 'path'
import type { PhotoRecord } from '@shared/ipc'

interface PhotoPathMove {
  from: string
  to: string
}

let currentPhotoSet: PhotoRecord[] = []

function copyPhoto(photo: PhotoRecord): PhotoRecord {
  return { ...photo }
}

function copyPhotos(photos: PhotoRecord[]): PhotoRecord[] {
  return photos.map(copyPhoto)
}

export function getCurrentPhotoSet(): PhotoRecord[] {
  return copyPhotos(currentPhotoSet)
}

export function replaceCurrentPhotoSet(photos: PhotoRecord[]): PhotoRecord[] {
  currentPhotoSet = copyPhotos(photos)
  return getCurrentPhotoSet()
}

export function removeCurrentPhotoSetPaths(paths: string[]): PhotoRecord[] {
  const removedPaths = new Set(paths)
  currentPhotoSet = currentPhotoSet.filter((photo) => !removedPaths.has(photo.path))
  return getCurrentPhotoSet()
}

export function applyCurrentPhotoSetMoves(moves: PhotoPathMove[]): PhotoRecord[] {
  const moveBySource = new Map(moves.map(({ from, to }) => [from, to]))
  currentPhotoSet = currentPhotoSet.map((photo) => {
    const nextPath = moveBySource.get(photo.path)
    return nextPath ? { ...photo, path: nextPath, name: basename(nextPath) } : photo
  })
  return getCurrentPhotoSet()
}
