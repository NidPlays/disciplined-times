import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

const HOUR = 60 * 60 * 1000
const MIN_GAP = 60 * 1000

// Browsers only look for a new service worker on navigation, so an app left open (or parked in
// the background on a phone) would never see an update. Check again whenever the app comes back
// to the foreground, and hourly while it stays open.
function watchForUpdates(registration: ServiceWorkerRegistration) {
  let last = Date.now()
  const check = () => {
    if (!navigator.onLine || Date.now() - last < MIN_GAP) return
    last = Date.now()
    registration.update().catch(() => {})
  }
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check())
  setInterval(check, HOUR)
}

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) watchForUpdates(registration)
    },
  })

  // The "offline ready" note is informational only; hide it after a moment.
  useEffect(() => {
    if (!offlineReady) return
    const t = setTimeout(() => setOfflineReady(false), 3000)
    return () => clearTimeout(t)
  }, [offlineReady, setOfflineReady])

  if (!needRefresh && !offlineReady) return null
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-safe">
      <div className="animate-fade flex items-center gap-3 rounded-2xl border border-n-700 bg-n-800 px-4 py-3 text-sm shadow-xl">
        <span>{needRefresh ? 'A new version is available.' : 'Ready to work offline.'}</span>
        {needRefresh && (
          <button className="font-semibold text-accent-fg" onClick={() => updateServiceWorker(true)}>
            Reload
          </button>
        )}
        <button
          className="text-n-400"
          onClick={() => {
            setNeedRefresh(false)
            setOfflineReady(false)
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
