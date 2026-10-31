import { useUi } from '../lib/ui'

export function ToastHost() {
  const { toast, dismiss } = useUi()
  if (!toast) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
      <div key={toast.id} className="animate-fade pointer-events-auto flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm shadow-xl" role="status">
        <span>{toast.message}</span>
        {toast.action && (
          <button
            className="font-semibold text-emerald-400 hover:text-emerald-300"
            onClick={() => {
              toast.action!.run()
              dismiss()
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
    </div>
  )
}
