interface CompletionViewProps {
  icon: React.ReactNode
  title: React.ReactNode
  body?: React.ReactNode
  action?: { label: string; onClick: () => void }
}

export function CompletionView({
  icon,
  title,
  body,
  action
}: CompletionViewProps): React.JSX.Element {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5">
      <div className="w-18 h-18 rounded-2xl flex items-center justify-center bg-primary-100">
        {icon}
      </div>
      <div className="text-center max-w-xs">
        <h2 className="text-[16px] font-semibold text-surface-800">{title}</h2>
        {body && <p className="text-[13px] mt-1 text-surface-500">{body}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="text-[12px] font-medium text-primary-600 hover:text-primary-700 cursor-default transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
