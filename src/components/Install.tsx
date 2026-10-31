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
    <section className="space-y-3 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-4">
      <div className="font-medium">Install the app</div>
      {deferred ? (
        <>
          <p className="text-sm text-slate-400">Add Disciplined Times to your home screen for a full-screen app that works offline. Long-press the icon for quick “+30 min” logging.</p>
          <button
            onClick={async () => {
              await deferred?.prompt()
              deferred = null
              force((n) => n + 1)
            }}
            className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            Install
          </button>
        </>
      ) : isIOS() ? (
        <p className="text-sm text-slate-400">
          In Safari, tap <strong className="text-slate-200">Share</strong> <span aria-hidden>⎋</span> then <strong className="text-slate-200">Add to Home Screen</strong>.
        </p>
      ) : (
        <p className="text-sm text-slate-400">Use your browser menu and choose “Install app” or “Add to Home screen”.</p>
      )}
    </section>
  )
}
