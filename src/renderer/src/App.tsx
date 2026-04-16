import { useState } from 'react'
import Sidebar from './components/Sidebar'
import type { Tab, FeatureMap } from './types'
import Scanner from './features/Scanner'
import Dedup from './features/Dedup'
import Organizer from './features/Organizer'
import QualityReview from './features/QualityReview'
import Exporter from './features/Exporter'

const FEATURES: FeatureMap = {
  scanner: Scanner,
  dedup: Dedup,
  organizer: Organizer,
  quality: QualityReview,
  exporter: Exporter
}

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('scanner')
  const ActiveFeature = FEATURES[activeTab]

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface-50">
        <ActiveFeature />
      </main>
    </div>
  )
}

export default App
