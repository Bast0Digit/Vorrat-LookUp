'use client'

import { useMemo, useState } from 'react'

import type { ShoppingItem } from '@/lib/data'
import { NO_CATEGORY_LABEL } from '@/lib/constants'
import { formatNumber } from '@/lib/format'

export function ShoppingList({ items }: { items: ShoppingItem[] }) {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)

  const groups = useMemo(() => {
    const map = new Map<string, ShoppingItem[]>()
    for (const item of items) {
      const key = item.categoryName ?? NO_CATEGORY_LABEL
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    return [...map.entries()]
  }, [items])

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function copyList() {
    const remaining = items.filter((i) => !checked.has(i.id))
    const lines = remaining.map((i) => `- ${i.name}: ${formatNumber(i.toBuy)} ${i.unit}`)
    const text = `Einkaufsliste\n\n${lines.join('\n') || 'Alles erledigt'}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable (e.g. insecure context); ignore silently.
    }
  }

  const remaining = items.length - checked.size

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {remaining} von {items.length} offen
        </p>
        <button type="button" onClick={copyList} className="btn-secondary text-xs">
          {copied ? 'Kopiert ✓' : 'Liste kopieren'}
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {groups.map(([categoryName, groupItems]) => (
          <section key={categoryName}>
            <h2 className="mb-2 px-1 text-sm font-semibold text-slate-700">{categoryName}</h2>
            <ul className="card divide-y divide-slate-100">
              {groupItems.map((item) => {
                const isChecked = checked.has(item.id)
                return (
                  <li key={item.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(item.id)}
                        className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className={`flex-1 font-medium ${isChecked ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                        {item.name}
                      </span>
                      <span className={`text-sm font-semibold tabular-nums ${isChecked ? 'text-slate-300' : 'text-amber-700'}`}>
                        +{formatNumber(item.toBuy)} {item.unit}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
