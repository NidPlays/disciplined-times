import { useRegisterSW } from 'virtual:pwa-register/react'
import type { Notice } from './Notices'

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

/** "A new version is available" notice for the top notification stack. */
export function useUpdateNotice(): Notice | null {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) watchForUpdates(registration)
    },
  })

  if (!needRefresh) return null
  return {
    id: 'update',
    icon: (
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent-fg">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
        </svg>
      </span>
    ),
    title: 'Update available',
    body: 'Reload to get the latest version.',
    action: { label: 'Reload', run: () => updateServiceWorker(true) },
    dismiss: () => setNeedRefresh(false),
  }
}
