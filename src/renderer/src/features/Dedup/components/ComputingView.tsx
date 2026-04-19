import type { HashProgress } from '@shared/ipc'
import { ProgressView } from '@renderer/components/ProgressView'

type Props = {
  progress: HashProgress | null
  onCancel: () => void
}

const MAX_FILENAME_CHARS = 40

function truncateMiddle(name: string): string {
  if (name.length <= MAX_FILENAME_CHARS) {
    return name
  }
  const half = Math.floor((MAX_FILENAME_CHARS - 1) / 2)
  return `${name.slice(0, half)}…${name.slice(-half)}`
}

export function ComputingView({ progress, onCancel }: Props): React.JSX.Element {
  const percent = progress ? Math.round((progress.done / progress.total) * 100) : 0
  const label = progress ? `Hashing photo ${progress.done} of ${progress.total}` : 'Starting…'
  const current = progress
    ? truncateMiddle(progress.current.split(/[\\/]/).pop() ?? progress.current)
    : undefined

  return <ProgressView label={label} percent={percent} current={current} onCancel={onCancel} />
}
