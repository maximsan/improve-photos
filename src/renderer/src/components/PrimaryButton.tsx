import type { ButtonHTMLAttributes } from 'react'

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Heavier label weight (e.g. export confirmation). */
  strong?: boolean
}

export function PrimaryButton({
  strong = false,
  className = '',
  children,
  type = 'button',
  ...rest
}: PrimaryButtonProps): React.JSX.Element {
  const weight = strong ? 'font-semibold' : 'font-medium'
  return (
    <button
      type={type}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] text-white cursor-default bg-primary-500 hover:bg-primary-600 transition-colors duration-150 ${weight} disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary-500 ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  )
}
