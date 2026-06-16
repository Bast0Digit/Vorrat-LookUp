export default function Loading() {
  return (
    <div className="flex items-center justify-center py-24 text-sm text-slate-400">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500" />
      <span className="ml-3">Lädt …</span>
    </div>
  )
}
