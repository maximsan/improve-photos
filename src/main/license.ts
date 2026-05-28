import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { app, net } from 'electron'
import type { LicenseStatus } from '@shared/ipc'
import type { ReleaseFeatureFlagEnvironment } from './releaseFeatureFlags'
import { getReleaseFeatureFlags } from './releaseFeatureFlags'

const LICENSE_FILE_NAME = 'license.json'
const LEMON_SQUEEZY_ACTIVATE_URL = 'https://api.lemonsqueezy.com/v1/licenses/activate'
const LEMON_SQUEEZY_DEACTIVATE_URL = 'https://api.lemonsqueezy.com/v1/licenses/deactivate'

interface StoredLicense {
  licenseKey: string
  instanceId: string
  instanceName: string
  licenseKeyLast4: string
  productName: string | null
  customerEmail: string | null
  activatedAt: string
}

interface LicenseServiceOptions {
  env?: ReleaseFeatureFlagEnvironment
  fetch?: typeof net.fetch
  now?: () => string
  storagePath?: string
}

interface LemonSqueezyActivateResponse {
  activated?: boolean
  error?: string | null
  license_key?: {
    key?: string
  }
  instance?: {
    id?: string
    name?: string
  }
  meta?: {
    product_name?: string
    customer_email?: string
  }
}

interface LemonSqueezyDeactivateResponse {
  deactivated?: boolean
  error?: string | null
}

function licenseStoragePath(options: LicenseServiceOptions = {}): string {
  return options.storagePath ?? join(app.getPath('userData'), LICENSE_FILE_NAME)
}

function statusFromStoredLicense(storedLicense: StoredLicense | null): LicenseStatus {
  if (!storedLicense) {
    return {
      state: 'unlicensed',
      licenseKeyLast4: null,
      productName: null,
      customerEmail: null,
      activatedAt: null
    }
  }

  return {
    state: 'licensed',
    licenseKeyLast4: storedLicense.licenseKeyLast4,
    productName: storedLicense.productName,
    customerEmail: storedLicense.customerEmail,
    activatedAt: storedLicense.activatedAt
  }
}

function disabledStatus(): LicenseStatus {
  return {
    state: 'disabled',
    licenseKeyLast4: null,
    productName: null,
    customerEmail: null,
    activatedAt: null
  }
}

function licenseKeyLast4(licenseKey: string): string {
  return licenseKey.trim().slice(-4)
}

function createInstanceName(): string {
  return `Cleanup Photos ${randomUUID()}`
}

async function readStoredLicense(
  options: LicenseServiceOptions = {}
): Promise<StoredLicense | null> {
  try {
    const raw = await readFile(licenseStoragePath(options), 'utf8')
    return JSON.parse(raw) as StoredLicense
  } catch {
    return null
  }
}

async function writeStoredLicense(
  storedLicense: StoredLicense,
  options: LicenseServiceOptions = {}
): Promise<void> {
  const storagePath = licenseStoragePath(options)
  await mkdir(dirname(storagePath), { recursive: true })
  await writeFile(storagePath, JSON.stringify(storedLicense, null, 2), 'utf8')
}

async function clearStoredLicense(options: LicenseServiceOptions = {}): Promise<void> {
  await rm(licenseStoragePath(options), { force: true })
}

async function postLicenseRequest<T>(
  url: string,
  body: URLSearchParams,
  options: LicenseServiceOptions = {}
): Promise<T> {
  const fetcher = options.fetch ?? net.fetch
  const response = await fetcher(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  })

  const payload = (await response.json()) as T & { error?: string | null }
  if (!response.ok) {
    throw new Error(payload.error ?? `License request failed with ${response.status}`)
  }

  return payload
}

function paymentsEnabled(options: LicenseServiceOptions = {}): boolean {
  return getReleaseFeatureFlags(options.env).paymentsEnabled
}

export async function getLicenseStatus(
  options: LicenseServiceOptions = {}
): Promise<LicenseStatus> {
  if (!paymentsEnabled(options)) {
    return disabledStatus()
  }

  return statusFromStoredLicense(await readStoredLicense(options))
}

export async function activateLicense(
  licenseKey: string,
  options: LicenseServiceOptions = {}
): Promise<LicenseStatus> {
  if (!paymentsEnabled(options)) {
    throw new Error('License activation is disabled for this build.')
  }

  const trimmedLicenseKey = licenseKey.trim()
  if (!trimmedLicenseKey) {
    throw new Error('Enter a license key.')
  }

  const instanceName = createInstanceName()
  const payload = await postLicenseRequest<LemonSqueezyActivateResponse>(
    LEMON_SQUEEZY_ACTIVATE_URL,
    new URLSearchParams({ license_key: trimmedLicenseKey, instance_name: instanceName }),
    options
  )

  if (!payload.activated || !payload.instance?.id) {
    throw new Error(payload.error ?? 'License key could not be activated.')
  }

  const storedLicense: StoredLicense = {
    licenseKey: payload.license_key?.key ?? trimmedLicenseKey,
    instanceId: payload.instance.id,
    instanceName: payload.instance.name ?? instanceName,
    licenseKeyLast4: licenseKeyLast4(payload.license_key?.key ?? trimmedLicenseKey),
    productName: payload.meta?.product_name ?? null,
    customerEmail: payload.meta?.customer_email ?? null,
    activatedAt: options.now?.() ?? new Date().toISOString()
  }

  await writeStoredLicense(storedLicense, options)

  return statusFromStoredLicense(storedLicense)
}

export async function deactivateLicense(
  options: LicenseServiceOptions = {}
): Promise<LicenseStatus> {
  if (!paymentsEnabled(options)) {
    throw new Error('License deactivation is disabled for this build.')
  }

  const storedLicense = await readStoredLicense(options)
  if (!storedLicense) {
    return statusFromStoredLicense(null)
  }

  const payload = await postLicenseRequest<LemonSqueezyDeactivateResponse>(
    LEMON_SQUEEZY_DEACTIVATE_URL,
    new URLSearchParams({
      license_key: storedLicense.licenseKey,
      instance_id: storedLicense.instanceId
    }),
    options
  )

  if (!payload.deactivated) {
    throw new Error(payload.error ?? 'License key could not be deactivated.')
  }

  await clearStoredLicense(options)

  return statusFromStoredLicense(null)
}
