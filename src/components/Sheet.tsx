import { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

/** Bottom sheet on phones, centered dialog on wider screens. */
export function Sheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="animate-fade absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-sheet pb-safe relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-slate-800 bg-slate-900 sm:max-w-lg sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900/95 px-5 py-4 backdrop-blur">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
