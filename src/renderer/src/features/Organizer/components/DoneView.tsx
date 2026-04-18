import { CheckCircle2 } from 'lucide-react'
import { CompletionView } from '@renderer/components/CompletionView'

interface DoneViewProps {
  count: number
}

export function DoneView({ count }: DoneViewProps): React.JSX.Element {
  return (
    <CompletionView
      icon={<CheckCircle2 size={34} strokeWidth={1.4} className="text-primary-600" />}
      title={`${count} file${count !== 1 ? 's' : ''} organized`}
      body="Photos have been moved into their date folders."
    />
  )
}
