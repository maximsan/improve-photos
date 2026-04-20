import { FolderOpen } from 'lucide-react'

interface OutputFolderSectionProps {
  outDir: string | null
  onPickFolder: () => void
}

export function OutputFolderSection({
  outDir,
  onPickFolder
}: OutputFolderSectionProps): React.JSX.Element {
  return (
    <section>
      <h3 className="text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-2">
        Output Folder
      </h3>
      <button
        type="button"
        onClick={onPickFolder}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-surface-200 bg-white hover:border-surface-300 transition-colors cursor-pointer"
      >
        <FolderOpen size={16} className="text-primary-500 shrink-0" />
        <span
          className={`text-[12px] flex-1 text-left truncate ${outDir ? 'text-surface-800' : 'text-surface-400'}`}
        >
          {outDir ?? 'Choose output folder…'}
        </span>
        <span className="text-[11px] font-medium text-primary-600 shrink-0">
          {outDir ? 'Change' : 'Browse'}
        </span>
      </button>
    </section>
  )
}
