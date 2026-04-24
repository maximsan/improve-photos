import { CheckCircle2 } from 'lucide-react'
import { CompletionView } from '@renderer/components/CompletionView'

interface ExportDoneViewProps {
  count: number
  outDir: string
  onReset: () => void
}

export function ExportDoneView({ count, outDir, onReset }: ExportDoneViewProps): React.JSX.Element {
  return (
    <CompletionView
      icon={<CheckCircle2 size={34} strokeWidth={1.4} className="text-primary-600" />}
      title={`${count} file${count !== 1 ? 's' : ''} exported`}
      body={
        <span className="truncate block" title={outDir}>
          {outDir}
        </span>
      }
      action={{ label: 'Export again with different presets', onClick: onReset }}
    />
  )
}
