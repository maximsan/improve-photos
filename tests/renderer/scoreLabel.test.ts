import { describe, it, expect } from 'vitest'
import {
  scoreLabel,
  BLUR_SCORE_VERY_BLURRY_THRESHOLD,
  BLUR_SCORE_BLURRY_THRESHOLD,
  BLUR_SCORE_SOFT_THRESHOLD
} from '../../src/renderer/src/features/QualityReview/scoreLabel'

describe('scoreLabel', () => {
  it('returns failed label for negative score', () => {
    expect(scoreLabel(-1).label).toBe('Unable to analyze')
    expect(scoreLabel(-100).label).toBe('Unable to analyze')
  })

  it('returns very blurry for score = 0', () => {
    expect(scoreLabel(0).label).toBe('Very blurry')
  })

  it('returns very blurry for score below VERY_BLURRY threshold', () => {
    expect(scoreLabel(BLUR_SCORE_VERY_BLURRY_THRESHOLD - 1).label).toBe('Very blurry')
  })

  it('returns blurry at VERY_BLURRY threshold boundary', () => {
    expect(scoreLabel(BLUR_SCORE_VERY_BLURRY_THRESHOLD).label).toBe('Blurry')
  })

  it('returns blurry below BLURRY threshold', () => {
    expect(scoreLabel(BLUR_SCORE_BLURRY_THRESHOLD - 1).label).toBe('Blurry')
  })

  it('returns soft at BLURRY threshold boundary', () => {
    expect(scoreLabel(BLUR_SCORE_BLURRY_THRESHOLD).label).toBe('Soft')
  })

  it('returns soft below SOFT threshold', () => {
    expect(scoreLabel(BLUR_SCORE_SOFT_THRESHOLD - 1).label).toBe('Soft')
  })

  it('returns sharp at SOFT threshold boundary', () => {
    expect(scoreLabel(BLUR_SCORE_SOFT_THRESHOLD).label).toBe('Sharp')
  })

  it('returns sharp for large scores', () => {
    expect(scoreLabel(100).label).toBe('Sharp')
  })

  it('returns a color string for every tier', () => {
    for (const score of [-1, 0, 2, 6, 12, 50]) {
      expect(scoreLabel(score).color).toMatch(/^text-/)
    }
  })
})
