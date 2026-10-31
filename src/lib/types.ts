/** 0 = Sunday … 6 = Saturday (matches Date#getDay). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type Period = 'day' | 'week' | 'month'

export interface Goal {
  id: string
  name: string
  emoji: string
  color: string
  period: Period
  /**
   * For `day` goals: minutes planned per weekday. A weekday that is missing
   * (or 0) means the goal is not scheduled that day.
   */
  dayTargets: Partial<Record<Weekday, number>>
  /** For `week` / `month` goals: minutes planned for the whole period. */
  periodTarget: number
  /** Default amount added by the big "+" button, in minutes. */
  step: number
  createdAt: number
  archived: boolean
}

export interface LogEntry {
  id: string
  goalId: string
  /** Can be negative to correct a mistake. */
  minutes: number
  /** Local calendar day the time counts towards, `yyyy-MM-dd`. */
  date: string
  /** When the entry was recorded (ms since epoch). */
  at: number
}

export interface Settings {
  weekStartsOn: 0 | 1
  quickSteps: number[]
  /** Theme id from src/lib/themes.ts. */
  theme: string
  colorMode: 'system' | 'light' | 'dark'
}
