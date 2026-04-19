import { createContext, useContext } from 'react'
import type { Tab } from '../types'

interface NavigationContextValue {
  setActiveTab: (tab: Tab) => void
}

export const NavigationContext = createContext<NavigationContextValue>({
  setActiveTab: () => {}
})

export function useNavigation(): NavigationContextValue {
  return useContext(NavigationContext)
}
