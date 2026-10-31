import { addDays, addWeeks, format, isToday, startOfWeek } from 'date-fns'
import { useRef, useState } from 'react'
import { formatMinutes, isScheduledOn, minutesBetween, targetFor, toKey, weeklyPlan } from '../lib/schedule'
import { useStore } from '../lib/store'
import { Chevron } from './Today'

export function Week({ onPickDay }: { onPickDay: (d: Date) => void }) {
  const { goals, logs, settings } = useStore()
  const [anchor, setAnchor] = useState(() => new Date())
  const start = startOfWeek(anchor, { weekStartsOn: settings.weekStartsOn })
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const startKey = toKey(days[0])
  const endKey = toKey(days[6])
  const active = goals.filter((g) => !g.archived)

  const perDay = days.map((d) => {
    const k = toKey(d)
    let done = 0
    let plan = 0
    for (const g of active) {
      done += minutesBetween(logs, g.id, k, k)
      if (g.period === 'day' && isScheduledOn(g, d)) plan += targetFor(g, d)
    }
    return { d, done, plan }
  })
  const max = Math.max(60, ...perDay.map((x) => Math.max(x.done, x.plan)))
  const totalDone = perDay.reduce((s, x) => s + x.done, 0)
  const totalPlan = active.reduce((s, g) => s + weeklyPlan(g), 0)

  // Horizontal swipe on the chart: swipe left → next week, swipe right → previous week.
  const touch = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touch.current = { x: t.clientX, y: t.clientY }
    swiped.current = false
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current
    touch.current = null
    if (!s) return
    const t = e.changedTouches[0]
    const dx = t.clientX - s.x
    const dy = t.clientY - s.y
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    swiped.current = true
    setAnchor((a) => addWeeks(a, dx < 0 ? 1 : -1))
  }
  // Swallow the tap that would otherwise open a day after a swipe ends on a bar.
  const onClickCapture = (e: React.MouseEvent) => {
    if (swiped.current) {
      swiped.current = false
      e.stopPropagation()
      e.preventDefault()
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between md:justify-center md:gap-8">
        <button onClick={() => setAnchor(addWeeks(anchor, -1))} className="rounded-full p-2 text-n-400 hover:bg-n-800" aria-label="Previous week">
          <Chevron dir="left" />
        </button>
        <button onClick={() => setAnchor(new Date())} className="text-center">
          <div className="text-2xl font-bold">Week</div>
          <div className="text-sm text-n-400">
            {format(days[0], 'd MMM')} – {format(days[6], 'd MMM')}
          </div>
        </button>
        <button onClick={() => setAnchor(addWeeks(anchor, 1))} className="rounded-full p-2 text-n-400 hover:bg-n-800" aria-label="Next week">
          <Chevron dir="right" />
        </button>
      </header>

      <div className="space-y-5 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-6 lg:space-y-0">
      <section
        className="touch-pan-y select-none rounded-3xl border border-n-800 bg-n-900 p-4 lg:sticky lg:top-8"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={() => (touch.current = null)}
        onClickCapture={onClickCapture}
      >
        <div className="mb-4 flex items-baseline justify-between">
          <span className="text-sm text-n-400">Logged this week</span>
          <span className="font-semibold tabular-nums">
            {formatMinutes(totalDone)} <span className="text-n-500">/ {formatMinutes(totalPlan)}</span>
          </span>
        </div>
        <div className="flex h-36 items-end gap-2 lg:h-56">
          {perDay.map(({ d, done, plan }) => (
            <button key={d.toISOString()} onClick={() => onPickDay(d)} className="flex h-full flex-1 flex-col items-center gap-1" aria-label={`${format(d, 'EEEE')}: ${formatMinutes(done)} logged`}>
              <div className="relative w-full flex-1">
                {plan > 0 && <div className="absolute inset-x-0 bottom-0 rounded-lg border border-dashed border-n-600" style={{ height: `${(plan / max) * 100}%` }} />}
                <div className="absolute inset-x-1 bottom-0 rounded-lg bg-accent transition-all" style={{ height: `${(done / max) * 100}%` }} />
              </div>
              <span className={`text-xs ${isToday(d) ? 'font-bold text-accent-fg' : 'text-n-500'}`}>{format(d, 'EEEEE')}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-n-500">Dashed outline = daily-goal plan. Tap a day to open it, swipe to change week.</p>
      </section>

      <section className="space-y-2">
        {active.length === 0 && <p className="text-center text-n-500">No goals yet.</p>}
        {active.map((g) => {
          const done = minutesBetween(logs, g.id, startKey, endKey)
          const plan = weeklyPlan(g)
          const ratio = plan > 0 ? Math.min(1, done / plan) : 0
          return (
            <div key={g.id} className="rounded-2xl bg-n-900 p-3">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="truncate font-medium">
                  {g.emoji} {g.name}
                </span>
                <span className="shrink-0 tabular-nums text-n-400">
                  {formatMinutes(done)} / {formatMinutes(plan)}
                  {g.period === 'month' && <span className="text-n-500"> (≈wk)</span>}
                </span>
              </div>
              <div className="flex gap-1">
                {days.map((d) => {
                  const k = toKey(d)
                  const m = minutesBetween(logs, g.id, k, k)
                  const t = g.period === 'day' ? targetFor(g, d) : 0
                  const scheduled = g.period !== 'day' || t > 0
                  const op = t > 0 ? Math.min(1, m / t) : m > 0 ? 1 : 0
                  return (
                    <div
                      key={k}
                      title={`${format(d, 'EEE')}: ${formatMinutes(m)}${t ? ` / ${formatMinutes(t)}` : ''}`}
                      className={`h-6 flex-1 rounded-md ${scheduled ? 'bg-n-800' : 'bg-n-900 outline outline-1 outline-n-800'}`}
                      style={op > 0 ? { background: g.color, opacity: 0.25 + op * 0.75 } : undefined}
                    />
                  )
                })}
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-n-800">
                <div className="h-full rounded-full" style={{ width: `${ratio * 100}%`, background: g.color }} />
              </div>
            </div>
          )
        })}
      </section>
      </div>
    </div>
  )
}
