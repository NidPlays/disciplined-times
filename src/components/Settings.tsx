import { useRef, useState } from 'react'
import { exportData, isExportShape, useStore } from '../lib/store'
import { useUi } from '../lib/ui'
import { externalHref } from '../lib/links'
import { Appearance } from './Appearance'
import { Changelog } from './Changelog'
import { InstallCard, isStandalone } from './Install'
import { WeekStart } from './WeekStart'

export function Settings({ onTour, onShortcuts }: { onTour: () => void; onShortcuts: () => void }) {
  const { importData, reset, goals, logs } = useStore()
  const notify = useUi((s) => s.notify)
  const fileRef = useRef<HTMLInputElement>(null)
  const [changelogOpen, setChangelogOpen] = useState(false)

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

  const card = 'rounded-3xl border border-n-800 bg-n-900 p-4 space-y-4'

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Appearance />

      <InstallCard />

      <WeekStart />

      {/* Desktop only, like the sidebar: the shortcuts need a hardware keyboard. */}
      <section className={`${card} hidden md:block`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-medium">Keyboard shortcuts</div>
            <p className="text-sm text-n-400">
              Press <kbd className="rounded border border-n-700 px-1 text-xs">?</kbd> anywhere to see every shortcut and where its keys are.
            </p>
          </div>
          <button onClick={onShortcuts} className="shrink-0 rounded-2xl bg-n-800 px-4 py-2 text-sm font-semibold hover:bg-n-700">
            Show shortcuts
          </button>
        </div>
      </section>

      <section className={card}>
        <div>
          <div className="font-medium">Your data</div>
          <p className="text-sm text-n-400">
            Everything is stored on this device only ({goals.length} goals, {logs.length} log entries). Export a backup to move between devices.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={doExport} className="rounded-2xl bg-n-800 px-4 py-2 text-sm font-semibold hover:bg-n-700">
            Export backup
          </button>
          <button onClick={() => fileRef.current?.click()} className="rounded-2xl bg-n-800 px-4 py-2 text-sm font-semibold hover:bg-n-700">
            Import backup
          </button>
          <button
            onClick={() => {
              if (confirm('Delete all goals and logged time on this device?')) {
                reset()
                notify('All data cleared')
              }
            }}
            className="rounded-2xl px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/10"
          >
            Clear all
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
        </div>
      </section>

      <section className={card}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-medium">Disciplined Times</div>
            <p className="text-sm text-n-400">Version {__APP_VERSION__}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button onClick={onTour} className="shrink-0 rounded-2xl bg-n-800 px-4 py-2 text-sm font-semibold hover:bg-n-700">
              Take the tour
            </button>
            <button onClick={() => setChangelogOpen(true)} className="shrink-0 rounded-2xl bg-n-800 px-4 py-2 text-sm font-semibold hover:bg-n-700">
              View changelog
            </button>
          </div>
        </div>
      </section>
      <Changelog open={changelogOpen} onClose={() => setChangelogOpen(false)} />

      <p className="text-center text-xs text-n-500">
        <a className="underline hover:text-n-400" href={externalHref('https://github.com/NidPlays/disciplined-times', undefined, isStandalone())} target="_blank" rel="noopener noreferrer">
          Source on GitHub
        </a>
      </p>
    </div>
  )
}
