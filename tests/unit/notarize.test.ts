import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { notarize } from '@electron/notarize'

vi.mock('@electron/notarize', () => ({
  notarize: vi.fn()
}))

interface NotarizeContext {
  electronPlatformName: string
  appOutDir: string
  packager: {
    appInfo: {
      productFilename: string
    }
  }
}

interface NotarizeModule {
  default: (context: NotarizeContext) => Promise<void>
  getMissingNotarizationCredentials: (env: NodeJS.ProcessEnv) => string[]
  REQUIRED_CREDENTIAL_KEYS: string[]
}

type ImportedNotarizeModule = NotarizeModule | { default: NotarizeModule }

const COMPLETE_NOTARIZATION_ENV = {
  APPLE_ID: 'developer@example.com',
  APPLE_APP_SPECIFIC_PASSWORD: 'app-specific-password',
  APPLE_TEAM_ID: 'TEAM123456'
}

const importedNotarizeModule =
  (await import('../../build/notarize.cjs')) as unknown as ImportedNotarizeModule

function isNotarizeModule(moduleImport: unknown): moduleImport is NotarizeModule {
  return (
    typeof moduleImport === 'object' &&
    moduleImport !== null &&
    'getMissingNotarizationCredentials' in moduleImport
  )
}

const notarizeModule = isNotarizeModule(importedNotarizeModule)
  ? importedNotarizeModule
  : (importedNotarizeModule as { default: NotarizeModule }).default

const {
  default: runNotarizeHook,
  getMissingNotarizationCredentials,
  REQUIRED_CREDENTIAL_KEYS
} = notarizeModule

function createDarwinContext(): NotarizeContext {
  return {
    electronPlatformName: 'darwin',
    appOutDir: '/tmp/mac',
    packager: {
      appInfo: {
        productFilename: 'Cleanup Photos'
      }
    }
  }
}

function stubMissingAppleCredentials(): void {
  for (const credentialKey of REQUIRED_CREDENTIAL_KEYS) {
    vi.stubEnv(credentialKey, '')
  }
}

describe('notarization environment validation', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns no missing keys when all required env vars exist', () => {
    expect(getMissingNotarizationCredentials(COMPLETE_NOTARIZATION_ENV)).toEqual([])
  })

  it('returns all missing keys when no required env vars exist', () => {
    expect(getMissingNotarizationCredentials({})).toEqual(REQUIRED_CREDENTIAL_KEYS)
  })
})

describe('notarization hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns without throwing when MAC_NOTARIZE is not enabled', async () => {
    vi.stubEnv('MAC_NOTARIZE', '0')
    stubMissingAppleCredentials()

    await expect(runNotarizeHook(createDarwinContext())).resolves.toBeUndefined()

    expect(notarize).not.toHaveBeenCalled()
  })

  it('rejects when MAC_NOTARIZE=1 and credentials are missing', async () => {
    vi.stubEnv('MAC_NOTARIZE', '1')
    stubMissingAppleCredentials()

    await expect(runNotarizeHook(createDarwinContext())).rejects.toThrow(
      '[notarize] MAC_NOTARIZE=1 but missing credentials: APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID'
    )

    expect(notarize).not.toHaveBeenCalled()
  })
})
