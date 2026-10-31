import { addDays, format, isToday, isYesterday, isTomorrow } from 'date-fns'
import { useMemo } from 'react'
import { formatMinutes, isScheduledOn, progressFor, toKey } from '../lib/schedule'
import { useStore } from '../lib/store'
import { haptic, useUi } from '../lib/ui'
import { GoalCard } from './GoalCard'
import type { Goal } from '../lib/types'

interface Props {
  day: Date
  setDay: (d: Date) => void
  onEdit: (g: Goal) => void
  onNew: () => void
}

export function dayLabel(d: Date) {
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'EEEE')
}

export function Today({ day, setDay, onEdit, onNew }: Props) {
  const { goals, logs, settings, log, removeLog } = useStore()
  const notify = useUi((s) => s.notify)

  const items = useMemo(
    () =>
      goals
        .filter((g) => isScheduledOn(g, day))
        .map((g) => ({ goal: g, progress: progressFor(g, logs, day, settings.weekStartsOn) })),
    [goals, logs, day, settings.weekStartsOn],
  )

  const daily = items.filter((i) => i.goal.period === 'day')
  const planned = daily.reduce((s, i) => s + i.progress.target, 0) + items.filter((i) => i.goal.period !== 'day').reduce((s, i) => s + i.progress.pacePerDay, 0)
  const doneToday = items.reduce((s, i) => s + i.progress.doneToday, 0)
  const completed = items.filter((i) => i.progress.ratio >= 1).length

  const handleLog = (g: Goal, minutes: number) => {
    const entry = log(g.id, minutes, toKey(day))
    haptic()
    notify(`${minutes > 0 ? '+' : ''}${formatMinutes(minutes)} · ${g.name}`, { label: 'Undo', run: () => removeLog(entry.id) })
  }

  const hidden = goals.filter((g) => !g.archived && !isScheduledOn(g, day))

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between md:justify-center md:gap-8">
        <button onClick={() => setDay(addDays(day, -1))} className="rounded-full p-2 text-slate-400 hover:bg-slate-800" aria-label="Previous day">
          <Chevron dir="left" />
        </button>
        <button onClick={() => setDay(new Date())} className="text-center">
          <div className="text-2xl font-bold">{dayLabel(day)}</div>
          <div className="text-sm text-slate-400">{format(day, 'EEE, d MMM yyyy')}</div>
        </button>
        <button onClick={() => setDay(addDays(day, 1))} className="rounded-full p-2 text-slate-400 hover:bg-slate-800" aria-label="Next day">
          <Chevron dir="right" />
        </button>
      </header>

      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-center md:gap-4">
          <Stat label="Logged" value={formatMinutes(doneToday)} />
          <Stat label="Planned" value={formatMinutes(planned)} />
          <Stat label="Goals done" value={`${completed}/${items.length}`} />
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-700 p-8 text-center">
          <div className="mb-2 text-4xl">🌤️</div>
          <p className="mb-4 text-slate-400">{goals.length === 0 ? 'No goals yet. Create one to start planning your hours.' : 'Nothing scheduled for this day.'}</p>
          <button onClick={onNew} className="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400">
            Create a goal
          </button>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map(({ goal, progress }) => (
            <GoalCard key={goal.id} goal={goal} progress={progress} quickSteps={settings.quickSteps} onLog={(m) => handleLog(goal, m)} onOpen={() => onEdit(goal)} />
          ))}
        </div>
      )}

      {hidden.length > 0 && items.length > 0 && (
        <p className="text-center text-xs text-slate-500">
          Not scheduled today: {hidden.map((g) => `${g.emoji} ${g.name}`).join(', ')}
        </p>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-900 px-2 py-3">
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  )
}

export function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
    </svg>
  )
}
