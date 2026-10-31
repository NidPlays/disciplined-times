import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Goal, LogEntry, Settings } from './types'

export const GOAL_COLORS = ['#34d399', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa', '#f87171', '#22d3ee', '#a3e635']

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36))

export type GoalDraft = Omit<Goal, 'id' | 'createdAt' | 'archived'>

interface State {
  goals: Goal[]
  logs: LogEntry[]
  settings: Settings
  addGoal: (draft: GoalDraft) => Goal
  updateGoal: (id: string, patch: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  reorderGoal: (id: string, dir: -1 | 1) => void
  log: (goalId: string, minutes: number, date: string) => LogEntry
  removeLog: (id: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  importData: (data: ExportShape) => void
  reset: () => void
}

export interface ExportShape {
  version: 1
  goals: Goal[]
  logs: LogEntry[]
  settings: Settings
}

const defaultSettings: Settings = { weekStartsOn: 1, quickSteps: [15, 30, 60] }

export const useStore = create<State>()(
  persist(
    (set) => ({
      goals: [],
      logs: [],
      settings: defaultSettings,
      addGoal: (draft) => {
        const goal: Goal = { ...draft, id: uid(), createdAt: Date.now(), archived: false }
        set((s) => ({ goals: [...s.goals, goal] }))
        return goal
      },
      updateGoal: (id, patch) => set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id), logs: s.logs.filter((l) => l.goalId !== id) })),
      reorderGoal: (id, dir) =>
        set((s) => {
          const i = s.goals.findIndex((g) => g.id === id)
          const j = i + dir
          if (i < 0 || j < 0 || j >= s.goals.length) return s
          const goals = [...s.goals]
          ;[goals[i], goals[j]] = [goals[j], goals[i]]
          return { goals }
        }),
      log: (goalId, minutes, date) => {
        const entry: LogEntry = { id: uid(), goalId, minutes, date, at: Date.now() }
        set((s) => ({ logs: [...s.logs, entry] }))
        return entry
      },
      removeLog: (id) => set((s) => ({ logs: s.logs.filter((l) => l.id !== id) })),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      importData: (data) => set({ goals: data.goals, logs: data.logs, settings: { ...defaultSettings, ...data.settings } }),
      reset: () => set({ goals: [], logs: [], settings: defaultSettings }),
    }),
    {
      name: 'disciplined-times',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ goals: s.goals, logs: s.logs, settings: s.settings }),
    },
  ),
)

export function exportData(): ExportShape {
  const { goals, logs, settings } = useStore.getState()
  return { version: 1, goals, logs, settings }
}

export function isExportShape(x: unknown): x is ExportShape {
  const o = x as ExportShape
  return !!o && o.version === 1 && Array.isArray(o.goals) && Array.isArray(o.logs) && typeof o.settings === 'object'
}
