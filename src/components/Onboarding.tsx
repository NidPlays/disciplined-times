import { useEffect, useRef, useState, type ReactNode } from 'react'
import { markOnboarded } from '../lib/onboarding'
import { Appearance } from './Appearance'
import { InstallCard, isStandalone } from './Install'
import { CreateGoalDemo, LogTimeDemo, WeekDemo } from './OnboardingDemos'
import { Sheet } from './Sheet'
import { WeekStart } from './WeekStart'

interface Props {
  open: boolean
  onClose: () => void
  onNewGoal: () => void
  onSettings: () => void
}

interface Step {
  title: string
  intro: string
  body: ReactNode
}

const Bullet = ({ children, className = 'flex' }: { children: ReactNode; className?: string }) => (
  <li className={`${className} gap-3`}>
    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
    <span>{children}</span>
  </li>
)

/**
 * First-run walkthrough: shows how to create a goal, log time and read the week
 * (with a try-it-yourself sample goal), then goes through every setting using the
 * same controls as the Settings tab, so choices made here apply right away.
 */
export function Onboarding({ open, onClose, onNewGoal, onSettings }: Props) {
  const [i, setI] = useState(0)
  const [dir, setDir] = useState<'right' | 'left' | null>(null)
  const top = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setI(0)
      setDir(null)
    }
  }, [open])

  const steps: Step[] = [
    {
      title: 'Welcome',
      intro: 'Plan how many hours you want to give each goal, then log time in quick taps.',
      body: (
        <ul className="space-y-2 text-sm text-n-300">
          <Bullet>A quick tour: creating goals, logging time, checking your week, then your settings.</Bullet>
          <Bullet>It takes about a minute, and you can skip it and come back from Settings any time.</Bullet>
        </ul>
      ),
    },
    {
      title: 'Create a goal',
      intro: 'A goal is anything you want to spend time on, with a plan for how much.',
      body: (
        <>
          <CreateGoalDemo />
          <ul className="space-y-2 text-sm text-n-300">
            <Bullet>
              Plan time <strong className="text-n-100">per day</strong> (pick the days and hours for each), or a total <strong className="text-n-100">per week</strong> or <strong className="text-n-100">per month</strong>.
            </Bullet>
            <Bullet>
              <span className="md:hidden">
                Tap the <strong className="text-n-100">+</strong> button on Today, or <strong className="text-n-100">+ New</strong> on the Goals tab.
              </span>
              <span className="hidden md:inline">
                Click <strong className="text-n-100">+ New goal</strong> in the sidebar, or press <kbd>N</kbd>.
              </span>
            </Bullet>
          </ul>
        </>
      ),
    },
    {
      title: 'Log time',
      intro: 'Today lists the goals planned for the day. Log time with one tap.',
      body: (
        <>
          <LogTimeDemo />
          <ul className="space-y-2 text-sm text-n-300">
            <Bullet>
              The coloured button adds the goal's usual amount. <strong className="text-n-100">Other amount</strong> has more options, including a minus to fix mistakes.
            </Bullet>
            <Bullet>
              Every log shows an <strong className="text-n-100">Undo</strong> button for a few seconds.
            </Bullet>
            <Bullet>
              Forgot yesterday? Use the arrows next to the date<span className="hidden md:inline"> (or <kbd>←</kbd>/<kbd>→</kbd>)</span> to log time on another day.
            </Bullet>
          </ul>
        </>
      ),
    },
    {
      title: 'Your progress',
      intro: 'The Week tab shows time logged each day against your plan.',
      body: (
        <>
          <WeekDemo />
          <ul className="space-y-2 text-sm text-n-300">
            <Bullet>Tap a day to open it, and swipe or use the arrows to change week.</Bullet>
            <Bullet>
              On the <strong className="text-n-100">Goals</strong> tab you can edit, reorder and archive goals, and copy a 🔗 link that logs time in one tap.
            </Bullet>
            <Bullet className="hidden md:flex">
              Shortcuts: <kbd>N</kbd> new goal, <kbd>1</kbd>–<kbd>4</kbd> tabs, <kbd>←</kbd>/<kbd>→</kbd> change day, <kbd>T</kbd> today.
            </Bullet>
          </ul>
        </>
      ),
    },
    {
      title: 'Appearance',
      intro: 'Pick a theme and whether it should be light, dark or follow your device.',
      body: <Appearance />,
    },
    {
      title: 'Your week',
      intro: 'Weekly goals and the Week chart start on this day.',
      body: <WeekStart />,
    },
    {
      title: 'Install as an app',
      intro: 'Optional. Installing gives you an app icon, its own window, offline use and quick “+30 min” shortcuts.',
      body: isStandalone() ? (
        <p className="rounded-3xl border border-n-800 bg-n-900 p-4 text-sm text-n-300">You're already using the installed app. Nothing to do here.</p>
      ) : (
        <InstallCard />
      ),
    },
    {
      title: 'Your data',
      intro: 'No accounts, no servers, no tracking.',
      body: (
        <ul className="space-y-2 text-sm text-n-300">
          <Bullet>Everything is saved on this device only, and works offline.</Bullet>
          <Bullet>
            Use <strong className="text-n-100">Settings → Export backup</strong> to keep a copy or move to another device, and <strong className="text-n-100">Import backup</strong> to restore it.
          </Bullet>
          <Bullet>
            Everything here can be changed later in <strong className="text-n-100">Settings</strong>, and you can take this tour again from there.
          </Bullet>
        </ul>
      ),
    },
  ]

  const last = i === steps.length - 1
  const step = steps[i]

  const go = (to: number) => {
    setDir(to > i ? 'right' : 'left')
    setI(to)
    top.current?.scrollIntoView({ block: 'nearest' })
  }

  const finish = (then?: () => void) => {
    markOnboarded()
    onClose()
    then?.()
  }

  const btn = 'rounded-2xl px-4 py-2 text-sm font-semibold'

  return (
    <Sheet open={open} onClose={() => finish()} title={`${step.title} · ${i + 1} of ${steps.length}`}>
      <div ref={top} className="space-y-5">
        <div key={i} className={`space-y-4 ${dir ? `animate-from-${dir}` : ''}`}>
          {i === 0 && <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="h-14 w-14" />}
          <p className="text-n-200">{step.intro}</p>
          {step.body}
        </div>

        <div className="flex justify-center gap-2" aria-hidden>
          {steps.map((s, j) => (
            <span key={s.title} className={`h-2 rounded-full transition-all ${j === i ? 'w-6 bg-accent' : 'w-2 bg-n-700'}`} />
          ))}
        </div>

        {last ? (
          <div className="flex flex-wrap justify-between gap-2">
            <button onClick={() => go(i - 1)} className={`${btn} text-n-300 hover:bg-n-800`}>
              Back
            </button>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => finish(onSettings)} className={`${btn} bg-n-800 hover:bg-n-700`}>
                Open Settings
              </button>
              <button onClick={() => finish(onNewGoal)} className={`${btn} bg-accent text-on-accent hover:bg-accent-hover`}>
                Create a goal
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between gap-2">
            {i === 0 ? (
              <button onClick={() => finish()} className={`${btn} text-n-300 hover:bg-n-800`}>
                Skip
              </button>
            ) : (
              <button onClick={() => go(i - 1)} className={`${btn} text-n-300 hover:bg-n-800`}>
                Back
              </button>
            )}
            <button onClick={() => go(i + 1)} className={`${btn} bg-accent text-on-accent hover:bg-accent-hover`}>
              {i === 0 ? 'Get started' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </Sheet>
  )
}
