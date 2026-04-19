import { FolderClosed, FolderOpen } from 'lucide-react'

interface FolderDisclosureIconProps {
  expandable: boolean
  open: boolean
}

export function FolderDisclosureIcon({
  expandable,
  open
}: FolderDisclosureIconProps): React.JSX.Element | null {
  if (!expandable) {
    return null
  }
  if (open) {
    return <FolderOpen size={13} className="text-primary-500 shrink-0" />
  }
  return <FolderClosed size={13} className="text-primary-500 shrink-0" />
}
