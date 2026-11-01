import { useMemo, useState } from 'react'
import { formatMinutes, orderedWeekdays, progressFor, toKey, WEEKDAY_LETTER } from '../lib/schedule'
import { GOAL_COLORS, useStore } from '../lib/store'
import type { Goal, LogEntry } from '../lib/types'
import { GoalCard } from './GoalCard'

// A pretend goal for the tour. It never touches the store, so trying things here
// doesn't leave sample data behind.
const SAMPLE: Goal = {
  id: 'tour-sample',
  name: 'Reading',
  emoji: '📚',
  color: GOAL_COLORS[1],
  period: 'day',
  dayTargets: { 0: 60, 1: 60, 2: 60, 3: 60, 4: 60, 5: 60, 6: 60 },
  periodTarget: 0,
  step: 30,
  createdAt: 0,
  archived: false,
}

const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-n-400'

/** A read-only picture of the goal editor, filled in with the sample goal. */
export function CreateGoalDemo() {
  const weekStartsOn = useStore((s) => s.settings.weekStartsOn)
  const days = orderedWeekdays(weekStartsOn)
  return (
    <figure className="space-y-3 rounded-3xl border border-n-800 bg-n-900 p-4" aria-label="Example: a Reading goal of 1 hour on weekdays, logged 30 minutes at a time">
      <div className="flex items-center gap-3 rounded-2xl bg-n-950 px-3 py-2.5">
        <span className="text-xl" aria-hidden>
          {SAMPLE.emoji}
        </span>
        <span className="font-medium">{SAMPLE.name}</span>
        <span className="ml-auto flex gap-1" aria-hidden>
          {GOAL_COLORS.slice(0, 4).map((c) => (
            <span key={c} className={`h-4 w-4 rounded-full ${c === SAMPLE.color ? 'ring-2 ring-n-100 ring-offset-2 ring-offset-n-950' : ''}`} style={{ background: c }} />
          ))}
        </span>
      </div>
      <div>
        <span className={label}>Plan time per</span>
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-n-950 p-1 text-center text-sm font-semibold">
          {['Day', 'Week', 'Month'].map((p) => (
            <span key={p} className={`rounded-xl py-1.5 ${p === 'Day' ? 'bg-n-700 text-n-100' : 'text-n-400'}`}>
              {p}
            </span>
          ))}
        </div>
      </div>
      <div>
        <span className={label}>Repeat on · 1h each</span>
        <div className="flex gap-1.5">
          {days.map((w) => {
            const on = w >= 1 && w <= 5
            return (
              <span key={w} className={`grid h-8 flex-1 place-items-center rounded-lg text-xs font-bold ${on ? 'text-on-goal' : 'bg-n-800 text-n-400'}`} style={on ? { background: SAMPLE.color } : undefined}>
                {WEEKDAY_LETTER[w]}
              </span>
            )
          })}
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-n-300">Each tap of the button adds</span>
        <span className="font-semibold">{formatMinutes(SAMPLE.step)}</span>
      </div>
    </figure>
  )
}

/** The real goal card wired to throwaway logs, so people can try logging time. */
export function LogTimeDemo() {
  const weekStartsOn = useStore((s) => s.settings.weekStartsOn)
  const quickSteps = useStore((s) => s.settings.quickSteps)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [hint, setHint] = useState(false)
  const today = useMemo(() => new Date(), [])
  const progress = progressFor(SAMPLE, logs, today, weekStartsOn)

  const log = (minutes: number) => setLogs((l) => [...l, { id: String(l.length), goalId: SAMPLE.id, minutes, date: toKey(today), at: Date.now() }])

  return (
    <div className="space-y-2">
      <GoalCard goal={SAMPLE} progress={progress} quickSteps={quickSteps} onLog={log} onOpen={() => setHint(true)} />
      <p className="min-h-5 text-center text-xs text-n-400" aria-live="polite">
        {hint
          ? 'In the app, tapping a goal opens it for editing.'
          : progress.ratio >= 1
            ? 'Goal done for today. Try “Other amount” → −30 min to undo.'
            : progress.done > 0
              ? `${formatMinutes(progress.done)} logged. The ring fills as you go.`
              : 'Try it: this is just a sample, nothing is saved.'}
      </p>
    </div>
  )
}

const WEEK_SAMPLE = [60, 45, 75, 30, 60, 20, 0]

/** A small, static version of the Week chart. */
export function WeekDemo() {
  const weekStartsOn = useStore((s) => s.settings.weekStartsOn)
  const days = orderedWeekdays(weekStartsOn)
  return (
    <figure className="rounded-3xl border border-n-800 bg-n-900 p-4" aria-label="Example week chart: a bar per day showing time logged against the plan">
      <div className="flex h-28 items-end gap-2" aria-hidden>
        {days.map((w, i) => {
          const done = WEEK_SAMPLE[i]
          const planned = i < 5 ? 60 : 0
          return (
            <div key={w} className="flex h-full flex-1 flex-col items-center gap-1">
              <div className="relative w-full flex-1">
                {planned > 0 && <div className="absolute inset-x-0 bottom-0 rounded-md border border-dashed border-n-600" style={{ height: `${(planned / 80) * 100}%` }} />}
                <div className="absolute inset-x-1 bottom-0 rounded-md bg-accent" style={{ height: `${(done / 80) * 100}%` }} />
              </div>
              <span className="text-xs text-n-400">{WEEKDAY_LETTER[w]}</span>
            </div>
          )
        })}
      </div>
    </figure>
  )
}
