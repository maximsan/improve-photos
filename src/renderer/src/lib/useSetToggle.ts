import { useState } from 'react'

/**
 * Manages a Set<T> with a stable toggle callback.
 * Returns the current set and a function that adds or removes a value.
 */
export function useSetToggle<T>(): [Set<T>, (value: T) => void, () => void] {
  const [set, setSet] = useState<Set<T>>(new Set())

  function toggle(value: T): void {
    setSet((prev) => {
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      return next
    })
  }

  function clear(): void {
    setSet(new Set())
  }

  return [set, toggle, clear]
}
