import { useEffect, useRef, useState } from 'react'
import { KEYBOARD, keyLabel, keyName, matchShortcut, SHORTCUTS, type Shortcut } from '../lib/shortcuts'
import { Sheet } from './Sheet'

const GROUPS = ['Navigation', 'Today', 'General'] as const

const Combo = ({ s }: { s: Shortcut }) => (
  <span className="flex shrink-0 items-center gap-1">
    {s.keys.map((k, i) => (
      <span key={k} className="flex items-center gap-1">
        {i > 0 && <span className="text-xs text-n-400">+</span>}
        <kbd className="min-w-7 rounded-lg border border-n-700 bg-n-950 px-1.5 py-0.5 text-center text-xs font-semibold text-n-200">{keyLabel(k)}</kbd>
      </span>
    ))}
  </span>
)

/**
 * Every keyboard shortcut, with a keyboard diagram above the list that lights up the
 * keys of the selected shortcut. While it's open, pressing a shortcut selects it here
 * instead of running it, so people can find keys by trying them.
 */
export function Shortcuts({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sel, setSel] = useState(SHORTCUTS[0].id)
  // Bumped on every selection so the "pressed" animation replays, even for the same shortcut.
  const [beat, setBeat] = useState(0)
  const list = useRef<HTMLUListElement>(null)
  const current = SHORTCUTS.find((s) => s.id === sel) ?? SHORTCUTS[0]

  const select = (id: string, focus = false) => {
    setSel(id)
    setBeat((b) => b + 1)
    if (focus) list.current?.querySelector<HTMLButtonElement>(`[data-id="${id}"]`)?.focus()
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return
      const i = SHORTCUTS.findIndex((s) => s.id === sel)
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        select(SHORTCUTS[(i + (e.key === 'ArrowDown' ? 1 : SHORTCUTS.length - 1)) % SHORTCUTS.length].id, true)
        return
      }
      const m = matchShortcut(e)
      // Escape still closes the dialog (handled by Sheet).
      if (!m || m.id === 'close') return
      e.preventDefault()
      select(m.id, true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, sel])

  const lit = new Set(current.keys)

  return (
    <Sheet open={open} onClose={onClose} title="Keyboard shortcuts" wide>
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex min-h-9 flex-wrap items-center justify-between gap-2" aria-live="polite">
            <span className="font-semibold">{current.label}</span>
            <span className="sr-only">: {current.keys.map(keyName).join(' plus ')}</span>
            <span aria-hidden>
              <Combo s={current} />
            </span>
          </div>

          <div className="space-y-1 rounded-2xl border border-n-800 bg-n-950 p-2 sm:space-y-1.5 sm:p-3" aria-hidden>
            {KEYBOARD.map((row, r) => (
              <div key={r} className="flex gap-1 sm:gap-1.5">
                {row.map((k) => {
                  const on = lit.has(k.id)
                  return (
                    <div
                      key={on ? `${k.id}-${beat}` : k.id}
                      style={{ flex: `${k.w ?? 1} 1 0` }}
                      className={`grid h-8 min-w-0 place-items-center overflow-hidden rounded-md border text-xs font-semibold sm:h-10 sm:rounded-lg ${
                        on ? 'animate-press border-accent bg-accent text-on-accent' : 'border-n-800 border-b-n-700 bg-n-900 text-n-400'
                      }`}
                    >
                      <span className="truncate px-0.5">{k.id === 'space' ? '' : keyLabel(k.id)}</span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          <p className="text-xs text-n-400">Pick a shortcut below, or press its keys, to see where they are. Use ↑/↓ to move through the list.</p>
        </div>

        <ul ref={list} className="space-y-4">
          {GROUPS.map((g) => (
            <li key={g}>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-n-400">{g}</h3>
              <ul className="grid gap-1 sm:grid-cols-2">
                {SHORTCUTS.filter((s) => s.group === g).map((s) => (
                  <li key={s.id}>
                    <button
                      data-id={s.id}
                      onClick={() => select(s.id)}
                      onFocus={() => s.id !== sel && select(s.id)}
                      aria-pressed={s.id === sel}
                      aria-label={`${s.label}: ${s.keys.map(keyName).join(' plus ')}${s.where ? `, on ${s.where}` : ''}`}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm ${s.id === sel ? 'bg-n-800 text-n-100' : 'text-n-300 hover:bg-n-800/60'}`}
                    >
                      <span className="min-w-0">
                        {s.label}
                        {s.where && <span className="text-xs text-n-400"> · on {s.where}</span>}
                      </span>
                      <Combo s={s} />
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  )
}
