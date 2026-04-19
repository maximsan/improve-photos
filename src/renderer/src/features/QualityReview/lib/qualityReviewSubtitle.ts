import type { QualityStatus } from '../hooks/useQualityReviewState'

export function qualityReviewSubtitle(
  status: QualityStatus,
  photoCount: number,
  selectedCount: number
): string {
  if (status !== 'results' && status !== 'reviewing') {
    return 'Sort photos by sharpness score and trash the blurry ones'
  }
  if (selectedCount > 0) {
    return `${photoCount} photos · ${selectedCount} selected to trash`
  }
  return `${photoCount} photos analyzed`
}
