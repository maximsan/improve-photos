interface FormErrorTextProps {
  children: React.ReactNode
  className?: string
}

export function FormErrorText({ children, className = '' }: FormErrorTextProps): React.JSX.Element {
  return <p className={`text-[11px] text-red-500 ${className}`.trim()}>{children}</p>
}
