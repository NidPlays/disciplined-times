import { useEffect, useState } from 'react'
import { firstRun } from '../lib/onboarding'
import type { Notice } from './Notices'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    listeners.forEach((l) => l())
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    listeners.forEach((l) => l())
  })
}

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/** Phones and tablets: a mobile UA (or iPadOS posing as a Mac) on a touch-first screen. */
export const isMobileDevice = () => {
  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData
  if (uaData?.mobile) return true
  if (isIOS()) return true
  return /android|mobi|silk|kindle|opera mini/i.test(navigator.userAgent) && window.matchMedia('(pointer: coarse)').matches
}

/** Re-render whenever the install prompt becomes (un)available. */
function useInstallState() {
  const [, force] = useState(0)
  useEffect(() => {
    const l = () => force((n) => n + 1)
    listeners.add(l)
    return () => void listeners.delete(l)
  }, [])
  return () => force((n) => n + 1)
}

const promptInstall = async () => {
  const d = deferred
  if (!d) return
  deferred = null
  await d.prompt()
  listeners.forEach((l) => l())
}

/** The iOS Share glyph (box with an up arrow), so the instructions match what's on screen. */
const ShareIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline -mt-0.5" aria-hidden>
    <path d="M12 3v12M8 7l4-4 4 4M5 11v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
  </svg>
)

const DISMISS_KEY = 'dt-install-banner-dismissed'
const SNOOZE_MS = 14 * 24 * 3600e3

const recentlyDismissed = () => {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY))
    return Number.isFinite(t) && Date.now() - t < SNOOZE_MS
  } catch {
    return false
  }
}

const rememberDismissal = () => {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
  } catch {
    /* storage unavailable: banner just comes back next visit */
  }
}

/**
 * The "install as an app" notice for the top notification stack. Only on phones/tablets
 * that aren't already running the installed app: on Android/Chromium it triggers the
 * native install prompt; on iOS it explains Share → Add to Home Screen.
 * Dismissing hides it for 14 days. Skipped on a first visit, where the walkthrough
 * already covers installing.
 */
export function useInstallNotice(): Notice | null {
  useInstallState()
  const [eligible] = useState(() => typeof window !== 'undefined' && isMobileDevice() && !isStandalone() && !recentlyDismissed() && !firstRun)
  const [visible, setVisible] = useState(false)
  const [closed, setClosed] = useState(false)

  // Give the page a moment to settle before popping anything up.
  useEffect(() => {
    if (!eligible) return
    const t = setTimeout(() => setVisible(true), 2500)
    return () => clearTimeout(t)
  }, [eligible])

  const ios = isIOS()
  if (!eligible || !visible || closed || isStandalone() || (!deferred && !ios)) return null

  return {
    id: 'install',
    icon: <img src={`${import.meta.env.BASE_URL}pwa-64x64.png`} alt="" className="h-10 w-10 rounded-xl" />,
    title: 'Install Disciplined Times',
    body: ios ? (
      <>
        Tap <strong className="text-n-200">Share</strong> <ShareIcon /> then <strong className="text-n-200">Add to Home Screen</strong>.
      </>
    ) : (
      'Add it to your home screen for full-screen, offline use.'
    ),
    action: ios
      ? undefined
      : {
          label: 'Install',
          run: async () => {
            await promptInstall()
            setClosed(true)
          },
        },
    dismiss: () => {
      rememberDismissal()
      setClosed(true)
    },
  }
}

export function InstallCard() {
  const force = useInstallState()

  if (isStandalone()) return null

  return (
    <section id="install" className="scroll-mt-6 space-y-3 rounded-3xl border border-accent/30 bg-accent/5 p-4">
      <div className="font-medium">Install as an app (optional)</div>
      {deferred ? (
        <>
          <p className="text-sm text-n-400">Everything works right here in the browser. Installing adds an app icon, its own window and quick “+30 min” shortcuts on the icon.</p>
          <button
            onClick={async () => {
              await promptInstall()
              force()
            }}
            className="rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent"
          >
            Install
          </button>
        </>
      ) : isIOS() ? (
        <p className="text-sm text-n-400">
          In Safari, tap <strong className="text-n-200">Share</strong> <ShareIcon /> then <strong className="text-n-200">Add to Home Screen</strong>.
        </p>
      ) : (
        <p className="text-sm text-n-400">Everything works right here in the browser. To also get an app icon, use your browser menu and choose “Install app” or “Add to Home screen” (Chrome, Edge, Safari on macOS & iOS).</p>
      )}
    </section>
  )
}
