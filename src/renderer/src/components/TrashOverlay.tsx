import { Trash2 } from 'lucide-react'

export function TrashOverlay(): React.JSX.Element {
  return (
    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
      <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center shadow-md">
        <Trash2 size={16} strokeWidth={2} className="text-white" />
      </div>
    </div>
  )
}
