import { ExternalLink } from 'lucide-react'

const SUPPORT_URL = 'https://github.com/maximsan/improve-photos/issues'
const PROJECT_URL = 'https://github.com/maximsan/improve-photos'

function AppLinksPanel(): React.JSX.Element {
  return (
    <section className="max-w-3xl">
      <div className="mb-4">
        <h1 className="text-[15px] font-semibold text-surface-900">App links</h1>
        <p className="mt-1 text-[12px] leading-relaxed text-surface-500">
          Version, support, and project information.
        </p>
      </div>

      <div className="rounded-lg border border-surface-200 bg-white px-4 py-3">
        <dl className="grid gap-3 text-[13px] sm:grid-cols-[8rem_1fr]">
          <dt className="font-semibold text-surface-700">Version</dt>
          <dd className="text-surface-600">{__APP_VERSION__}</dd>

          <dt className="font-semibold text-surface-700">Support</dt>
          <dd>
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700"
            >
              GitHub Issues
              <ExternalLink size={12} strokeWidth={2} />
            </a>
          </dd>

          <dt className="font-semibold text-surface-700">Project</dt>
          <dd>
            <a
              href={PROJECT_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700"
            >
              Repository
              <ExternalLink size={12} strokeWidth={2} />
            </a>
          </dd>
        </dl>
      </div>
    </section>
  )
}

export default AppLinksPanel
