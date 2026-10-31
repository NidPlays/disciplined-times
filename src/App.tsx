import { useCallback, useEffect, useState } from 'react'
import { GoalEditor } from './components/GoalEditor'
import { Goals } from './components/Goals'
import { QuickLog } from './components/QuickLog'
import { Settings } from './components/Settings'
import { ToastHost } from './components/Toast'
import { Today } from './components/Today'
import { UpdatePrompt } from './components/UpdatePrompt'
import { Week } from './components/Week'
import { formatMinutes, toKey } from './lib/schedule'
import { useStore } from './lib/store'
import type { Goal } from './lib/types'
import { haptic, useUi } from './lib/ui'

type Tab = 'today' | 'week' | 'goals' | 'settings'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: 'M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
  { id: 'week', label: 'Week', icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
  { id: 'goals', label: 'Goals', icon: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' },
  { id: 'settings', label: 'Settings', icon: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('today')
  const [day, setDay] = useState(() => new Date())
  const [editing, setEditing] = useState<{ open: boolean; goal: Goal | null }>({ open: false, goal: null })
  const [quick, setQuick] = useState<{ open: boolean; minutes: number }>({ open: false, minutes: 30 })

  const openNew = useCallback(() => setEditing({ open: true, goal: null }), [])
  const openEdit = useCallback((goal: Goal) => setEditing({ open: true, goal }), [])
  const closeEditor = useCallback(() => setEditing((e) => ({ ...e, open: false })), [])
  const closeQuick = useCallback(() => setQuick((q) => ({ ...q, open: false })), [])

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
    history.replaceState(null, '', location.pathname)
  }, [openNew])

  // Roll over to the new day if the app was left open past midnight.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') setDay((d) => (toKey(d) === toKey(new Date(Date.now() - 6 * 3600e3)) ? new Date() : d))
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col">
      <UpdatePrompt />
      <main className="pt-safe flex-1 px-4 pb-28">
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
        {tab === 'settings' && <Settings />}
      </main>

      {tab === 'today' && (
        <button
          onClick={openNew}
          className="fixed bottom-24 right-[max(1rem,calc(50%-17rem))] z-30 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500 text-3xl font-light text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
          aria-label="New goal"
        >
          +
        </button>
      )}

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto grid max-w-xl grid-cols-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id)
                if (t.id === 'today' && tab === 'today') setDay(new Date())
              }}
              className={`flex flex-col items-center gap-1 py-2 text-[11px] font-medium ${tab === t.id ? 'text-emerald-400' : 'text-slate-500'}`}
              aria-current={tab === t.id ? 'page' : undefined}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={t.icon} />
              </svg>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <GoalEditor open={editing.open} goal={editing.goal} onClose={closeEditor} />
      <QuickLog open={quick.open} minutes={quick.minutes} onClose={closeQuick} />
      <ToastHost />
    </div>
  )
}
