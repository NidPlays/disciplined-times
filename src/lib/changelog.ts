export interface Release {
  version: string
  items: string[]
}

/**
 * Parses CHANGELOG.md into releases, newest first. Only `## <version>` headings
 * and top-level `- ` bullets are read; everything else (title, intro) is ignored.
 */
export function parseChangelog(md: string): Release[] {
  const releases: Release[] = []
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trimEnd()
    const heading = /^##\s+v?(\S+)/.exec(line)
    if (heading) {
      releases.push({ version: heading[1], items: [] })
      continue
    }
    const current = releases[releases.length - 1]
    if (!current) continue
    const bullet = /^[-*]\s+(.*)$/.exec(line)
    if (bullet) current.items.push(bullet[1])
    // Indented continuation lines belong to the previous bullet.
    else if (/^\s+\S/.test(raw) && current.items.length) current.items[current.items.length - 1] += ' ' + line.trim()
  }
  return releases
}

export type Segment = { text: string; bold?: boolean; code?: boolean }

/** Splits a bullet into plain, **bold** and `code` runs, so it renders without a Markdown library. */
export function inlineSegments(text: string): Segment[] {
  const out: Segment[] = []
  const re = /\*\*(.+?)\*\*|`([^`]+)`/g
  let last = 0
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) })
    out.push(m[1] !== undefined ? { text: m[1], bold: true } : { text: m[2], code: true })
    last = re.lastIndex
  }
  if (last < text.length) out.push({ text: text.slice(last) })
  return out
}
