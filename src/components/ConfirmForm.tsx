'use client'

import { useFormStatus } from 'react-dom'

// A form whose submit triggers a server action, gated by a confirm() dialog.
export function ConfirmForm({
  action,
  message,
  children,
  className,
}: {
  action: () => Promise<void>
  message: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault()
      }}
      className={className}
    >
      {children}
    </form>
  )
}

export function SubmitButton({
  children,
  className,
  pendingLabel,
}: {
  children: React.ReactNode
  className?: string
  pendingLabel?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? (pendingLabel ?? '…') : children}
    </button>
  )
}
