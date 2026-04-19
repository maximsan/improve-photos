import PanelHeader from '../../../components/PanelHeader'

interface ExporterLayoutProps {
  children: React.ReactNode
}

export function ExporterLayout({ children }: ExporterLayoutProps): React.JSX.Element {
  return (
    <div className="flex flex-col h-full">
      <PanelHeader title="Export" subtitle="Batch resize and convert photos using named presets" />
      {children}
    </div>
  )
}
