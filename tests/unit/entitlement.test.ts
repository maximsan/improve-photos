import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FREE_PHOTO_LIMIT } from '../../src/shared/ipc'
import { activateLicense } from '../../src/main/license'
import { canProcessPhotoCount, getEntitlementStatus } from '../../src/main/entitlement'
import { RELEASE_FEATURE_FLAG_ENV } from '../../src/main/releaseFeatureFlags'

const PAYMENTS_ENABLED_ENV = {
  [RELEASE_FEATURE_FLAG_ENV.paymentsEnabled]: 'true'
}

let tempDirs: string[] = []

async function storagePath(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'cleanup-entitlement-test-'))
  tempDirs.push(dir)
  return join(dir, 'license.json')
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })))
  tempDirs = []
})

describe('entitlement service', () => {
  it('allows unlicensed actions up to the free photo limit', async () => {
    await expect(canProcessPhotoCount(FREE_PHOTO_LIMIT, { env: {} })).resolves.toEqual({
      allowed: true,
      photoLimit: FREE_PHOTO_LIMIT,
      reason: null
    })
  })

  it('blocks unlicensed actions above the free photo limit', async () => {
    const decision = await canProcessPhotoCount(FREE_PHOTO_LIMIT + 1, { env: {} })

    expect(decision.allowed).toBe(false)
    expect(decision.photoLimit).toBe(FREE_PHOTO_LIMIT)
    expect(decision.reason).toContain(`${FREE_PHOTO_LIMIT}`)
  })

  it('allows licensed actions above the free photo limit', async () => {
    const path = await storagePath()
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        activated: true,
        license_key: { key: 'ABCD-1234-WXYZ' },
        instance: { id: 'instance-1', name: 'Cleanup Photos test' }
      })
    )

    await activateLicense('ABCD-1234-WXYZ', {
      env: PAYMENTS_ENABLED_ENV,
      fetch: fetcher,
      storagePath: path
    })

    await expect(
      getEntitlementStatus({ env: PAYMENTS_ENABLED_ENV, storagePath: path })
    ).resolves.toEqual({
      licensed: true,
      photoLimit: null
    })
    await expect(
      canProcessPhotoCount(FREE_PHOTO_LIMIT + 1, {
        env: PAYMENTS_ENABLED_ENV,
        storagePath: path
      })
    ).resolves.toEqual({
      allowed: true,
      photoLimit: null,
      reason: null
    })
  })
})
