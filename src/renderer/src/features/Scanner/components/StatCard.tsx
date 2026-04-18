interface StatCardProps {
  label: string
  value: string
}

export function StatCard({ label, value }: StatCardProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl bg-surface-100">
      <span className="text-[11px] text-surface-400 font-medium">{label}</span>
      <span className="text-[13px] font-semibold text-surface-700 text-center leading-tight">
        {value}
      </span>
    </div>
  )
}
