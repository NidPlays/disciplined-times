import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()

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
