import { Trash2, X } from 'lucide-react'

interface TrashOverlayProps {
  onDeselect: () => void
  /** When provided, clicking the overlay triggers this action instead of deselecting. */
  onTrash?: () => void
}

export function TrashOverlay({ onDeselect, onTrash }: TrashOverlayProps): React.JSX.Element {
  return (
    <div
      className="absolute inset-0 bg-red-500/20 flex items-center justify-center"
      onClick={(e) => {
        e.stopPropagation()
        if (onTrash) {
          onTrash()
        } else {
          onDeselect()
        }
      }}
    >
      <div
        title="Click to keep"
        className="group w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-md transition-colors duration-150 cursor-default"
      >
        <Trash2 size={16} strokeWidth={2} className="text-white group-hover:hidden" />
        <X size={16} strokeWidth={2} className="text-white hidden group-hover:block" />
      </div>
    </div>
  )
}
