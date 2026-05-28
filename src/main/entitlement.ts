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

  return {
    licensed,
    photoLimit: licensed ? null : FREE_PHOTO_LIMIT
  }
}

export async function canProcessPhotoCount(
  photoCount: number,
  options: EntitlementOptions = {}
): Promise<PhotoCountDecision> {
  const entitlement = await getEntitlementStatus(options)
  if (entitlement.licensed || photoCount <= FREE_PHOTO_LIMIT) {
    return {
      allowed: true,
      photoLimit: entitlement.photoLimit,
      reason: null
    }
  }

  return {
    allowed: false,
    photoLimit: entitlement.photoLimit,
    reason: freeLimitReason(photoCount)
  }
}
