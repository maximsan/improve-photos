import { useState } from 'react'
import Sidebar from './components/Sidebar'
import type { Tab, FeatureMap } from './types'
import Scanner from './features/Scanner'
import Dedup from './features/Dedup'
import Organizer from './features/Organizer'
import QualityReview from './features/QualityReview'
import Exporter from './features/Exporter'
import { PhotosContext } from './context/photos'
import type { PhotoRecord } from '@shared/ipc'

const FEATURES: FeatureMap = {
  scanner: Scanner,
  dedup: Dedup,
  organizer: Organizer,
  quality: QualityReview,
  exporter: Exporter
}

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('scanner')
  const [photos, setPhotos] = useState<PhotoRecord[]>([])

  return (
    <PhotosContext.Provider value={{ photos, setPhotos }}>
      <div className="flex h-full overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface-50">
          {(Object.entries(FEATURES) as [Tab, React.ComponentType][]).map(([tab, Feature]) => (
            <div key={tab} className={tab === activeTab ? 'contents' : 'hidden'}>
              <Feature />
            </div>
          ))}
        </main>
      </div>
    </PhotosContext.Provider>
  )
}

export default App
