interface SelectionRowProps {
  markedForTrash: boolean
  onToggle?: () => void
}

export function SelectionRow({ markedForTrash, onToggle }: SelectionRowProps): React.JSX.Element {
  const handleClick =
    markedForTrash && onToggle
      ? (e: React.MouseEvent<HTMLDivElement>) => {
          e.stopPropagation()
          onToggle()
        }
      : undefined

  return (
    <div className="px-3 pb-2.5 bg-white flex items-center gap-1.5" onClick={handleClick}>
      <div
        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
          markedForTrash ? 'bg-red-500 border-red-500' : 'border-surface-300 bg-white'
        }`}
      >
        {markedForTrash && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path
              d="M1 3L3 5L7 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <span className="text-[10px] text-surface-500">
        {markedForTrash ? 'Marked for trash' : 'Keep'}
      </span>
    </div>
  )
}
