import { HelpCircle, ScanSearch } from 'lucide-react'
import { PrimaryButton } from '../../components/PrimaryButton'

interface FirstRunOnboardingProps {
  onStart: () => void
  onOpenHelp: () => void
}

function FirstRunOnboarding({ onStart, onOpenHelp }: FirstRunOnboardingProps): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/45 px-5">
      <section className="w-full max-w-xl rounded-xl border border-surface-200 bg-white shadow-xl">
        <div className="border-b border-surface-200 px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-600">
            Welcome
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-normal text-surface-900">
            Clean up photos locally
          </h1>
          <p className="mt-2 text-sm leading-6 text-surface-600">
            Cleanup Photos scans folders on this Mac, keeps originals local, and asks before moving
            files to Trash.
          </p>
        </div>

        <div className="grid gap-3 px-6 py-5 text-sm text-surface-700">
          <p>
            Start with Scan, then review duplicates or blurry photos before organizing or exporting
            copies.
          </p>
          <p>
            Organize previews moves before touching files. Export writes new files and leaves
            originals in place.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-surface-200 px-6 py-4">
          <button
            type="button"
            onClick={onOpenHelp}
            className="flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-4 py-2 text-[13px] font-medium text-surface-700 transition-colors duration-150 hover:bg-surface-50"
          >
            <HelpCircle size={15} strokeWidth={2} />
            Open Help
          </button>
          <PrimaryButton onClick={onStart} strong>
            <ScanSearch size={15} strokeWidth={2} />
            Start with Scan
          </PrimaryButton>
        </div>
      </section>
    </div>
  )
}

export default FirstRunOnboarding
