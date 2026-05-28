import { HelpCircle } from 'lucide-react'
import PanelHeader from '../../components/PanelHeader'

const HELP_SECTIONS = [
  {
    title: 'Scan',
    body: 'Choose the photo folder you want to review. The app reads metadata and image dimensions locally.'
  },
  {
    title: 'Review',
    body: 'Use Duplicates for near-identical files and Quality for blurry photos. Trash actions ask for confirmation first.'
  },
  {
    title: 'Organize',
    body: 'Preview date-based moves before applying them. The undo action can reverse a completed organize run.'
  },
  {
    title: 'Export',
    body: 'Create resized or converted copies in a folder you choose. Originals are not modified.'
  },
  {
    title: 'Safety',
    body: 'Files moved to Trash can be restored from macOS Trash. Keep a backup before large cleanup sessions.'
  }
] as const

function Help(): React.JSX.Element {
  return (
    <div className="flex h-full flex-col">
      <PanelHeader title="Help" subtitle="Scan, review, organize, and export safely" />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <HelpCircle size={20} strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-900">Workflow guide</h2>
              <p className="text-sm text-surface-500">A quick reference for local photo cleanup.</p>
            </div>
          </div>

          <div className="grid gap-3">
            {HELP_SECTIONS.map((section) => (
              <section
                key={section.title}
                className="rounded-lg border border-surface-200 bg-white px-4 py-3"
              >
                <h3 className="text-sm font-semibold text-surface-900">{section.title}</h3>
                <p className="mt-1 text-sm leading-6 text-surface-600">{section.body}</p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Help
