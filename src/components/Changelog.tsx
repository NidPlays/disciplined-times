import changelogMd from '../../CHANGELOG.md?raw'
import { inlineSegments, parseChangelog } from '../lib/changelog'
import { Sheet } from './Sheet'

// Bundled at build time, so the changelog also works offline.
const releases = parseChangelog(changelogMd)

export function Changelog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Changelog">
      <div className="space-y-6">
        {releases.map((r) => (
          <section key={r.version} aria-labelledby={`v-${r.version}`}>
            <h3 id={`v-${r.version}`} className="mb-2 flex items-center gap-2 font-semibold">
              v{r.version}
              {r.version === __APP_VERSION__ && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-on-accent">Current</span>}
            </h3>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-n-300">
              {r.items.map((item, i) => (
                <li key={i}>
                  {inlineSegments(item).map((s, j) =>
                    s.bold ? (
                      <strong key={j} className="font-semibold text-n-100">
                        {s.text}
                      </strong>
                    ) : s.code ? (
                      <code key={j} className="rounded bg-n-800 px-1 py-0.5 text-xs">
                        {s.text}
                      </code>
                    ) : (
                      <span key={j}>{s.text}</span>
                    ),
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Sheet>
  )
}
