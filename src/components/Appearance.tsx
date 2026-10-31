import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import { THEMES, resolveMode, themeVars, type ColorMode, type ResolvedMode, type Theme } from '../lib/themes'

const MODES: { id: ColorMode; label: string; icon: string }[] = [
  { id: 'system', label: 'System', icon: 'M3 5h18v11H3zM8 20h8M12 16v4' },
  { id: 'light', label: 'Light', icon: 'M12 3v2M12 19v2M5 5l1.5 1.5M17.5 17.5L19 19M3 12h2M19 12h2M5 19l1.5-1.5M17.5 6.5L19 5M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
  { id: 'dark', label: 'Dark', icon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z' },
]

function useResolvedMode(mode: ColorMode): ResolvedMode {
  const [resolved, setResolved] = useState(() => resolveMode(mode))
  useEffect(() => {
    setResolved(resolveMode(mode))
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const on = () => setResolved(resolveMode(mode))
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [mode])
  return resolved
}

export function Appearance() {
  const { settings, updateSettings } = useStore()
  const resolved = useResolvedMode(settings.colorMode)

  return (
    <section className="space-y-4 rounded-3xl border border-n-800 bg-n-900 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-medium">Appearance</span>
        <div className="flex gap-1 rounded-2xl bg-n-950 p-1" role="radiogroup" aria-label="Colour mode">
          {MODES.map((m) => (
            <button
              key={m.id}
              role="radio"
              aria-checked={settings.colorMode === m.id}
              onClick={() => updateSettings({ colorMode: m.id })}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold ${settings.colorMode === m.id ? 'bg-n-700 text-n-100' : 'text-n-400 hover:text-n-200'}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={m.icon} />
              </svg>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" role="radiogroup" aria-label="Theme">
        {THEMES.map((t) => (
          <ThemeSwatch key={t.id} theme={t} mode={resolved} selected={settings.theme === t.id} onSelect={() => updateSettings({ theme: t.id })} />
        ))}
      </div>
      <p className="text-xs text-n-500">Each theme has a light and a dark version. “System” follows your device setting.</p>
    </section>
  )
}

/** A miniature of the app drawn in the theme's own colours. */
function ThemeSwatch({ theme, mode, selected, onSelect }: { theme: Theme; mode: ResolvedMode; selected: boolean; onSelect: () => void }) {
  const v = themeVars(theme, mode)
  const c = (k: string) => v[`--color-${k}`]
  return (
    <button
      role="radio"
      aria-checked={selected}
      aria-label={`${theme.name} theme`}
      onClick={onSelect}
      className={`overflow-hidden rounded-2xl text-left transition ${selected ? 'ring-2 ring-accent ring-offset-2 ring-offset-n-900' : 'ring-1 ring-n-700 hover:ring-n-500'}`}
    >
      <div className="space-y-1.5 p-2.5" style={{ background: c('n-950') }}>
        <div className="flex items-center gap-2 rounded-lg p-2" style={{ background: c('n-900'), border: `1px solid ${c('n-800')}` }}>
          <div className="h-5 w-5 shrink-0 rounded-full border-[3px]" style={{ borderColor: c('accent') }} />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="h-1.5 w-3/4 rounded-full" style={{ background: c('n-100') }} />
            <div className="h-1.5 w-1/2 rounded-full" style={{ background: c('n-500') }} />
          </div>
          <div className="h-5 w-6 shrink-0 rounded-md" style={{ background: c('accent') }} />
        </div>
        <div className="flex gap-1">
          {['n-800', 'n-700', 'accent'].map((k) => (
            <div key={k} className="h-1.5 flex-1 rounded-full" style={{ background: c(k) }} />
          ))}
        </div>
      </div>
      <div className="bg-n-900 px-2.5 py-2">
        <div className="flex items-center justify-between text-sm font-semibold">
          {theme.name}
          {selected && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent-fg" aria-hidden>
              <path d="M5 12l5 5L20 7" />
            </svg>
          )}
        </div>
        <div className="truncate text-xs text-n-500">{theme.description}</div>
      </div>
    </button>
  )
}
