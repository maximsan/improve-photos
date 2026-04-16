interface PanelHeaderProps {
  title: string
  subtitle: string
}

function PanelHeader({ title, subtitle }: PanelHeaderProps): React.JSX.Element {
  return (
    <header className="flex items-center px-6 py-4 border-b border-surface-200 bg-white shrink-0">
      <div>
        <h1 className="text-[14px] font-semibold text-surface-900">{title}</h1>
        <p className="text-[12px] mt-0.5 text-surface-500">{subtitle}</p>
      </div>
    </header>
  )
}

export default PanelHeader
