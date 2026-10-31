import { useEffect, useState } from 'react'

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
 * A small, dismissible banner shown only on phones/tablets that aren't already
 * running the installed app. On Android/Chromium it triggers the native install
 * prompt; on iOS it explains Share → Add to Home Screen. Dismissing hides it for 14 days.
 */
export function InstallBanner() {
  useInstallState()
  const [eligible] = useState(() => typeof window !== 'undefined' && isMobileDevice() && !isStandalone() && !recentlyDismissed())
  const [visible, setVisible] = useState(false)
  const [closed, setClosed] = useState(false)

  // Wait until the page has settled and the 3s "ready to work offline" notice is gone.
  useEffect(() => {
    if (!eligible) return
    const t = setTimeout(() => setVisible(true), 4000)
    return () => clearTimeout(t)
  }, [eligible])

  const ios = isIOS()
  if (!eligible || !visible || closed || isStandalone() || (!deferred && !ios)) return null

  const dismiss = () => {
    rememberDismissal()
    setClosed(true)
  }

  return (
    <div className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-safe md:hidden" role="dialog" aria-label="Install Disciplined Times">
      <div className="animate-fade flex w-full max-w-xl items-start gap-3 rounded-2xl border border-n-700 bg-n-800 p-3 shadow-xl">
        <img src={`${import.meta.env.BASE_URL}pwa-64x64.png`} alt="" className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 text-sm">
          <div className="font-semibold text-n-100">Install Disciplined Times</div>
          {ios ? (
            <p className="mt-0.5 text-n-400">
              Tap <strong className="text-n-200">Share</strong> <ShareIcon /> then <strong className="text-n-200">Add to Home Screen</strong>.
            </p>
          ) : (
            <p className="mt-0.5 text-n-400">Add it to your home screen for full-screen, offline use.</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {!ios && (
            <button
              onClick={async () => {
                await promptInstall()
                setClosed(true)
              }}
              className="rounded-xl bg-accent px-3 py-1.5 text-sm font-semibold text-on-accent"
            >
              Install
            </button>
          )}
          <button onClick={dismiss} className="grid h-8 w-8 place-items-center rounded-xl text-lg text-n-400" aria-label="Dismiss">
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

export function InstallCard() {
  const force = useInstallState()

  if (isStandalone()) return null

  return (
    <section className="space-y-3 rounded-3xl border border-accent/30 bg-accent/5 p-4">
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
