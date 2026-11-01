import { describe, expect, test } from 'bun:test'
import { KEYBOARD, keyLabel, matchShortcut, SHORTCUTS } from './shortcuts'

const press = (key: string, mods: Partial<{ metaKey: boolean; ctrlKey: boolean; altKey: boolean }> = {}) => ({ key, metaKey: false, ctrlKey: false, altKey: false, ...mods })

describe('shortcuts', () => {
  test('every shortcut key exists on the visual keyboard', () => {
    const ids = new Set(KEYBOARD.flat().map((k) => k.id))
    for (const s of SHORTCUTS) for (const k of s.keys) expect(ids.has(k)).toBe(true)
  })

  test('ids are unique', () => {
    expect(new Set(SHORTCUTS.map((s) => s.id)).size).toBe(SHORTCUTS.length)
  })

  test('matches plain keys case-insensitively', () => {
    expect(matchShortcut(press('n'))?.id).toBe('new-goal')
    expect(matchShortcut(press('N'))?.id).toBe('new-goal')
    expect(matchShortcut(press('3'))?.id).toBe('tab-goals')
    expect(matchShortcut(press('ArrowLeft'))?.id).toBe('prev-day')
    expect(matchShortcut(press('Escape'))?.id).toBe('close')
  })

  test('? opens help', () => {
    expect(matchShortcut(press('?'))?.id).toBe('help')
  })

  test('ignores browser/OS combos and unknown keys', () => {
    expect(matchShortcut(press('n', { ctrlKey: true }))).toBeUndefined()
    expect(matchShortcut(press('t', { metaKey: true }))).toBeUndefined()
    expect(matchShortcut(press('1', { altKey: true }))).toBeUndefined()
    expect(matchShortcut(press('q'))).toBeUndefined()
  })

  test('key labels', () => {
    expect(keyLabel('arrowleft')).toBe('←')
    expect(keyLabel('n')).toBe('N')
    expect(keyLabel('/')).toBe('/')
  })

  test('keyboard rows are roughly the same width', () => {
    const widths = KEYBOARD.map((r) => r.reduce((s, k) => s + (k.w ?? 1), 0))
    for (const w of widths) expect(Math.abs(w - widths[0])).toBeLessThanOrEqual(0.01)
  })
})
