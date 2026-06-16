'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setStatus('submitting')
    setMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setStatus('error')
      setMessage(
        error.message === 'Invalid login credentials'
          ? 'E-Mail oder Passwort ist falsch.'
          : error.message,
      )
      return
    }

    // Session cookies are set; full navigation so the server picks them up.
    const next = searchParams.get('redirect') ?? '/'
    window.location.assign(next.startsWith('/') ? next : '/')
  }

  return (
    <div className="card w-full max-w-sm p-6">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <span aria-hidden className="text-4xl">🥫</span>
        <h1 className="text-xl font-bold text-slate-900">Vorrat</h1>
        <p className="text-sm text-slate-500">Melde dich mit E-Mail und Passwort an.</p>
      </div>

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

        <div>
          <label htmlFor="password" className="label">
            Passwort
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </div>

        {status === 'error' ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
        ) : null}

        <button type="submit" className="btn-primary" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Anmelden …' : 'Anmelden'}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-400">
        Zugänge werden vom Haushalt verwaltet.
      </p>
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
