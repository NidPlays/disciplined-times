import { addDays } from 'date-fns'
import { useCallback, useEffect, useRef, useState } from 'react'
import { GoalEditor } from './components/GoalEditor'
import { Goals } from './components/Goals'
import { Notices } from './components/Notices'
import { Onboarding } from './components/Onboarding'
import { QuickLog } from './components/QuickLog'
import { Settings } from './components/Settings'
import { Shortcuts } from './components/Shortcuts'
import { ToastHost } from './components/Toast'
import { Today } from './components/Today'
import { Week } from './components/Week'
import { firstRun } from './lib/onboarding'
import { formatMinutes, toKey } from './lib/schedule'
import { matchShortcut } from './lib/shortcuts'
import { useStore } from './lib/store'
import { applyTheme } from './lib/themes'
import type { Goal } from './lib/types'
import { haptic, useUi } from './lib/ui'

type Tab = 'today' | 'week' | 'goals' | 'settings'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: 'M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
  { id: 'week', label: 'Week', icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
  { id: 'goals', label: 'Goals', icon: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' },
  { id: 'settings', label: 'Settings', icon: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6' },
]

function tabFromHash(): Tab {
  const h = location.hash.slice(1) as Tab
  return TABS.some((t) => t.id === h) ? h : 'today'
}

export default function App() {
  const [tab, setTab] = useState<Tab>(tabFromHash)
  const tabRef = useRef(tab)
  tabRef.current = tab

  // Keep the tab in the URL hash (#week, #goals…) so browser back/forward and
  // bookmarks work on the website. Hash routing needs no server config on GitHub Pages.
  useEffect(() => {
    const want = tab === 'today' ? '' : `#${tab}`
    if (location.hash !== want) history.pushState(null, '', location.pathname + location.search + want)
  }, [tab])
  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('popstate', onHash)
    window.addEventListener('hashchange', onHash)
    return () => {
      window.removeEventListener('popstate', onHash)
      window.removeEventListener('hashchange', onHash)
    }
  }, [])
  const [day, setDay] = useState(() => new Date())
  const [editing, setEditing] = useState<{ open: boolean; goal: Goal | null }>({ open: false, goal: null })
  const [quick, setQuick] = useState<{ open: boolean; minutes: number }>({ open: false, minutes: 30 })

  const openNew = useCallback(() => setEditing({ open: true, goal: null }), [])
  const openEdit = useCallback((goal: Goal) => setEditing({ open: true, goal }), [])
  const closeEditor = useCallback(() => setEditing((e) => ({ ...e, open: false })), [])
  const closeQuick = useCallback(() => setQuick((q) => ({ ...q, open: false })), [])
  const [tour, setTour] = useState(firstRun)
  const [help, setHelp] = useState(false)
  const closeHelp = useCallback(() => setHelp(false), [])
  const closeTour = useCallback(() => setTour(false), [])
  const openTour = useCallback(() => setTour(true), [])
  // From the tour's last step: land on Settings with the install section in view.
  const showSettings = useCallback(() => {
    setTab('settings')
    requestAnimationFrame(() => document.getElementById('install')?.scrollIntoView({ block: 'start' }))
  }, [])

  // Handle deep links from home-screen shortcuts and copied quick-log links:
  //   /?action=quick-log&minutes=30   → pick a goal, add 30 min
  //   /?log=<goalId>&minutes=30        → add 30 min to that goal immediately
  //   /?action=new-goal | /?tab=week
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (![...params.keys()].length) return
    const minutes = Math.max(1, Math.min(24 * 60, Number(params.get('minutes')) || 30))
    const action = params.get('action')
    const goalId = params.get('log')
    const t = params.get('tab') as Tab | null
    if (t && TABS.some((x) => x.id === t)) setTab(t)
    if (action === 'quick-log') setQuick({ open: true, minutes })
    if (action === 'new-goal') openNew()
    if (goalId) {
      const { goals, log, removeLog } = useStore.getState()
      const g = goals.find((x) => x.id === goalId)
      if (g) {
        const e = log(g.id, minutes, toKey(new Date()))
        haptic()
        useUi.getState().notify(`+${formatMinutes(minutes)} · ${g.name}`, { label: 'Undo', run: () => removeLog(e.id) })
      } else {
        useUi.getState().notify('That goal no longer exists')
      }
    }
    history.replaceState(null, '', location.pathname + location.hash)
  }, [openNew])

  // Apply the theme whenever it changes, and follow the OS setting in "system" mode.
  const theme = useStore((s) => s.settings.theme)
  const colorMode = useStore((s) => s.settings.colorMode)
  useEffect(() => {
    applyTheme(theme, colorMode)
    if (colorMode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => applyTheme(theme, colorMode)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme, colorMode])

  // Roll over to the new day if the app was left open past midnight.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') setDay((d) => (toKey(d) === toKey(new Date(Date.now() - 6 * 3600e3)) ? new Date() : d))
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const go = useCallback((t: Tab) => {
    if (t === tabRef.current && t === 'today') setDay(new Date())
    setTab(t)
  }, [])

  // Desktop keyboard shortcuts, defined in lib/shortcuts.ts (also listed in the ? dialog).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editing.open || quick.open || tour || help) return
      const el = e.target as HTMLElement
      if (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return
      const s = matchShortcut(e)
      if (!s) return
      const onToday = tabRef.current === 'today'
      if (s.id === 'new-goal') openNew()
      else if (s.id.startsWith('tab-')) go(s.id.slice(4) as Tab)
      else if (s.id === 'prev-day' && onToday) setDay((d) => addDays(d, -1))
      else if (s.id === 'next-day' && onToday) setDay((d) => addDays(d, 1))
      else if (s.id === 'today') {
        setTab('today')
        setDay(new Date())
      } else if (s.id === 'help') setHelp(true)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing.open, quick.open, tour, help, openNew, go])

  const navIcon = (d: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  )

  return (
    <div className="min-h-full md:flex">
      <Notices />

      {/* Desktop / tablet sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 border-r border-n-800 bg-n-950 p-4 md:flex lg:w-64">
        <a href={import.meta.env.BASE_URL} className="mb-6 flex items-center gap-3 px-2 py-1" onClick={(e) => (e.preventDefault(), go('today'))}>
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="h-9 w-9" />
          <span className="text-lg font-bold leading-tight">Disciplined Times</span>
        </a>
        {TABS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => go(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${tab === t.id ? 'bg-n-800 text-accent-fg' : 'text-n-400 hover:bg-n-900 hover:text-n-200'}`}
          >
            {navIcon(t.icon)}
            <span className="flex-1 text-left">{t.label}</span>
            <kbd className="text-xs text-n-500">{i + 1}</kbd>
          </button>
        ))}
        <button onClick={openNew} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-accent px-3 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover">
          + New goal <kbd className="rounded border border-current/30 px-1 text-xs">N</kbd>
        </button>
        <button onClick={() => setHelp(true)} className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-n-400 hover:bg-n-900 hover:text-n-200">
          {navIcon('M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM7 10h.01M11 10h.01M15 10h.01M7 14h10')}
          <span className="flex-1 text-left">Keyboard shortcuts</span>
          <kbd className="text-xs text-n-500">?</kbd>
        </button>
      </aside>

      <main className="pt-safe min-w-0 flex-1 px-4 pb-28 md:px-8 md:pt-8 md:pb-12">
        <div className={`mx-auto ${tab === 'settings' ? 'max-w-2xl' : 'max-w-xl md:max-w-5xl'}`}>
          {tab === 'today' && <Today day={day} setDay={setDay} onEdit={openEdit} onNew={openNew} />}
          {tab === 'week' && (
            <Week
              onPickDay={(d) => {
                setDay(d)
                setTab('today')
              }}
            />
          )}
          {tab === 'goals' && <Goals onEdit={openEdit} onNew={openNew} />}
          {tab === 'settings' && <Settings onTour={openTour} />}
        </div>
      </main>

      {tab === 'today' && (
        <button
          onClick={openNew}
          className="fixed bottom-24 right-4 z-30 grid h-14 w-14 place-items-center rounded-2xl bg-accent text-3xl font-light text-on-accent shadow-lg shadow-accent/20 hover:bg-accent-hover md:hidden"
          aria-label="New goal"
        >
          +
        </button>
      )}

      {/* Phone bottom navigation */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-n-800 bg-n-950/90 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => go(t.id)}
              className={`flex flex-col items-center gap-1 py-2 text-xs font-medium ${tab === t.id ? 'text-accent-fg' : 'text-n-500'}`}
              aria-current={tab === t.id ? 'page' : undefined}
            >
              {navIcon(t.icon)}
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <GoalEditor open={editing.open} goal={editing.goal} onClose={closeEditor} />
      <QuickLog open={quick.open} minutes={quick.minutes} onClose={closeQuick} />
      <Shortcuts open={help} onClose={closeHelp} />
      <Onboarding open={tour} onClose={closeTour} onNewGoal={openNew} onSettings={showSettings} />
      <ToastHost />
    </div>
  )
}
