// Small presentational primitives shared across screens.

import Link from 'next/link'
import type { ReactNode } from 'react'

import type { StatusLevel } from '@/lib/status'

const DOT: Record<StatusLevel, string> = {
  ok: 'bg-emerald-500',
  warn: 'bg-amber-500',
  critical: 'bg-red-500',
}

const BADGE: Record<StatusLevel, string> = {
  ok: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warn: 'bg-amber-50 text-amber-700 ring-amber-200',
  critical: 'bg-red-50 text-red-700 ring-red-200',
}

export function StatusDot({ level, className = '' }: { level: StatusLevel; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${DOT[level]} ${className}`}
    />
  )
}

export function StatusBadge({ level, children }: { level: StatusLevel; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${BADGE[level]}`}
    >
      {children}
    </span>
  )
}

const TILE_TONE: Record<StatusLevel | 'neutral', string> = {
  neutral: 'text-slate-900',
  ok: 'text-emerald-600',
  warn: 'text-amber-600',
  critical: 'text-red-600',
}

export function Tile({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: ReactNode
  tone?: StatusLevel | 'neutral'
}) {
  return (
    <div className="card flex flex-col gap-1 p-4">
      <span className={`text-2xl font-semibold tabular-nums ${TILE_TONE[tone]}`}>{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{children}</h2>
      {action}
    </div>
  )
}

export function EmptyState({
  icon = '📭',
  title,
  hint,
  action,
}: {
  icon?: string
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
      <span aria-hidden className="text-3xl">{icon}</span>
      <p className="font-medium text-slate-700">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-slate-500">{hint}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
      <span aria-hidden>←</span> {children}
    </Link>
  )
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}
