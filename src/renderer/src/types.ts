/** The top-level navigation tabs in the app shell. */
export type Tab = 'scanner' | 'dedup' | 'organizer' | 'quality' | 'exporter' | 'help' | 'settings'

/** Maps every tab to its feature component. */
export interface FeatureMap {
  scanner: React.ComponentType
  dedup: React.ComponentType
  organizer: React.ComponentType
  quality: React.ComponentType
  exporter: React.ComponentType
  help: React.ComponentType
  settings: React.ComponentType
}
