const BLUR_SCORE_VERY_BLURRY_THRESHOLD = 50
const BLUR_SCORE_BLURRY_THRESHOLD = 200
const BLUR_SCORE_SOFT_THRESHOLD = 600

export function scoreLabel(score: number): { label: string; color: string } {
  if (score < BLUR_SCORE_VERY_BLURRY_THRESHOLD)
    return { label: 'Very blurry', color: 'text-red-500' }
  if (score < BLUR_SCORE_BLURRY_THRESHOLD) return { label: 'Blurry', color: 'text-orange-500' }
  if (score < BLUR_SCORE_SOFT_THRESHOLD) return { label: 'Soft', color: 'text-amber-500' }
  return { label: 'Sharp', color: 'text-emerald-500' }
}
