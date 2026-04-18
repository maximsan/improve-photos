import { formatBytes } from '@renderer/lib/format'

interface PhotoInfoProps {
  name: string
  size: number
}

export function PhotoInfo({ name, size }: PhotoInfoProps): React.JSX.Element {
  return (
    <div className="px-3 py-2.5 bg-white">
      <p className="text-[11px] font-medium text-surface-700 truncate" title={name}>
        {name}
      </p>
      <p className="text-[10px] text-surface-400 mt-0.5">{formatBytes(size)}</p>
    </div>
  )
}
