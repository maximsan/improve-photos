import { ScanSearch, Copy, CalendarCheck, Sparkles, Upload, type LucideIcon } from 'lucide-react'
import type { Tab } from '../types'

const NAV_ITEMS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'scanner', label: 'Scan', Icon: ScanSearch },
  { id: 'dedup', label: 'Duplicates', Icon: Copy },
  { id: 'organizer', label: 'Organize', Icon: CalendarCheck },
  { id: 'quality', label: 'Quality', Icon: Sparkles },
  { id: 'exporter', label: 'Export', Icon: Upload }
]

interface SidebarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

function Sidebar({ activeTab, onTabChange }: SidebarProps): React.JSX.Element {
  return (
    <aside className="flex flex-col w-[220px] shrink-0 h-full select-none bg-surface-900 sidebar-inset">
      {/* macOS traffic-light drag zone — must be exactly this height */}
      <div className="titlebar-drag h-[42px] shrink-0" />

      {/* App logo */}
      <div className="titlebar-no-drag px-5 pb-4">
        <span className="font-display text-[17px] tracking-tight text-surface-100">Cleanup</span>
        <span className="ml-2 text-[10px] font-semibold tracking-widest uppercase text-primary-500">
          Photos
        </span>
      </div>

      {/* Divider */}
      <div className="mx-4 mb-2 h-px bg-surface-800" />

      {/* Navigation */}
      <nav className="titlebar-no-drag flex-1 flex flex-col gap-0.5 px-3 pt-1">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`w-full flex items-center gap-3 px-3 py-[9px] rounded-lg text-[13px] font-medium transition-colors duration-150 cursor-default text-left ${
                isActive ? 'nav-active text-primary-400' : 'nav-inactive text-surface-500'
              }`}
            >
              <Icon
                size={16}
                strokeWidth={1.75}
                className={isActive ? 'text-primary-400' : 'text-surface-600'}
              />
              {label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0 bg-primary-500" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="titlebar-no-drag p-4 pt-2">
        <p className="text-[11px] text-surface-700">v{__APP_VERSION__}</p>
      </div>
    </aside>
  )
}

export default Sidebar
