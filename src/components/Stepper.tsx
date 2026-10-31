import { formatMinutes } from '../lib/schedule'

interface Props {
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
  label?: string
}

/** +/- control for a duration in minutes. */
export function Stepper({ value, onChange, step = 30, min = 0, max = 24 * 60 * 31, label }: Props) {
  const btn = 'grid h-9 w-9 place-items-center rounded-full bg-n-800 text-lg font-semibold hover:bg-n-700 disabled:opacity-30'
  return (
    <div className="flex items-center gap-2" aria-label={label}>
      <button type="button" className={btn} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))} aria-label="Decrease">
        −
      </button>
      <span className="w-16 text-center tabular-nums">{value === 0 ? 'Off' : formatMinutes(value)}</span>
      <button type="button" className={btn} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))} aria-label="Increase">
        +
      </button>
    </div>
  )
}
