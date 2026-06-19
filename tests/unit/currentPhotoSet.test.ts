import { describe, expect, it, beforeEach } from 'vitest'
import type { PhotoRecord } from '../../src/shared/ipc'
import {
  applyCurrentPhotoSetMoves,
  getCurrentPhotoSet,
  removeCurrentPhotoSetPaths,
  replaceCurrentPhotoSet
} from '../../src/main/currentPhotoSet'

function makePhoto(overrides: Partial<PhotoRecord> = {}): PhotoRecord {
  return {
    path: '/photos/a.jpg',
    name: 'a.jpg',
    size: 1000,
    dateTaken: null,
    width: 800,
    height: 600,
    camera: null,
    ...overrides
  }
}

describe('current photo set', () => {
  beforeEach(() => {
    replaceCurrentPhotoSet([])
  })

  it('returns copies when replacing photos', () => {
    const input = [makePhoto()]

    const replaced = replaceCurrentPhotoSet(input)

    expect(replaced).toEqual(input)
    expect(replaced[0]).not.toBe(input[0])
  })

  it('does not let read results mutate stored state', () => {
    replaceCurrentPhotoSet([makePhoto()])

    const readPhotos = getCurrentPhotoSet()
    readPhotos[0].path = '/mutated.jpg'

    expect(getCurrentPhotoSet()[0].path).toBe('/photos/a.jpg')
  })

  it('removes only matching paths', () => {
    replaceCurrentPhotoSet([
      makePhoto({ path: '/photos/a.jpg', name: 'a.jpg' }),
      makePhoto({ path: '/photos/b.jpg', name: 'b.jpg' })
    ])

    const remaining = removeCurrentPhotoSetPaths(['/photos/a.jpg', '/photos/missing.jpg'])

    expect(remaining.map((photo) => photo.path)).toEqual(['/photos/b.jpg'])
  })

  it('updates path and name for moved photos', () => {
    replaceCurrentPhotoSet([makePhoto({ path: '/photos/a.jpg', name: 'a.jpg' })])

    const updated = applyCurrentPhotoSetMoves([
      { from: '/photos/a.jpg', to: '/photos/2024/renamed.jpg' }
    ])

    expect(updated[0]).toMatchObject({ path: '/photos/2024/renamed.jpg', name: 'renamed.jpg' })
  })

  it('leaves unknown move paths unchanged', () => {
    replaceCurrentPhotoSet([makePhoto({ path: '/photos/a.jpg', name: 'a.jpg' })])

    const updated = applyCurrentPhotoSetMoves([
      { from: '/photos/missing.jpg', to: '/photos/2024/missing.jpg' }
    ])

    expect(updated[0]).toMatchObject({ path: '/photos/a.jpg', name: 'a.jpg' })
  })
})
