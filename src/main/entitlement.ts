import type { EntitlementStatus, PhotoCountDecision } from '@shared/ipc'
import { FREE_PHOTO_LIMIT } from '@shared/ipc'
import type { ReleaseFeatureFlagEnvironment } from './releaseFeatureFlags'
import { getLicenseStatus } from './license'

interface EntitlementOptions {
  env?: ReleaseFeatureFlagEnvironment
  storagePath?: string
}

export function freeLimitReason(photoCount: number): string {
  return `Unlicensed use is limited to ${FREE_PHOTO_LIMIT} photos per workflow action. This action includes ${photoCount} photos. Activate a license in Settings to continue.`
}

export async function getEntitlementStatus(
  options: EntitlementOptions = {}
): Promise<EntitlementStatus> {
  const licenseStatus = await getLicenseStatus(options)
  const licensed = licenseStatus.state === 'licensed'
  // Only a real unlicensed user is capped; 'disabled' (licensing off) stays unlimited.
  const limited = licenseStatus.state === 'unlicensed'

  return {
    licensed,
    photoLimit: limited ? FREE_PHOTO_LIMIT : null
  }
}

export async function canProcessPhotoCount(
  photoCount: number,
  options: EntitlementOptions = {}
): Promise<PhotoCountDecision> {
  const { photoLimit } = await getEntitlementStatus(options)
  if (photoLimit === null || photoCount <= photoLimit) {
    return {
      allowed: true,
      photoLimit,
      reason: null
    }
  }

  return {
    allowed: false,
    photoLimit,
    reason: freeLimitReason(photoCount)
  }
}
