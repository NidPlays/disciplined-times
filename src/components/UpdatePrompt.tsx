import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-safe">
      <div className="animate-fade flex items-center gap-3 rounded-2xl border border-n-700 bg-n-800 px-4 py-3 text-sm shadow-xl">
        <span>A new version is available.</span>
        <button className="font-semibold text-accent-fg" onClick={() => updateServiceWorker(true)}>
          Reload
        </button>
        <button className="text-n-400" onClick={() => setNeedRefresh(false)}>
          Dismiss
        </button>
      </div>
    </div>
  )
}
