interface SpinnerViewProps {
  message: string
  variant?: 'primary' | 'danger'
}

export default function SpinnerView({
  message,
  variant = 'primary'
}: SpinnerViewProps): React.JSX.Element {
  const ringClass =
    variant === 'danger'
      ? 'border-red-200 border-t-red-400'
      : 'border-primary-200 border-t-primary-500'

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <div className={`w-10 h-10 rounded-full border-2 ${ringClass} animate-spin`} />
      <p className="text-[13px] text-surface-500">{message}</p>
    </div>
  )
}
