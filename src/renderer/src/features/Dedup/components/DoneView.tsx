import { TrashDonePanel } from '@renderer/components/TrashDonePanel'

interface DoneViewProps {
  onFindMore: () => void
}

export function DoneView({ onFindMore }: DoneViewProps): React.JSX.Element {
  return <TrashDonePanel actionLabel="Find more duplicates" onAction={onFindMore} />
}
