import { useState } from 'react'

const ONBOARDING_COMPLETE_KEY = 'cleanupPhotos.onboardingComplete'
const COMPLETE_VALUE = 'true'

function hasCompletedOnboarding(): boolean {
  try {
    return window.localStorage.getItem(ONBOARDING_COMPLETE_KEY) === COMPLETE_VALUE
  } catch {
    return true
  }
}

export interface FirstRunOnboardingState {
  shouldShowOnboarding: boolean
  completeOnboarding: () => void
}

export function useFirstRunOnboarding(): FirstRunOnboardingState {
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(() => !hasCompletedOnboarding())

  function completeOnboarding(): void {
    try {
      window.localStorage.setItem(ONBOARDING_COMPLETE_KEY, COMPLETE_VALUE)
    } finally {
      setShouldShowOnboarding(false)
    }
  }

  return { shouldShowOnboarding, completeOnboarding }
}
