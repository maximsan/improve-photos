// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFirstRunOnboarding } from '../../src/renderer/src/features/Onboarding/hooks/useFirstRunOnboarding'

const ONBOARDING_COMPLETE_KEY = 'cleanupPhotos.onboardingComplete'

describe('useFirstRunOnboarding', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('shows onboarding until completion is persisted', () => {
    const { result } = renderHook(() => useFirstRunOnboarding())

    expect(result.current.shouldShowOnboarding).toBe(true)

    act(() => result.current.completeOnboarding())

    expect(result.current.shouldShowOnboarding).toBe(false)
    expect(window.localStorage.getItem(ONBOARDING_COMPLETE_KEY)).toBe('true')
  })

  it('does not show onboarding after completion was persisted', () => {
    window.localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true')

    const { result } = renderHook(() => useFirstRunOnboarding())

    expect(result.current.shouldShowOnboarding).toBe(false)
  })
})
