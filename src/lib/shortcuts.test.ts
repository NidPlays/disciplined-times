import { describe, expect, test } from 'bun:test'
import { detectPlatform, keyboardFor, keyLabel, keyName, matchShortcut, PLATFORMS, SHORTCUTS } from './shortcuts'

const press = (key: string, extra: Partial<{ code: string; metaKey: boolean; ctrlKey: boolean; altKey: boolean }> = {}) => ({ key, metaKey: false, ctrlKey: false, altKey: false, ...extra })

describe('keyboard diagram', () => {
  for (const { id } of PLATFORMS) {
    test(`${id}: every shortcut key exists on the keyboard`, () => {
      const ids = new Set(keyboardFor(id).flat().map((k) => k.id))
      for (const s of SHORTCUTS) for (const k of s.keys) expect(ids.has(k)).toBe(true)
    })

    test(`${id}: every row is 15 key units wide`, () => {
      for (const r of keyboardFor(id)) expect(r.reduce((s, k) => s + (k.w ?? 1), 0)).toBe(15)
    })

    test(`${id}: key ids are unique`, () => {
      const ids = keyboardFor(id).flat().map((k) => k.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
  }

  test('Mac shows fn ⌃ ⌥ ⌘, PCs show Ctrl / Win or Super / Alt', () => {
    const bottom = (p: 'mac' | 'windows' | 'linux') => keyboardFor(p)[4].map((k) => keyLabel(k.id, p)).filter(Boolean)
    expect(bottom('mac').slice(0, 4)).toEqual(['fn', '⌃', '⌥', '⌘'])
    expect(bottom('windows').slice(0, 3)).toEqual(['Ctrl', 'Win', 'Alt'])
    expect(bottom('linux').slice(0, 3)).toEqual(['Ctrl', 'Super', 'Alt'])
  })

  test('OS-specific key names', () => {
    expect(keyLabel('escape', 'mac')).toBe('esc')
    expect(keyLabel('escape', 'windows')).toBe('Esc')
    expect(keyLabel('shift', 'mac')).toBe('shift')
    expect(keyLabel('shift', 'linux')).toBe('Shift')
    expect(keyLabel('enter', 'mac')).toBe('return')
    expect(keyLabel('arrowleft', 'mac')).toBe('←')
    expect(keyLabel('n', 'mac')).toBe('N')
    expect(keyName('shift', 'mac')).toBe('Shift')
  })
})

describe('detectPlatform', () => {
  test('Mac and iPad', () => {
    expect(detectPlatform({ platform: 'MacIntel', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5)' })).toBe('mac')
    expect(detectPlatform({ userAgentData: { platform: 'macOS' } })).toBe('mac')
    expect(detectPlatform({ platform: 'iPad', userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)' })).toBe('mac')
  })

  test('Windows', () => {
    expect(detectPlatform({ platform: 'Win32', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' })).toBe('windows')
    expect(detectPlatform({ userAgentData: { platform: 'Windows' } })).toBe('windows')
  })

  test('Linux, ChromeOS and unknown', () => {
    expect(detectPlatform({ platform: 'Linux x86_64', userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' })).toBe('linux')
    expect(detectPlatform({ userAgentData: { platform: 'Chrome OS' } })).toBe('linux')
    expect(detectPlatform({})).toBe('linux')
  })
})

describe('matchShortcut', () => {
  test('ids are unique', () => {
    expect(new Set(SHORTCUTS.map((s) => s.id)).size).toBe(SHORTCUTS.length)
  })

  test('plain keys, case-insensitive', () => {
    expect(matchShortcut(press('n'))?.id).toBe('new-goal')
    expect(matchShortcut(press('N'))?.id).toBe('new-goal')
    expect(matchShortcut(press('3'))?.id).toBe('tab-goals')
    expect(matchShortcut(press('ArrowLeft'))?.id).toBe('prev-day')
    expect(matchShortcut(press('Escape'))?.id).toBe('close')
  })

  test('? by character, whatever the layout', () => {
    expect(matchShortcut(press('?', { code: 'Slash' }))?.id).toBe('help') // US
    expect(matchShortcut(press('?', { code: 'Minus' }))?.id).toBe('help') // German: Shift+ß
    expect(matchShortcut(press('?', { code: 'KeyM' }))?.id).toBe('help') // French AZERTY: Shift+,
  })

  test('leaves Ctrl, Cmd, Option/Alt and AltGr combos to the browser and OS', () => {
    expect(matchShortcut(press('n', { ctrlKey: true }))).toBeUndefined() // Windows/Linux new window
    expect(matchShortcut(press('t', { metaKey: true }))).toBeUndefined() // Mac new tab
    expect(matchShortcut(press('1', { altKey: true }))).toBeUndefined()
    expect(matchShortcut(press('˜', { altKey: true, code: 'KeyN' }))).toBeUndefined() // Mac Option+N
    expect(matchShortcut(press('@', { ctrlKey: true, altKey: true, code: 'KeyQ' }))).toBeUndefined() // Windows AltGr
  })

  test('non-Latin layouts use the physical key', () => {
    expect(matchShortcut(press('т', { code: 'KeyN' }))?.id).toBe('new-goal') // Russian
    expect(matchShortcut(press('τ', { code: 'KeyT' }))?.id).toBe('today') // Greek
  })

  test('AZERTY top row types symbols but still switches tabs', () => {
    expect(matchShortcut(press('&', { code: 'Digit1' }))?.id).toBe('tab-today')
    expect(matchShortcut(press('é', { code: 'Digit2' }))?.id).toBe('tab-week')
  })

  test('Latin layouts follow the printed letter, not the QWERTY position', () => {
    // German QWERTZ: the key labelled Z sits where QWERTY has Y; neither is a shortcut.
    expect(matchShortcut(press('z', { code: 'KeyY' }))).toBeUndefined()
    // AZERTY: the key labelled Q sits on QWERTY's A spot; pressing "n" anywhere is N.
    expect(matchShortcut(press('n', { code: 'KeyN' }))?.id).toBe('new-goal')
    expect(matchShortcut(press('q', { code: 'KeyA' }))).toBeUndefined()
  })

  test('unknown keys', () => {
    expect(matchShortcut(press('q', { code: 'KeyQ' }))).toBeUndefined()
    expect(matchShortcut(press('ü', { code: 'BracketLeft' }))).toBeUndefined()
  })
})
