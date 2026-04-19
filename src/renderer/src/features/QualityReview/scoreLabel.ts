// Thresholds for stdev of the 2D Laplacian response on 1024×1024 greyscale images.
// Higher stdev = more edge energy = sharper photo.
export const BLUR_SCORE_VERY_BLURRY_THRESHOLD = 3
export const BLUR_SCORE_BLURRY_THRESHOLD = 8
export const BLUR_SCORE_SOFT_THRESHOLD = 16

export function scoreLabel(score: number): { label: string; color: string } {
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
