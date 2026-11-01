import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { inlineSegments, parseChangelog } from './changelog'

describe('parseChangelog', () => {
  test('reads versions and bullets, ignoring the intro', () => {
    const md = '# Changelog\n\nIntro text.\n\n## 0.2.0\n\n- One\n- Two\n  continued\n\n## 0.1.0\n\n- First'
    expect(parseChangelog(md)).toEqual([
      { version: '0.2.0', items: ['One', 'Two continued'] },
      { version: '0.1.0', items: ['First'] },
    ])
  })

  test('the real CHANGELOG.md starts with the package.json version', () => {
    const root = new URL('../../', import.meta.url)
    const releases = parseChangelog(readFileSync(new URL('CHANGELOG.md', root), 'utf8'))
    const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'))
    expect(releases.length).toBeGreaterThan(0)
    expect(releases[0].version).toBe(pkg.version)
    for (const r of releases) expect(r.items.length).toBeGreaterThan(0)
  })
})

describe('inlineSegments', () => {
  test('splits bold and code runs', () => {
    expect(inlineSegments('**Week:** swipe, see `AGENTS.md` now')).toEqual([
      { text: 'Week:', bold: true },
      { text: ' swipe, see ' },
      { text: 'AGENTS.md', code: true },
      { text: ' now' },
    ])
  })

  test('plain text stays one segment', () => {
    expect(inlineSegments('Just text')).toEqual([{ text: 'Just text' }])
  })
})
