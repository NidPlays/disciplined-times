import { useRef, useState, type ReactNode } from 'react'
import { useInstallNotice } from './Install'
import { useUpdateNotice } from './UpdateNotice'

export interface Notice {
  id: string
  icon: ReactNode
  title: string
  body: ReactNode
  action?: { label: string; run: () => void }
  dismiss: () => void
}

const SWIPE_PX = 40

const chevron = (d: string) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
)

/**
 * One notification banner at the top of the screen for every app-level notice
 * (update available, install as app…). When several are active they stack like a
 * deck: one card is shown at a time and the others peek out underneath. Swipe the card
 * up/down, use the arrows, scroll the wheel over it, or press ↑/↓ to switch.
 */
export function Notices() {
  // Order = priority: an available update comes before the install suggestion.
  const notices = [useUpdateNotice(), useInstallNotice()].filter((n): n is Notice => n !== null)

  const [activeId, setActiveId] = useState<string | null>(null)
  // Which edge the incoming card slides in from.
  const [from, setFrom] = useState<'below' | 'above' | null>(null)
  const [dy, setDy] = useState(0)
  const drag = useRef<{ y: number; pointer: number; moving: boolean } | null>(null)
  const dyRef = useRef(0)
  const swallowClick = useRef(false)
  const lastWheel = useRef(0)

  if (!notices.length) return null

  const count = notices.length
  const index = Math.max(0, notices.findIndex((n) => n.id === activeId))
  const current = notices[index]

  // step 1 = next card (comes up from below), -1 = previous (drops in from above). Wraps around.
  const go = (step: 1 | -1) => {
    if (count < 2) return
    setFrom(step === 1 ? 'below' : 'above')
    setActiveId(notices[(index + step + count) % count].id)
  }

  const dismiss = () => {
    if (count > 1) {
      setFrom('below')
      setActiveId(notices[(index + 1) % count].id)
    }
    current.dismiss()
  }

  const setOffset = (v: number) => {
    dyRef.current = v
    setDy(v)
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-safe md:left-60 lg:left-64">
      <div
        role="region"
        aria-label="Notifications"
        aria-roledescription={count > 1 ? 'carousel' : undefined}
        className="pointer-events-auto relative w-full max-w-xl"
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') go(1)
          else if (e.key === 'ArrowUp') go(-1)
          else return
          e.preventDefault()
        }}
        onWheel={(e) => {
          if (count < 2 || Math.abs(e.deltaY) < 15) return
          const now = Date.now()
          if (now - lastWheel.current < 450) return
          lastWheel.current = now
          go(e.deltaY > 0 ? 1 : -1)
        }}
      >
        {/* The other cards peeking out below, so it's obvious there's more than one. */}
        {count > 2 && <div className="absolute inset-x-6 -bottom-3 h-6 rounded-b-2xl border border-n-700 bg-n-800/50" aria-hidden />}
        {count > 1 && <div className="absolute inset-x-3 -bottom-1.5 h-6 rounded-b-2xl border border-n-700 bg-n-800/80 shadow-lg" aria-hidden />}

        <div
          key={current.id}
          className={`relative flex touch-none select-none items-center gap-3 rounded-2xl border border-n-700 bg-n-800 p-3 shadow-xl ${
            from === 'below' ? 'animate-from-below' : from === 'above' ? 'animate-from-above' : 'animate-fade'
          }`}
          style={{
            transform: dy ? `translateY(${dy}px)` : undefined,
            opacity: dy ? Math.max(0.3, 1 - Math.abs(dy) / 160) : undefined,
            transition: drag.current?.moving ? 'none' : 'transform 200ms ease, opacity 200ms ease',
          }}
          onPointerDown={(e) => {
            swallowClick.current = false
            drag.current = { y: e.clientY, pointer: e.pointerId, moving: false }
          }}
          onPointerMove={(e) => {
            const d = drag.current
            if (!d || d.pointer !== e.pointerId) return
            const delta = e.clientY - d.y
            if (!d.moving) {
              if (Math.abs(delta) < 6) return
              d.moving = true
              e.currentTarget.setPointerCapture(e.pointerId)
            }
            // With only one card there's nowhere to go: give it a little rubber-band instead.
            setOffset(count > 1 ? delta : delta * 0.2)
          }}
          onPointerUp={() => {
            const d = drag.current
            drag.current = null
            if (!d?.moving) return
            swallowClick.current = true
            const delta = dyRef.current
            setOffset(0)
            if (Math.abs(delta) > SWIPE_PX) go(delta < 0 ? 1 : -1)
          }}
          onPointerCancel={() => {
            drag.current = null
            setOffset(0)
          }}
          onClickCapture={(e) => {
            // A swipe that ends over a button shouldn't also press it.
            if (!swallowClick.current) return
            swallowClick.current = false
            e.stopPropagation()
            e.preventDefault()
          }}
        >
          <div className="shrink-0">{current.icon}</div>
          <div className="min-w-0 flex-1 text-sm" aria-live="polite">
            <div className="font-semibold text-n-100">{current.title}</div>
            <p className="mt-0.5 text-n-400">{current.body}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {current.action && (
              <button onClick={current.action.run} className="rounded-xl bg-accent px-3 py-1.5 text-sm font-semibold text-on-accent hover:bg-accent-hover">
                {current.action.label}
              </button>
            )}
            <button onClick={dismiss} className="grid h-8 w-8 place-items-center rounded-xl text-lg text-n-400 hover:text-n-200" aria-label={`Dismiss: ${current.title}`}>
              ×
            </button>
          </div>
          {count > 1 && (
            <div className="-my-1 -mr-1 flex shrink-0 flex-col items-center gap-0.5 border-l border-n-700 pl-1.5">
              <button onClick={() => go(-1)} className="grid h-6 w-6 place-items-center rounded-lg text-n-400 hover:text-n-200" aria-label="Previous notification">
                {chevron('M6 15l6-6 6 6')}
              </button>
              <div className="flex flex-col items-center gap-1 py-0.5" aria-hidden>
                {notices.map((n, i) => (
                  <span key={n.id} className={`w-1.5 rounded-full transition-all duration-200 ${i === index ? 'h-3 bg-accent' : 'h-1.5 bg-n-600'}`} />
                ))}
              </div>
              <span className="sr-only">
                Notification {index + 1} of {count}
              </span>
              <button onClick={() => go(1)} className="grid h-6 w-6 place-items-center rounded-lg text-n-400 hover:text-n-200" aria-label="Next notification">
                {chevron('M6 9l6 6 6-6')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
