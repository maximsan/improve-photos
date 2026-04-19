import { ShieldCheck } from 'lucide-react'
import { CompletionView } from '@renderer/components/CompletionView'

interface DoneViewProps {
  onReset: () => void
}

export function DoneView({ onReset }: DoneViewProps): React.JSX.Element {
  return (
    <CompletionView
      icon={<ShieldCheck size={34} strokeWidth={1.4} className="text-primary-600" />}
      title="Files moved to Trash"
      body="You can undo this from the macOS Trash if needed."
      action={{ label: 'Analyze again', onClick: onReset }}
    />
  )
}
