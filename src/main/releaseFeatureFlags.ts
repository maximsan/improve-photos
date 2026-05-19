import type { ReleaseFeatureFlags } from '@shared/ipc'

export const RELEASE_FEATURE_FLAG_ENV = {
  paymentsEnabled: 'CLEANUP_PHOTOS_PAYMENTS_ENABLED',
  autoUpdatesEnabled: 'CLEANUP_PHOTOS_AUTO_UPDATES_ENABLED',
  releasePublishingEnabled: 'CLEANUP_PHOTOS_RELEASE_PUBLISHING_ENABLED'
} as const

const ENABLED_FLAG_VALUES = new Set(['1', 'true', 'yes', 'on'])

export type ReleaseFeatureFlagEnvironment = Record<string, string | undefined>

function isEnabled(value: string | undefined): boolean {
  return value ? ENABLED_FLAG_VALUES.has(value.trim().toLowerCase()) : false
}

export function getReleaseFeatureFlags(
  env: ReleaseFeatureFlagEnvironment = process.env
): ReleaseFeatureFlags {
  return {
    paymentsEnabled: isEnabled(env[RELEASE_FEATURE_FLAG_ENV.paymentsEnabled]),
    autoUpdatesEnabled: isEnabled(env[RELEASE_FEATURE_FLAG_ENV.autoUpdatesEnabled]),
    releasePublishingEnabled: isEnabled(env[RELEASE_FEATURE_FLAG_ENV.releasePublishingEnabled])
  }
}
