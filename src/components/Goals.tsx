import { describeSchedule, formatMinutes, weeklyPlan } from '../lib/schedule'
import { useStore } from '../lib/store'
import type { Goal } from '../lib/types'
import { useUi } from '../lib/ui'

export function Goals({ onEdit, onNew }: { onEdit: (g: Goal) => void; onNew: () => void }) {
  const { goals, settings, updateGoal, reorderGoal } = useStore()
  const notify = useUi((s) => s.notify)
  const active = goals.filter((g) => !g.archived)
  const archived = goals.filter((g) => g.archived)

  const copyLink = async (g: Goal) => {
    const url = new URL(`?log=${g.id}&minutes=${g.step}`, location.origin + import.meta.env.BASE_URL).href
    try {
      await navigator.clipboard.writeText(url)
      notify('Quick-log link copied')
    } catch {
      prompt('Quick-log link', url)
    }
  }

  const row = (g: Goal, i: number, list: Goal[]) => (
    <li key={g.id} className="flex items-center gap-3 rounded-2xl bg-n-900 p-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl" style={{ background: g.color + '33' }}>
        {g.emoji}
      </div>
      <button onClick={() => onEdit(g)} className="min-w-0 flex-1 text-left">
        <div className="truncate font-medium">{g.name}</div>
        <div className="truncate text-xs text-n-400">{describeSchedule(g, settings.weekStartsOn)}</div>
      </button>
      {!g.archived && (
        <div className="flex shrink-0 items-center">
          <IconBtn label="Move up" disabled={i === 0} onClick={() => reorderGoal(g.id, -1)} d="M18 15l-6-6-6 6" />
          <IconBtn label="Move down" disabled={i === list.length - 1} onClick={() => reorderGoal(g.id, 1)} d="M6 9l6 6 6-6" />
          <IconBtn label="Copy quick-log link" onClick={() => copyLink(g)} d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
        </div>
      )}
      <button onClick={() => updateGoal(g.id, { archived: !g.archived })} className="shrink-0 rounded-lg px-2 py-1 text-xs text-n-400 hover:bg-n-800">
        {g.archived ? 'Restore' : 'Archive'}
      </button>
    </li>
  )

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Goals</h1>
          <p className="text-sm text-n-400">{formatMinutes(active.reduce((s, g) => s + weeklyPlan(g), 0))} planned per week</p>
        </div>
        <button onClick={onNew} className="rounded-2xl bg-accent px-4 py-2 font-semibold text-on-accent hover:bg-accent-hover">
          + New
        </button>
      </header>
      {active.length === 0 && <p className="py-8 text-center text-n-500">No active goals.</p>}
      <ul className="grid gap-2 lg:grid-cols-2">{active.map((g, i) => row(g, i, active))}</ul>
      {archived.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-n-500">Archived ({archived.length})</summary>
          <ul className="mt-2 grid gap-2 lg:grid-cols-2">{archived.map((g, i) => row(g, i, archived))}</ul>
        </details>
      )}
    </div>
  )
}

function IconBtn({ label, d, onClick, disabled }: { label: string; d: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} title={label} className="rounded-lg p-1.5 text-n-400 hover:bg-n-800 disabled:opacity-20">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
    </button>
  )
}
