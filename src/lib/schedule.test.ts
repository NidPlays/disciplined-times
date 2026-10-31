import { describe, expect, test } from 'bun:test'
import { describeSchedule, formatMinutes, isScheduledOn, progressFor, weeklyPlan } from './schedule'
import type { Goal, LogEntry } from './types'

const base: Goal = {
  id: 'g',
  name: 'Read',
  emoji: '📚',
  color: '#fff',
  period: 'day',
  dayTargets: { 1: 60, 2: 60, 3: 60, 4: 60, 5: 60 },
  periodTarget: 600,
  step: 30,
  createdAt: 0,
  archived: false,
}
const log = (date: string, minutes: number, goalId = 'g'): LogEntry => ({ id: date + minutes, goalId, date, minutes, at: 0 })

// 2026-11-02 is a Monday.
const mon = new Date(2026, 10, 2)
const wed = new Date(2026, 10, 4)
const sat = new Date(2026, 10, 7)

describe('scheduling', () => {
  test('daily goals respect weekdays', () => {
    expect(isScheduledOn(base, mon)).toBe(true)
    expect(isScheduledOn(base, sat)).toBe(false)
    expect(isScheduledOn({ ...base, archived: true }, mon)).toBe(false)
  })

  test('week/month goals show every day', () => {
    expect(isScheduledOn({ ...base, period: 'week' }, sat)).toBe(true)
  })

  test('daily progress counts only that day', () => {
    const p = progressFor(base, [log('2026-11-02', 30), log('2026-11-03', 30)], mon, 1)
    expect(p.done).toBe(30)
    expect(p.remaining).toBe(30)
    expect(p.ratio).toBe(0.5)
  })

  test('weekly progress and pace', () => {
    const g = { ...base, period: 'week' as const, periodTarget: 600 }
    const logs = [log('2026-11-02', 120), log('2026-11-03', 60), log('2026-11-04', 30), log('2026-11-09', 999)]
    const p = progressFor(g, logs, wed, 1)
    expect(p.done).toBe(210)
    expect(p.doneToday).toBe(30)
    expect(p.range.daysLeft).toBe(5) // Wed..Sun
    expect(p.pacePerDay).toBe(84) // (600 - 180) / 5
  })

  test('week start on Sunday changes the window', () => {
    const g = { ...base, period: 'week' as const }
    const p = progressFor(g, [log('2026-11-01', 60)], mon, 0)
    expect(p.done).toBe(60)
    expect(progressFor(g, [log('2026-11-01', 60)], mon, 1).done).toBe(0)
  })

  test('negative corrections never go below zero', () => {
    expect(progressFor(base, [log('2026-11-02', -30)], mon, 1).done).toBe(0)
  })

  test('weekly plan and descriptions', () => {
    expect(weeklyPlan(base)).toBe(300)
    expect(describeSchedule(base, 1)).toBe('Weekdays · 1h')
    expect(describeSchedule({ ...base, dayTargets: { 1: 60, 3: 90 } }, 1)).toBe('Mon, Wed · 2h 30m/wk')
    expect(describeSchedule({ ...base, period: 'month', periodTarget: 1200 }, 1)).toBe('20h / month')
  })

  test('formatMinutes', () => {
    expect(formatMinutes(30)).toBe('30m')
    expect(formatMinutes(60)).toBe('1h')
    expect(formatMinutes(150)).toBe('2h 30m')
    expect(formatMinutes(-30)).toBe('-30m')
  })
})
