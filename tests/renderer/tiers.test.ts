import { describe, it, expect } from 'vitest'
import { TIERS } from '../../src/renderer/src/features/QualityReview/tiers'

const SAMPLE_SCORES = [-100, -1, 0, 1, 2, 3, 5, 6, 7, 11, 12, 13, 50, 100]

describe('TIERS', () => {
  it('has five tiers', () => {
    expect(TIERS).toHaveLength(5)
  })

  it('every tier has required fields', () => {
    for (const tier of TIERS) {
      expect(tier.key).toBeTruthy()
      expect(tier.label).toBeTruthy()
      expect(typeof tier.test).toBe('function')
    }
  })

  it('every score matches exactly one tier (no gaps, no overlaps)', () => {
    for (const score of SAMPLE_SCORES) {
      const matches = TIERS.filter((t) => t.test(score))
      expect(matches, `score ${score} matched ${matches.length} tiers`).toHaveLength(1)
    }
  })

  it('negative scores land in the failed tier', () => {
    const failed = TIERS.find((t) => t.key === 'failed')!
    expect(failed.test(-1)).toBe(true)
    expect(failed.test(-100)).toBe(true)
  })

  it('zero lands in the very-blurry tier', () => {
    const veryBlurry = TIERS.find((t) => t.key === 'very-blurry')!
    expect(veryBlurry.test(0)).toBe(true)
  })

  it('large positive scores land in the sharp tier', () => {
    const sharp = TIERS.find((t) => t.key === 'sharp')!
    expect(sharp.test(100)).toBe(true)
  })
})
