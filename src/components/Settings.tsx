import { useRef } from 'react'
import { exportData, isExportShape, useStore } from '../lib/store'
import { useUi } from '../lib/ui'
import { InstallCard } from './Install'

export function Settings() {
  const { settings, updateSettings, importData, reset, goals, logs } = useStore()
  const notify = useUi((s) => s.notify)
  const fileRef = useRef<HTMLInputElement>(null)

  const doExport = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `disciplined-times-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const doImport = async (f: File) => {
    try {
      const data = JSON.parse(await f.text())
      if (!isExportShape(data)) throw new Error('bad file')
      if (!confirm(`Replace current data with ${data.goals.length} goals and ${data.logs.length} entries?`)) return
      importData(data)
      notify('Data imported')
    } catch {
      notify('That file could not be imported')
    }
  }

  const card = 'rounded-3xl border border-slate-800 bg-slate-900 p-4 space-y-4'
  const seg = (on: boolean) => `rounded-xl px-3 py-1.5 text-sm font-semibold ${on ? 'bg-slate-700 text-white' : 'text-slate-400'}`

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Settings</h1>

      <InstallCard />

      <section className={card}>
        <div className="flex items-center justify-between">
          <span className="font-medium">Week starts on</span>
          <div className="flex gap-1 rounded-2xl bg-slate-950 p-1">
            <button className={seg(settings.weekStartsOn === 1)} onClick={() => updateSettings({ weekStartsOn: 1 })}>
              Monday
            </button>
            <button className={seg(settings.weekStartsOn === 0)} onClick={() => updateSettings({ weekStartsOn: 0 })}>
              Sunday
            </button>
          </div>
        </div>
      </section>

      <section className={card}>
        <div>
          <div className="font-medium">Your data</div>
          <p className="text-sm text-slate-400">
            Everything is stored on this device only ({goals.length} goals, {logs.length} log entries). Export a backup to move between devices.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={doExport} className="rounded-2xl bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700">
            Export backup
          </button>
          <button onClick={() => fileRef.current?.click()} className="rounded-2xl bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700">
            Import backup
          </button>
          <button
            onClick={() => {
              if (confirm('Delete all goals and logged time on this device?')) {
                reset()
                notify('All data cleared')
              }
            }}
            className="rounded-2xl px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10"
          >
            Clear all
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
        </div>
      </section>

      <p className="text-center text-xs text-slate-600">Disciplined Times v{__APP_VERSION__}</p>
    </div>
  )
}
