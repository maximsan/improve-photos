// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import ReleaseGatesPanel from '../../src/renderer/src/features/Settings/components/ReleaseGatesPanel'

afterEach(cleanup)

describe('ReleaseGatesPanel', () => {
  it('shows paused copy for disabled payments and auto-updates', () => {
    render(
      <ReleaseGatesPanel
        flags={{
          paymentsEnabled: false,
          autoUpdatesEnabled: false,
          releasePublishingEnabled: false
        }}
      />
    )

    expect(screen.getByText('Payments')).not.toBeNull()
    expect(
      screen.getByText(/License activation and payment network calls stay off/i)
    ).not.toBeNull()
    expect(screen.getByText('Auto-updates')).not.toBeNull()
    expect(screen.getByText(/will not check update servers/i)).not.toBeNull()
    expect(screen.getByText('Release publishing')).not.toBeNull()
    expect(screen.getAllByText('Paused')).toHaveLength(3)
  })

  it('shows enabled copy when gates are explicitly enabled', () => {
    render(
      <ReleaseGatesPanel
        flags={{
          paymentsEnabled: true,
          autoUpdatesEnabled: true,
          releasePublishingEnabled: true
        }}
      />
    )

    expect(screen.getByText(/may contact Lemon Squeezy/i)).not.toBeNull()
    expect(screen.getByText(/may contact GitHub Releases/i)).not.toBeNull()
    expect(screen.getByText(/after manual release approval/i)).not.toBeNull()
    expect(screen.getAllByText('Enabled')).toHaveLength(3)
  })
})
