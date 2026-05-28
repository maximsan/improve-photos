import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { activateLicense, deactivateLicense, getLicenseStatus } from '../../src/main/license'
import { RELEASE_FEATURE_FLAG_ENV } from '../../src/main/releaseFeatureFlags'

const PAYMENTS_ENABLED_ENV = {
  [RELEASE_FEATURE_FLAG_ENV.paymentsEnabled]: 'true'
}

let tempDirs: string[] = []

async function storagePath(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'cleanup-license-test-'))
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

describe('license service', () => {
  it('returns disabled status and makes no activation request when payments are gated off', async () => {
    const fetcher = vi.fn()

    await expect(
      activateLicense('license-key', { env: {}, fetch: fetcher, storagePath: await storagePath() })
    ).rejects.toThrow('disabled')

    await expect(getLicenseStatus({ env: {}, storagePath: await storagePath() })).resolves.toEqual({
      state: 'disabled',
      licenseKeyLast4: null,
      productName: null,
      customerEmail: null,
      activatedAt: null
    })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('activates and stores a Lemon Squeezy license', async () => {
    const path = await storagePath()
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        activated: true,
        license_key: { key: 'ABCD-1234-WXYZ' },
        instance: { id: 'instance-1', name: 'Cleanup Photos test' },
        meta: { product_name: 'Cleanup Photos', customer_email: 'user@example.com' }
      })
    )

    const status = await activateLicense('ABCD-1234-WXYZ', {
      env: PAYMENTS_ENABLED_ENV,
      fetch: fetcher,
      now: () => '2026-05-28T00:00:00.000Z',
      storagePath: path
    })

    expect(status).toEqual({
      state: 'licensed',
      licenseKeyLast4: 'WXYZ',
      productName: 'Cleanup Photos',
      customerEmail: 'user@example.com',
      activatedAt: '2026-05-28T00:00:00.000Z'
    })
    await expect(
      getLicenseStatus({ env: PAYMENTS_ENABLED_ENV, storagePath: path })
    ).resolves.toEqual(status)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('deactivates and clears a stored license', async () => {
    const path = await storagePath()
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          activated: true,
          license_key: { key: 'ABCD-1234-WXYZ' },
          instance: { id: 'instance-1', name: 'Cleanup Photos test' }
        })
      )
      .mockResolvedValueOnce(jsonResponse({ deactivated: true }))

    await activateLicense('ABCD-1234-WXYZ', {
      env: PAYMENTS_ENABLED_ENV,
      fetch: fetcher,
      storagePath: path
    })

    await expect(
      deactivateLicense({ env: PAYMENTS_ENABLED_ENV, fetch: fetcher, storagePath: path })
    ).resolves.toMatchObject({ state: 'unlicensed' })

    await expect(
      getLicenseStatus({ env: PAYMENTS_ENABLED_ENV, storagePath: path })
    ).resolves.toEqual({
      state: 'unlicensed',
      licenseKeyLast4: null,
      productName: null,
      customerEmail: null,
      activatedAt: null
    })
  })
})
