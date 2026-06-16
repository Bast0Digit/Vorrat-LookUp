'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setStatus('sending')
    setMessage('')

    const supabase = createClient()
    const next = searchParams.get('redirect') ?? '/'
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    })

    if (error) {
      setStatus('error')
      setMessage(error.message)
      return
    }
    setStatus('sent')
  }

  return (
    <div className="card w-full max-w-sm p-6">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <span aria-hidden className="text-4xl">🥫</span>
        <h1 className="text-xl font-bold text-slate-900">Vorrat</h1>
        <p className="text-sm text-slate-500">
          Melde dich mit deiner E-Mail an. Wir senden dir einen Anmeldelink.
        </p>
      </div>

      {status === 'sent' ? (
        <div className="rounded-lg bg-emerald-50 p-4 text-center text-sm text-emerald-800">
          <p className="font-medium">E-Mail unterwegs ✉️</p>
          <p className="mt-1">
            Öffne den Link in <strong>{email}</strong>, um dich anzumelden.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="label">
              E-Mail-Adresse
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="name@beispiel.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>

          {status === 'error' ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
          ) : null}

          <button type="submit" className="btn-primary" disabled={status === 'sending'}>
            {status === 'sending' ? 'Wird gesendet …' : 'Anmeldelink senden'}
          </button>
        </form>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
