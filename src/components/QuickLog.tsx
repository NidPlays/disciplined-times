import { formatMinutes, isScheduledOn, progressFor, toKey } from '../lib/schedule'
import { useStore } from '../lib/store'
import { haptic, useUi } from '../lib/ui'
import { Ring } from './Ring'
import { Sheet } from './Sheet'

/** Opened from the home-screen "+30 min" shortcut: one tap picks the goal. */
export function QuickLog({ open, minutes, onClose }: { open: boolean; minutes: number; onClose: () => void }) {
  const { goals, logs, settings, log, removeLog } = useStore()
  const notify = useUi((s) => s.notify)
  const today = new Date()
  const list = goals.filter((g) => isScheduledOn(g, today))

  return (
    <Sheet open={open} onClose={onClose} title={`Add ${formatMinutes(minutes)} to…`}>
      {list.length === 0 ? (
        <p className="py-6 text-center text-slate-400">No goals scheduled today.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((g) => {
            const p = progressFor(g, logs, today, settings.weekStartsOn)
            return (
              <li key={g.id}>
                <button
                  onClick={() => {
                    const e = log(g.id, minutes, toKey(today))
                    haptic()
                    notify(`+${formatMinutes(minutes)} · ${g.name}`, { label: 'Undo', run: () => removeLog(e.id) })
                    onClose()
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl bg-slate-800 p-3 text-left hover:bg-slate-700"
                >
                  <Ring ratio={p.ratio} color={g.color} size={44} stroke={5}>
                    <span className="text-base">{g.emoji}</span>
                  </Ring>
                  <span className="flex-1 font-medium">{g.name}</span>
                  <span className="text-sm text-slate-400">{formatMinutes(p.remaining)} left</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Sheet>
  )
}
