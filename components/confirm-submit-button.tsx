'use client'

interface ConfirmSubmitButtonProps {
  children: string
  message: string
  className?: string
}

export function ConfirmSubmitButton({
  children,
  message,
  className,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault()
        }
      }}
    >
      {children}
    </button>
  )
}
