import { Upload } from 'lucide-react'
import { FormErrorText } from '../../../components/FormErrorText'
import { PrimaryButton } from '../../../components/PrimaryButton'
import type { Preset } from '../types'

interface ExportActionsFooterProps {
  photoCount: number
  presetCount: number
  totalFiles: number
  canExport: boolean
  error: string | null
  presets: Preset[]
  onExport: (presets: Preset[]) => void
}

export function ExportActionsFooter({
  photoCount,
  presetCount,
  totalFiles,
  canExport,
  error,
  presets,
  onExport
}: ExportActionsFooterProps): React.JSX.Element {
  return (
    <div className="shrink-0 px-5 py-4 border-t border-surface-200 bg-white">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-surface-500">
          <span className="font-semibold text-surface-800">{photoCount}</span> photos ×{' '}
          <span className="font-semibold text-surface-800">{presetCount}</span> preset
          {presetCount !== 1 ? 's' : ''} ={' '}
          <span className="font-semibold text-surface-800">{totalFiles}</span> files
        </p>
        <PrimaryButton strong disabled={!canExport} onClick={() => onExport(presets)}>
          <Upload size={14} strokeWidth={2} />
          Export {totalFiles} File{totalFiles !== 1 ? 's' : ''}
        </PrimaryButton>
      </div>
      {error ? <FormErrorText className="mt-2">{error}</FormErrorText> : null}
    </div>
  )
}
