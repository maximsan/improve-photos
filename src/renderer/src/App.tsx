import { useState } from 'react'
import Sidebar from './components/Sidebar'
import type { Tab, FeatureMap } from './types'
import Scanner from './features/Scanner'
import Dedup from './features/Dedup'
import Organizer from './features/Organizer'
import QualityReview from './features/QualityReview'
import Exporter from './features/Exporter'
import Help from './features/Help'
import Settings from './features/Settings'
import FirstRunOnboarding from './features/Onboarding'
import { useFirstRunOnboarding } from './features/Onboarding/hooks/useFirstRunOnboarding'
import { PhotosContext } from './context/photos'
import { NavigationContext } from './context/navigation'
import type { PhotoRecord } from '@shared/ipc'

const FEATURES: FeatureMap = {
  scanner: Scanner,
  dedup: Dedup,
  organizer: Organizer,
  quality: QualityReview,
  exporter: Exporter,
  help: Help,
  settings: Settings
}

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('scanner')
  const [photos, setPhotos] = useState<PhotoRecord[]>([])
  const [scanRoot, setScanRoot] = useState<string | null>(null)
  const [scanRevision, setScanRevision] = useState(0)
  const { shouldShowOnboarding, completeOnboarding } = useFirstRunOnboarding()
  function bumpScanRevision(): void {
    setScanRevision((r) => r + 1)
  }

  return (
    <NavigationContext.Provider value={{ setActiveTab }}>
      <PhotosContext.Provider
        value={{
          photos,
          scanRoot,
          scanRevision,
          setPhotos,
          setScanRoot,
          bumpScanRevision
        }}
      >
        <div className="flex h-full overflow-hidden">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface-50">
            {(Object.entries(FEATURES) as [Tab, React.ComponentType][]).map(([tab, Feature]) => (
              <div key={tab} className={tab === activeTab ? 'contents' : 'hidden'}>
                <Feature />
              </div>
            ))}
          </main>
          {shouldShowOnboarding ? (
            <FirstRunOnboarding
              onStart={() => {
                completeOnboarding()
                setActiveTab('scanner')
              }}
              onOpenHelp={() => {
                completeOnboarding()
                setActiveTab('help')
              }}
            />
          ) : null}
        </div>
      </PhotosContext.Provider>
    </NavigationContext.Provider>
  )
}

export default App
