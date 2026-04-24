import { describe, it, expect, vi } from 'vitest'
import { deriveTargetPath } from '../../src/main/ipc/organizer'
import type { PhotoRecord } from '../../src/shared/ipc'

vi.mock('fs/promises', () => ({
  rename: vi.fn(),
  access: vi.fn(),
  mkdir: vi.fn()
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePhoto(overrides: Partial<PhotoRecord> = {}): PhotoRecord {
  return {
    path: '/photos/IMG_001.jpg',
    name: 'IMG_001.jpg',
    size: 1_000_000,
    dateTaken: null,
    width: 4032,
    height: 3024,
    camera: null,
    ...overrides
  }
}

// ─── deriveTargetPath ─────────────────────────────────────────────────────────

describe('deriveTargetPath', () => {
  it('produces YYYY/MM/DD/<filename> from an EXIF date', () => {
    const photo = makePhoto({ dateTaken: '2024-07-15T10:30:00.000Z' })
    const result = deriveTargetPath(photo, '/organised')
    expect(result).toBe('/organised/2024/07/15/IMG_001.jpg')
  })

  it('zero-pads single-digit months and days', () => {
    const photo = makePhoto({ dateTaken: '2023-03-05T00:00:00.000Z' })
    expect(deriveTargetPath(photo, '/root')).toBe('/root/2023/03/05/IMG_001.jpg')
  })

  it('uses the photo filename, not the original directory', () => {
    const photo = makePhoto({
      path: '/old/nested/deep/shot.heic',
      name: 'shot.heic',
      dateTaken: '2022-12-31T23:59:59.000Z'
    })
    expect(deriveTargetPath(photo, '/organised')).toBe('/organised/2022/12/31/shot.heic')
  })

  it('places photos with no EXIF date under "undated"', () => {
    const photo = makePhoto({ dateTaken: null })
    expect(deriveTargetPath(photo, '/root')).toBe('/root/undated/IMG_001.jpg')
  })

  it('respects the rootDir argument — different roots produce different paths', () => {
    const photo = makePhoto({ dateTaken: '2024-01-01T00:00:00.000Z' })
    expect(deriveTargetPath(photo, '/a')).toBe('/a/2024/01/01/IMG_001.jpg')
    expect(deriveTargetPath(photo, '/b/sub')).toBe('/b/sub/2024/01/01/IMG_001.jpg')
  })

  it('handles a photo taken on the last day of a leap year', () => {
    const photo = makePhoto({ dateTaken: '2024-02-29T12:00:00.000Z' })
    expect(deriveTargetPath(photo, '/pics')).toBe('/pics/2024/02/29/IMG_001.jpg')
  })

  it('uses UTC dates to avoid timezone-shifted day values', () => {
    // 2024-07-15T23:00:00Z = July 15 UTC, but July 16 in UTC+1
    const photo = makePhoto({ dateTaken: '2024-07-15T23:00:00.000Z' })
    expect(deriveTargetPath(photo, '/root')).toContain('/2024/07/15/')
  })
})
