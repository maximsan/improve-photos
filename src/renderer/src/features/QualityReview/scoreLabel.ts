// Thresholds for stdev(original) - stdev(blur(3px)) on 512×512 greyscale thumbnails.
// Sharp images lose much more stdev from blurring than already-blurry ones.
export const BLUR_SCORE_VERY_BLURRY_THRESHOLD = 2
export const BLUR_SCORE_BLURRY_THRESHOLD = 6
export const BLUR_SCORE_SOFT_THRESHOLD = 12

export function scoreLabel(score: number): { label: string; color: string } {
  if (score < 0) {
    return { label: 'Unable to analyse', color: 'text-surface-400' }
  }
  if (score < BLUR_SCORE_VERY_BLURRY_THRESHOLD) {
    return { label: 'Very blurry', color: 'text-red-500' }
  }
  if (score < BLUR_SCORE_BLURRY_THRESHOLD) {
    return { label: 'Blurry', color: 'text-orange-500' }
  }
  if (score < BLUR_SCORE_SOFT_THRESHOLD) {
    return { label: 'Soft', color: 'text-amber-500' }
  }
  return { label: 'Sharp', color: 'text-emerald-500' }
}
