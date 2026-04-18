import { ShieldCheck } from 'lucide-react'
import { CompletionView } from '@renderer/components/CompletionView'

export function DoneView(): React.JSX.Element {
  return (
    <CompletionView
      icon={<ShieldCheck size={34} strokeWidth={1.4} className="text-primary-600" />}
      title="Files moved to Trash"
      body="You can undo this from the macOS Trash if needed."
    />
  )
}
