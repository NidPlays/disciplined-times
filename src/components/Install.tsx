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

export function InstallCard() {
  const [, force] = useState(0)
  useEffect(() => {
    const l = () => force((n) => n + 1)
    listeners.add(l)
    return () => void listeners.delete(l)
  }, [])

  if (isStandalone()) return null

  return (
    <section className="space-y-3 rounded-3xl border border-accent/30 bg-accent/5 p-4">
      <div className="font-medium">Install as an app (optional)</div>
      {deferred ? (
        <>
          <p className="text-sm text-n-400">Everything works right here in the browser. Installing adds an app icon, its own window and quick “+30 min” shortcuts on the icon.</p>
          <button
            onClick={async () => {
              await deferred?.prompt()
              deferred = null
              force((n) => n + 1)
            }}
            className="rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent"
          >
            Install
          </button>
        </>
      ) : isIOS() ? (
        <p className="text-sm text-n-400">
          In Safari, tap <strong className="text-n-200">Share</strong> <span aria-hidden>⎋</span> then <strong className="text-n-200">Add to Home Screen</strong>.
        </p>
      ) : (
        <p className="text-sm text-n-400">Everything works right here in the browser. To also get an app icon, use your browser menu and choose “Install app” or “Add to Home screen” (Chrome, Edge, Safari on macOS & iOS).</p>
      )}
    </section>
  )
}
