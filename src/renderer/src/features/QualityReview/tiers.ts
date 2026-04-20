import {
  BLUR_SCORE_VERY_BLURRY_THRESHOLD,
  BLUR_SCORE_BLURRY_THRESHOLD,
  BLUR_SCORE_SOFT_THRESHOLD
} from './scoreLabel'

export interface Tier {
  key: string
  label: string
  dotColor: string
  countColor: string
  test: (score: number) => boolean
  defaultCollapsed: boolean
}

export const TIERS: Tier[] = [
  {
    key: 'very-blurry',
    label: 'Very Blurry',
    dotColor: 'bg-red-500',
    countColor: 'text-red-500',
    test: (s) => s >= 0 && s < BLUR_SCORE_VERY_BLURRY_THRESHOLD,
    defaultCollapsed: false
  },
  {
    key: 'blurry',
    label: 'Blurry',
    dotColor: 'bg-orange-500',
    countColor: 'text-orange-500',
    test: (s) => s >= BLUR_SCORE_VERY_BLURRY_THRESHOLD && s < BLUR_SCORE_BLURRY_THRESHOLD,
    defaultCollapsed: true
  },
  {
    key: 'soft',
    label: 'Soft',
    dotColor: 'bg-amber-500',
    countColor: 'text-amber-500',
    test: (s) => s >= BLUR_SCORE_BLURRY_THRESHOLD && s < BLUR_SCORE_SOFT_THRESHOLD,
    defaultCollapsed: true
  },
  {
    key: 'sharp',
    label: 'Sharp',
    dotColor: 'bg-emerald-500',
    countColor: 'text-emerald-500',
    test: (s) => s >= BLUR_SCORE_SOFT_THRESHOLD,
    defaultCollapsed: true
  },
  {
    key: 'failed',
    label: 'Unable to Analyse',
    dotColor: 'bg-surface-300',
    countColor: 'text-surface-400',
    test: (s) => s < 0,
    defaultCollapsed: true
  }
]
