interface Props {
  ratio: number
  color: string
  size?: number
  stroke?: number
  children?: React.ReactNode
}

export function Ring({ ratio, color, size = 56, stroke = 6, children }: Props) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const done = ratio >= 1
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-n-800" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill={done ? color : 'none'}
          fillOpacity={done ? 0.15 : 0}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, ratio))}
          style={{ transition: 'stroke-dashoffset 400ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-xl">{children}</div>
    </div>
  )
}
