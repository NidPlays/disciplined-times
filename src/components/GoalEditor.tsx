import { useState } from 'react'
import { GOAL_COLORS, useStore, type GoalDraft } from '../lib/store'
import { describeSchedule, formatMinutes, orderedWeekdays, WEEKDAY_LETTER, WEEKDAY_SHORT, weeklyPlan } from '../lib/schedule'
import type { Goal, Period, Weekday } from '../lib/types'
import { useUi } from '../lib/ui'
import { Sheet } from './Sheet'
import { Stepper } from './Stepper'

const EMOJIS = ['📚', '💻', '🏃', '🧘', '🎸', '✍️', '🧠', '🗣️', '🎨', '🏋️', '🧹', '🌱']

const PRESETS: { label: string; days: Weekday[] }[] = [
  { label: 'Every day', days: [0, 1, 2, 3, 4, 5, 6] },
  { label: 'Weekdays', days: [1, 2, 3, 4, 5] },
  { label: 'Weekends', days: [0, 6] },
]

const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)]

function blankDraft(): GoalDraft {
  return {
    name: '',
    emoji: pick(EMOJIS),
    color: pick(GOAL_COLORS),
    period: 'day',
    dayTargets: { 1: 60, 2: 60, 3: 60, 4: 60, 5: 60 },
    periodTarget: 10 * 60,
    step: 30,
  }
}

interface Props {
  open: boolean
  goal: Goal | null
  onClose: () => void
}

export function GoalEditor({ open, goal, onClose }: Props) {
  // Remount the form whenever the target changes so state starts fresh.
  return (
    <Sheet open={open} onClose={onClose} title={goal ? 'Edit goal' : 'New goal'}>
      {open && <GoalForm key={goal?.id ?? 'new'} goal={goal} onDone={onClose} />}
    </Sheet>
  )
}

function GoalForm({ goal, onDone }: { goal: Goal | null; onDone: () => void }) {
  const { addGoal, updateGoal, deleteGoal, settings } = useStore()
  const notify = useUi((s) => s.notify)
  const [d, setD] = useState<GoalDraft>(() => (goal ? { ...goal, dayTargets: { ...goal.dayTargets } } : blankDraft()))
  const set = <K extends keyof GoalDraft>(k: K, v: GoalDraft[K]) => setD((p) => ({ ...p, [k]: v }))

  const days = orderedWeekdays(settings.weekStartsOn)
  const active = days.filter((w) => (d.dayTargets[w] ?? 0) > 0)
  const firstValue = active.length ? d.dayTargets[active[0]]! : 60
  const uniform = active.every((w) => d.dayTargets[w] === firstValue)
  const [perDay, setPerDay] = useState(!uniform)

  const toggleDay = (w: Weekday) => {
    const next = { ...d.dayTargets }
    if ((next[w] ?? 0) > 0) delete next[w]
    else next[w] = firstValue
    set('dayTargets', next)
  }
  const applyPreset = (ds: Weekday[]) => set('dayTargets', Object.fromEntries(ds.map((w) => [w, firstValue])))
  const setAll = (v: number) => set('dayTargets', Object.fromEntries(active.map((w) => [w, v])))
  const setOne = (w: Weekday, v: number) => {
    const next = { ...d.dayTargets }
    if (v > 0) next[w] = v
    else delete next[w]
    set('dayTargets', next)
  }

  const valid = d.name.trim().length > 0 && (d.period === 'day' ? active.length > 0 : d.periodTarget > 0)

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    const draft = { ...d, name: d.name.trim() }
    if (goal) updateGoal(goal.id, draft)
    else addGoal(draft)
    notify(goal ? 'Goal updated' : `“${draft.name}” added`)
    onDone()
  }

  const label = 'mb-2 block text-xs font-semibold uppercase tracking-wider text-n-400'
  const chip = (on: boolean) =>
    `rounded-full px-3 py-1.5 text-sm font-medium transition ${on ? 'bg-accent text-on-accent' : 'bg-n-800 text-n-300 hover:bg-n-700'}`

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: d.color + '33' }}>
          {d.emoji}
        </div>
        <input
          autoFocus={!goal}
          value={d.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Deep work, Guitar, Reading"
          maxLength={60}
          className="min-w-0 flex-1 rounded-2xl border border-n-700 bg-n-950 px-4 text-base outline-none focus:border-accent"
        />
      </div>

      <div>
        <span className={label}>Icon & colour</span>
        <div className="flex flex-wrap gap-1.5">
          {EMOJIS.map((e) => (
            <button type="button" key={e} onClick={() => set('emoji', e)} className={`grid h-10 w-10 place-items-center rounded-xl text-xl ${d.emoji === e ? 'bg-n-700 ring-2 ring-accent' : 'bg-n-800'}`}>
              {e}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {GOAL_COLORS.map((c) => (
            <button
              type="button"
              key={c}
              aria-label={`Colour ${c}`}
              onClick={() => set('color', c)}
              className={`h-8 w-8 rounded-full ${d.color === c ? 'ring-2 ring-n-100 ring-offset-2 ring-offset-n-900' : ''}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      <div>
        <span className={label}>Plan time per</span>
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-n-950 p-1">
          {(['day', 'week', 'month'] as Period[]).map((p) => (
            <button type="button" key={p} onClick={() => set('period', p)} className={`rounded-xl py-2 text-sm font-semibold capitalize ${d.period === p ? 'bg-n-700 text-n-100' : 'text-n-400'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {d.period === 'day' ? (
        <div className="space-y-4">
          <div>
            <span className={label}>Repeat on</span>
            <div className="mb-3 flex flex-wrap gap-2">
              {PRESETS.map((p) => {
                const on = p.days.length === active.length && p.days.every((w) => active.includes(w))
                return (
                  <button type="button" key={p.label} className={chip(on)} onClick={() => applyPreset(p.days)}>
                    {p.label}
                  </button>
                )
              })}
            </div>
            <div className="flex justify-between gap-1">
              {days.map((w) => {
                const on = (d.dayTargets[w] ?? 0) > 0
                return (
                  <button
                    type="button"
                    key={w}
                    onClick={() => toggleDay(w)}
                    aria-pressed={on}
                    aria-label={WEEKDAY_SHORT[w]}
                    className={`h-10 flex-1 rounded-xl text-sm font-bold ${on ? 'text-on-goal' : 'bg-n-800 text-n-400'}`}
                    style={on ? { background: d.color } : undefined}
                  >
                    {WEEKDAY_LETTER[w]}
                  </button>
                )
              })}
            </div>
          </div>

          {active.length > 0 && (
            <div className="rounded-2xl bg-n-950 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">Hours per day</span>
                <label className="flex items-center gap-2 text-sm text-n-400">
                  <input type="checkbox" checked={perDay} onChange={(e) => {
                    setPerDay(e.target.checked)
                    if (!e.target.checked) setAll(firstValue)
                  }} className="accent-accent" />
                  Different per day
                </label>
              </div>
              {perDay ? (
                <div className="space-y-2">
                  {active.map((w) => (
                    <div key={w} className="flex items-center justify-between">
                      <span className="text-sm text-n-300">{WEEKDAY_SHORT[w]}</span>
                      <Stepper value={d.dayTargets[w] ?? 0} onChange={(v) => setOne(w, v)} max={24 * 60} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-n-300">Each day</span>
                  <Stepper value={firstValue} min={15} step={15} onChange={setAll} max={24 * 60} />
                </div>
              )}
              <p className="mt-3 text-xs text-n-500">≈ {formatMinutes(weeklyPlan({ ...d } as Goal))} per week</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-2xl bg-n-950 p-4">
          <span className="text-sm font-medium">Total per {d.period}</span>
          <Stepper value={d.periodTarget} min={30} step={d.period === 'week' ? 30 : 60} onChange={(v) => set('periodTarget', v)} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <span className="block text-sm font-medium">Tap to log</span>
          <span className="text-xs text-n-500">Amount the big + button adds</span>
        </div>
        <Stepper value={d.step} min={5} step={5} max={240} onChange={(v) => set('step', v)} />
      </div>

      <p className="text-center text-sm text-n-500">{valid ? describeSchedule({ ...d } as Goal, settings.weekStartsOn) : 'Add a name and a schedule'}</p>

      <div className="flex gap-3">
        {goal && (
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete “${goal.name}” and all its logged time?`)) {
                deleteGoal(goal.id)
                notify('Goal deleted')
                onDone()
              }
            }}
            className="rounded-2xl px-4 py-3 font-semibold text-danger hover:bg-danger/10"
          >
            Delete
          </button>
        )}
        <button type="submit" disabled={!valid} className="flex-1 rounded-2xl bg-accent py-3 font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-40">
          {goal ? 'Save' : 'Create goal'}
        </button>
      </div>
    </form>
  )
}
