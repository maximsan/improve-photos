import { describe, it, expect } from 'vitest'
import { buildTree, shortPath } from '../../src/renderer/src/features/Organizer/utils/tree'
import type { MoveOperation, PhotoRecord } from '@shared/ipc'

function op(targetPath: string): MoveOperation {
  const srcPath = '/src' + targetPath
  const photo: PhotoRecord = {
    path: srcPath,
    name: srcPath.split('/').pop()!,
    size: 0,
    dateTaken: null,
    width: null,
    height: null,
    camera: null
  }
  return { photo, targetPath, conflict: false }
}

describe('buildTree', () => {
  it('returns an empty root for no ops', () => {
    const root = buildTree([])
    expect(root.children.size).toBe(0)
    expect(root.ops).toHaveLength(0)
  })

  it('attaches a file at the top level to the root node', () => {
    const root = buildTree([op('/photo.jpg')])
    expect(root.ops).toHaveLength(1)
    expect(root.children.size).toBe(0)
  })

  it('builds a nested tree from a single op', () => {
    const root = buildTree([op('/2024/06/15/photo.jpg')])
    const year = root.children.get('2024')!
    expect(year).toBeDefined()
    const month = year.children.get('06')!
    expect(month).toBeDefined()
    const day = month.children.get('15')!
    expect(day).toBeDefined()
    expect(day.ops).toHaveLength(1)
  })

  it('groups multiple ops under the same directory node', () => {
    const root = buildTree([op('/2024/06/15/a.jpg'), op('/2024/06/15/b.jpg')])
    const day = root.children.get('2024')!.children.get('06')!.children.get('15')!
    expect(day.ops).toHaveLength(2)
  })

  it('keeps sibling directories separate', () => {
    const root = buildTree([op('/2024/01/01/a.jpg'), op('/2024/02/01/b.jpg')])
    const year = root.children.get('2024')!
    expect(year.children.has('01')).toBe(true)
    expect(year.children.has('02')).toBe(true)
  })

  it('sets the correct node name for each segment', () => {
    const root = buildTree([op('/2024/06/photo.jpg')])
    expect(root.children.get('2024')!.name).toBe('2024')
    expect(root.children.get('2024')!.children.get('06')!.name).toBe('06')
  })
})

describe('shortPath', () => {
  it('returns the last 4 segments by default', () => {
    expect(shortPath('/a/b/c/d/e/f.jpg')).toBe('c/d/e/f.jpg')
  })

  it('respects a custom segment count', () => {
    expect(shortPath('/a/b/c/d/e/f.jpg', 2)).toBe('e/f.jpg')
  })

  it('returns the full path when it has fewer segments than requested', () => {
    expect(shortPath('/a/b.jpg', 4)).toBe('/a/b.jpg')
  })

  it('handles a single filename', () => {
    expect(shortPath('/photo.jpg', 1)).toBe('photo.jpg')
  })
})
