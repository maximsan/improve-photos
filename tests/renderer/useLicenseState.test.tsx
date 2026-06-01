// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLicenseState } from '../../src/renderer/src/features/Settings/hooks/useLicenseState'

const mockApi = {
  getLicenseStatus: vi.fn(),
  activateLicense: vi.fn(),
  deactivateLicense: vi.fn()
}

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(window, 'api', { value: mockApi, writable: true, configurable: true })
})

describe('useLicenseState', () => {
  it('skips the license fetch when payments are gated off', () => {
    const { result } = renderHook(() => useLicenseState(false))

    expect(mockApi.getLicenseStatus).not.toHaveBeenCalled()
    expect(result.current.status).toBe('ready')
    expect(result.current.license).toBeNull()
  })

  it('fetches the license status when payments are enabled', async () => {
    mockApi.getLicenseStatus.mockResolvedValue({ state: 'unlicensed' })
    const { result } = renderHook(() => useLicenseState(true))

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(mockApi.getLicenseStatus).toHaveBeenCalledTimes(1)
    expect(result.current.license).toEqual({ state: 'unlicensed' })
  })
})
