import { TrashDonePanel } from '@renderer/components/TrashDonePanel'

interface DoneViewProps {
  onReset: () => void
}

export function DoneView({ onReset }: DoneViewProps): React.JSX.Element {
  return <TrashDonePanel actionLabel="Analyze again" onAction={onReset} />
}
