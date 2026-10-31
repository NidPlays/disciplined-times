import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import type { Goal, LogEntry, Weekday } from './types'

export const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6]
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export const WEEKDAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

export const toKey = (d: Date) => format(d, 'yyyy-MM-dd')
export const fromKey = (k: string) => parseISO(k)

/** Weekdays in display order, honouring the week start setting. */
export function orderedWeekdays(weekStartsOn: 0 | 1): Weekday[] {
  return weekStartsOn === 1 ? [1, 2, 3, 4, 5, 6, 0] : WEEKDAYS
}

export interface PeriodRange {
  start: Date
  end: Date
  /** Total days in the period. */
  days: number
  /** Days left in the period, including `day` itself. */
  daysLeft: number
}

export function periodRange(goal: Pick<Goal, 'period'>, day: Date, weekStartsOn: 0 | 1): PeriodRange {
  let start: Date
  let end: Date
  if (goal.period === 'week') {
    start = startOfWeek(day, { weekStartsOn })
    end = endOfWeek(day, { weekStartsOn })
  } else if (goal.period === 'month') {
    start = startOfMonth(day)
    end = endOfMonth(day)
  } else {
    start = day
    end = day
  }
  return {
    start,
    end,
    days: differenceInCalendarDays(end, start) + 1,
    daysLeft: differenceInCalendarDays(end, day) + 1,
  }
}

/** Is the goal something to show on this calendar day? */
export function isScheduledOn(goal: Goal, day: Date): boolean {
  if (goal.archived) return false
  if (goal.period !== 'day') return true
  return (goal.dayTargets[day.getDay() as Weekday] ?? 0) > 0
}

/** Minutes planned for the period that contains `day`. */
export function targetFor(goal: Goal, day: Date): number {
  if (goal.period === 'day') return goal.dayTargets[day.getDay() as Weekday] ?? 0
  return goal.periodTarget
}

export function minutesBetween(logs: LogEntry[], goalId: string, startKey: string, endKey: string): number {
  let sum = 0
  for (const l of logs) {
    if (l.goalId === goalId && l.date >= startKey && l.date <= endKey) sum += l.minutes
  }
  return Math.max(0, sum)
}

export interface Progress {
  target: number
  done: number
  /** Minutes logged on `day` only (same as `done` for daily goals). */
  doneToday: number
  remaining: number
  ratio: number
  range: PeriodRange
  /** For week/month goals: suggested minutes per remaining day to stay on track. */
  pacePerDay: number
}

export function progressFor(goal: Goal, logs: LogEntry[], day: Date, weekStartsOn: 0 | 1): Progress {
  const range = periodRange(goal, day, weekStartsOn)
  const target = targetFor(goal, day)
  const dayKey = toKey(day)
  const done = minutesBetween(logs, goal.id, toKey(range.start), toKey(range.end))
  const doneBeforeToday = goal.period === 'day' ? 0 : minutesBetween(logs, goal.id, toKey(range.start), toKey(addDays(day, -1)))
  const doneToday = minutesBetween(logs, goal.id, dayKey, dayKey)
  const remaining = Math.max(0, target - done)
  // Pace is computed from what was left at the start of the day, so it doesn't
  // shrink as you log time today.
  const leftAtDayStart = Math.max(0, target - doneBeforeToday)
  const pacePerDay = goal.period === 'day' ? target : Math.ceil(leftAtDayStart / Math.max(1, range.daysLeft))
  return {
    target,
    done,
    doneToday,
    remaining,
    ratio: target > 0 ? Math.min(1, done / target) : 0,
    range,
    pacePerDay,
  }
}

/** Total planned minutes for a goal across a week (used by the week summary). */
export function weeklyPlan(goal: Goal): number {
  if (goal.period === 'day') return WEEKDAYS.reduce<number>((s, d) => s + (goal.dayTargets[d] ?? 0), 0)
  if (goal.period === 'week') return goal.periodTarget
  return Math.round((goal.periodTarget * 7) / 30.4)
}

export function formatMinutes(min: number): string {
  const sign = min < 0 ? '-' : ''
  const m = Math.abs(Math.round(min))
  const h = Math.floor(m / 60)
  const r = m % 60
  if (h === 0) return `${sign}${r}m`
  if (r === 0) return `${sign}${h}h`
  return `${sign}${h}h ${r}m`
}

/** Describe a goal's schedule in a few words, e.g. "Weekdays · 2h" or "10h / week". */
export function describeSchedule(goal: Goal, weekStartsOn: 0 | 1): string {
  if (goal.period === 'week') return `${formatMinutes(goal.periodTarget)} / week`
  if (goal.period === 'month') return `${formatMinutes(goal.periodTarget)} / month`
  const active = orderedWeekdays(weekStartsOn).filter((d) => (goal.dayTargets[d] ?? 0) > 0)
  if (active.length === 0) return 'Not scheduled'
  const values = new Set(active.map((d) => goal.dayTargets[d]))
  const same = values.size === 1
  const amount = same ? ` · ${formatMinutes(goal.dayTargets[active[0]]!)}` : ` · ${formatMinutes(weeklyPlan(goal))}/wk`
  const key = [...active].sort().join('')
  const label =
    key === '0123456' ? 'Every day' : key === '12345' ? 'Weekdays' : key === '06' ? 'Weekends' : active.map((d) => WEEKDAY_SHORT[d]).join(', ')
  return label + amount
}
