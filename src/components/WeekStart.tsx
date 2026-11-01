import { useStore } from '../lib/store'

export function WeekStart() {
  const weekStartsOn = useStore((s) => s.settings.weekStartsOn)
  const updateSettings = useStore((s) => s.updateSettings)
  const seg = (on: boolean) => `rounded-xl px-3 py-1.5 text-sm font-semibold ${on ? 'bg-n-700 text-n-100' : 'text-n-400 hover:text-n-200'}`
  return (
    <section className="space-y-4 rounded-3xl border border-n-800 bg-n-900 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-medium">Week starts on</span>
        <div className="flex gap-1 rounded-2xl bg-n-950 p-1" role="radiogroup" aria-label="Week starts on">
          {([1, 0] as const).map((d) => (
            <button key={d} role="radio" aria-checked={weekStartsOn === d} className={seg(weekStartsOn === d)} onClick={() => updateSettings({ weekStartsOn: d })}>
              {d === 1 ? 'Monday' : 'Sunday'}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
