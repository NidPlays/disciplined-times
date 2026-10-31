import { useState } from 'react'
import { formatMinutes, type Progress } from '../lib/schedule'
import type { Goal } from '../lib/types'
import { Ring } from './Ring'

interface Props {
  goal: Goal
  progress: Progress
  quickSteps: number[]
  onLog: (minutes: number) => void
  onOpen: () => void
}

export function GoalCard({ goal, progress: p, quickSteps, onLog, onOpen }: Props) {
  const [more, setMore] = useState(false)
  const [bump, setBump] = useState(0)
  const done = p.ratio >= 1

  const subtitle =
    goal.period === 'day'
      ? done
        ? `Done · ${formatMinutes(p.done)} of ${formatMinutes(p.target)}`
        : `${formatMinutes(p.remaining)} left of ${formatMinutes(p.target)}`
      : done
        ? `Done for the ${goal.period} · ${formatMinutes(p.done)}`
        : `${formatMinutes(p.done)} / ${formatMinutes(p.target)} this ${goal.period} · aim ${formatMinutes(p.pacePerDay)} today`

  const log = (m: number) => {
    onLog(m)
    setBump((b) => b + 1)
  }

  return (
    <div className="rounded-3xl border border-n-800 bg-n-900 p-4">
      <div className="flex items-center gap-4">
        <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-4 text-left" aria-label={`Edit ${goal.name}`}>
          <Ring ratio={p.ratio} color={goal.color}>
            {goal.emoji}
          </Ring>
          <div className="min-w-0">
            <div className="truncate font-semibold">{goal.name}</div>
            <div className={`text-sm ${done ? 'text-success' : 'text-n-400'}`}>{subtitle}</div>
            {goal.period !== 'day' && p.doneToday > 0 && <div className="text-xs text-n-500">{formatMinutes(p.doneToday)} today</div>}
          </div>
        </button>
        <button
          key={bump}
          onClick={() => log(goal.step)}
          onContextMenu={(e) => {
            e.preventDefault()
            setMore((m) => !m)
          }}
          className={`${bump ? 'animate-pop' : ''} flex h-14 min-w-14 shrink-0 flex-col items-center justify-center rounded-2xl px-3 font-bold text-on-goal active:brightness-90`}
          style={{ background: goal.color }}
          aria-label={`Add ${formatMinutes(goal.step)} to ${goal.name}`}
        >
          <span className="text-lg leading-none">+{goal.step < 60 ? goal.step : goal.step / 60}</span>
          <span className="text-[10px] uppercase leading-none opacity-70">{goal.step < 60 ? 'min' : goal.step === 60 ? 'hour' : 'hours'}</span>
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button onClick={() => setMore((m) => !m)} className="text-xs font-medium text-n-500 hover:text-n-300" aria-expanded={more}>
          {more ? 'Less' : 'Other amount'}
        </button>
        {more && (
          <div className="animate-fade flex flex-wrap gap-2">
            {[-goal.step, ...quickSteps.filter((s) => s !== goal.step)].map((m) => (
              <button
                key={m}
                onClick={() => log(m)}
                disabled={m < 0 && p.doneToday <= 0}
                className="rounded-full bg-n-800 px-3 py-1 text-xs font-semibold text-n-200 hover:bg-n-700 disabled:opacity-30"
              >
                {m > 0 ? '+' : ''}
                {formatMinutes(m)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
