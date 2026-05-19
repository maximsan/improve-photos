import { describe, expect, it } from 'vitest'
import {
  getReleaseFeatureFlags,
  RELEASE_FEATURE_FLAG_ENV
} from '../../src/main/releaseFeatureFlags'

describe('getReleaseFeatureFlags', () => {
  it('defaults every release feature gate to disabled', () => {
    expect(getReleaseFeatureFlags({})).toEqual({
      paymentsEnabled: false,
      autoUpdatesEnabled: false,
      releasePublishingEnabled: false
    })
  })

  it('enables gates only from explicit truthy environment values', () => {
    expect(
      getReleaseFeatureFlags({
        [RELEASE_FEATURE_FLAG_ENV.paymentsEnabled]: 'true',
        [RELEASE_FEATURE_FLAG_ENV.autoUpdatesEnabled]: '1',
        [RELEASE_FEATURE_FLAG_ENV.releasePublishingEnabled]: 'ON'
      })
    ).toEqual({
      paymentsEnabled: true,
      autoUpdatesEnabled: true,
      releasePublishingEnabled: true
    })
  })

  it('keeps gates disabled for missing, empty, and non-truthy values', () => {
    expect(
      getReleaseFeatureFlags({
        [RELEASE_FEATURE_FLAG_ENV.paymentsEnabled]: '',
        [RELEASE_FEATURE_FLAG_ENV.autoUpdatesEnabled]: 'false',
        [RELEASE_FEATURE_FLAG_ENV.releasePublishingEnabled]: '0'
      })
    ).toEqual({
      paymentsEnabled: false,
      autoUpdatesEnabled: false,
      releasePublishingEnabled: false
    })
  })
})
