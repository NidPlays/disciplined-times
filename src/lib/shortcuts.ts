/** Key ids match the `id`s on the visual keyboard (see keyboardFor below). */
export interface Shortcut {
  id: string
  /** Every key held for the shortcut, in press order (e.g. Shift then /). */
  keys: string[]
  label: string
  /** Where it works, when not everywhere. */
  where?: string
  group: 'Navigation' | 'Today' | 'General'
}

export const SHORTCUTS: Shortcut[] = [
  { id: 'tab-today', keys: ['1'], label: 'Go to Today', group: 'Navigation' },
  { id: 'tab-week', keys: ['2'], label: 'Go to Week', group: 'Navigation' },
  { id: 'tab-goals', keys: ['3'], label: 'Go to Goals', group: 'Navigation' },
  { id: 'tab-settings', keys: ['4'], label: 'Go to Settings', group: 'Navigation' },
  { id: 'today', keys: ['t'], label: 'Jump to today', group: 'Navigation' },
  { id: 'prev-day', keys: ['arrowleft'], label: 'Previous day', where: 'Today', group: 'Today' },
  { id: 'next-day', keys: ['arrowright'], label: 'Next day', where: 'Today', group: 'Today' },
  { id: 'new-goal', keys: ['n'], label: 'New goal', group: 'General' },
  { id: 'help', keys: ['shift', '/'], label: 'Show keyboard shortcuts', group: 'General' },
  { id: 'close', keys: ['escape'], label: 'Close a dialog', group: 'General' },
]

export type Platform = 'mac' | 'windows' | 'linux'

export const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'mac', label: 'Mac' },
  { id: 'windows', label: 'Windows' },
  { id: 'linux', label: 'Linux' },
]

/**
 * Best guess at the OS, so the keyboard diagram shows the keys people actually have.
 * Prefers the UA-CH platform, then navigator.platform, then the user agent. iPadOS
 * (with a hardware keyboard) counts as Mac; ChromeOS and anything unknown as Linux-style.
 */
export function detectPlatform(nav: { userAgent?: string; platform?: string; userAgentData?: { platform?: string } }): Platform {
  const hint = `${nav.userAgentData?.platform ?? ''} ${nav.platform ?? ''} ${nav.userAgent ?? ''}`.toLowerCase()
  if (/mac|iphone|ipad|ipod|ios/.test(hint)) return 'mac'
  if (/win/.test(hint)) return 'windows'
  return 'linux'
}

const COMMON: Record<string, string> = {
  arrowleft: '←',
  arrowright: '→',
  arrowup: '↑',
  arrowdown: '↓',
  space: '',
}

// Each OS prints its own names on these keys; Mac keyboards use lowercase words and symbols.
const LABELS: Record<Platform, Record<string, string>> = {
  mac: { escape: 'esc', backspace: 'delete', tab: 'tab', caps: 'caps', enter: 'return', shift: 'shift', 'shift-r': 'shift', fn: 'fn', ctrl: '⌃', alt: '⌥', 'alt-r': '⌥', meta: '⌘', 'meta-r': '⌘' },
  windows: { escape: 'Esc', backspace: '⌫', tab: 'Tab', caps: 'Caps', enter: 'Enter', shift: 'Shift', 'shift-r': 'Shift', ctrl: 'Ctrl', 'ctrl-r': 'Ctrl', alt: 'Alt', 'alt-r': 'Alt', meta: 'Win', menu: 'Menu' },
  linux: { escape: 'Esc', backspace: '⌫', tab: 'Tab', caps: 'Caps', enter: 'Enter', shift: 'Shift', 'shift-r': 'Shift', ctrl: 'Ctrl', 'ctrl-r': 'Ctrl', alt: 'Alt', 'alt-r': 'AltGr', meta: 'Super', menu: 'Menu' },
}

/** What's printed on a key cap on that OS's keyboards. */
export const keyLabel = (id: string, platform: Platform = 'windows') => COMMON[id] ?? LABELS[platform][id] ?? id.toUpperCase()

/** Spoken name for screen readers (symbols like ⇧ aren't read out reliably). */
const SPOKEN: Record<string, string> = { arrowleft: 'Left arrow', arrowright: 'Right arrow', '/': 'Slash', escape: 'Escape', shift: 'Shift' }
export const keyName = (id: string, platform: Platform = 'windows') => SPOKEN[id] ?? keyLabel(id, platform)

export interface KeyCap {
  id: string
  /** Width in key units (a letter key is 1). */
  w?: number
}

const row = (s: string): KeyCap[] => [...s].map((id) => ({ id }))
const arrows: KeyCap[] = [{ id: 'arrowleft' }, { id: 'arrowdown' }, { id: 'arrowright' }]

// Rows shared by every OS (US layout); every row adds up to 15 key units.
const TOP: KeyCap[][] = [
  [{ id: 'escape', w: 1.5 }, ...row('1234567890-='), { id: 'backspace', w: 1.5 }],
  [{ id: 'tab', w: 1.5 }, ...row('qwertyuiop[]'), { id: '\\', w: 1.5 }],
  [{ id: 'caps', w: 1.75 }, ...row("asdfghjkl;'"), { id: 'enter', w: 2.25 }],
  [{ id: 'shift', w: 2.25 }, ...row('zxcvbnm,./'), { id: 'arrowup' }, { id: 'shift-r', w: 1.75 }],
]

// The bottom row is where the OSes differ (Mac: fn ⌃ ⌥ ⌘; PCs: Ctrl Win/Super Alt).
const BOTTOM: Record<Platform, KeyCap[]> = {
  mac: [{ id: 'fn' }, { id: 'ctrl' }, { id: 'alt' }, { id: 'meta', w: 1.25 }, { id: 'space', w: 5.5 }, { id: 'meta-r', w: 1.25 }, { id: 'alt-r' }, ...arrows],
  windows: [{ id: 'ctrl', w: 1.25 }, { id: 'meta' }, { id: 'alt', w: 1.25 }, { id: 'space', w: 5.25 }, { id: 'alt-r', w: 1.25 }, { id: 'menu' }, { id: 'ctrl-r' }, ...arrows],
  linux: [{ id: 'ctrl', w: 1.25 }, { id: 'meta' }, { id: 'alt', w: 1.25 }, { id: 'space', w: 5.25 }, { id: 'alt-r', w: 1.25 }, { id: 'menu' }, { id: 'ctrl-r' }, ...arrows],
}

/** A compact keyboard for the OS: enough to locate every shortcut key. */
export const keyboardFor = (platform: Platform): KeyCap[][] => [...TOP, BOTTOM[platform]]

/**
 * The shortcut a key press triggers, if any.
 *
 * - Ctrl/Cmd/Alt(Option) combos belong to the browser and OS on every platform, so they
 *   never trigger ours (this also skips AltGr, which arrives as Ctrl+Alt on Windows).
 * - `?` is matched by the character typed, since it's Shift+/ on US keyboards but other
 *   keys elsewhere (e.g. Shift+ß on German ones).
 * - Letters and digits fall back to the physical key (e.code), so N, T and 1–4 also work
 *   on non-Latin layouts (Cyrillic, Greek…) and on AZERTY, where the top row types &é"'.
 */
export function matchShortcut(e: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey'> & { code?: string }): Shortcut | undefined {
  if (e.metaKey || e.ctrlKey || e.altKey) return undefined
  const k = e.key.toLowerCase()
  if (k === '?') return SHORTCUTS.find((s) => s.id === 'help')
  const byKey = SHORTCUTS.find((s) => s.keys.length === 1 && s.keys[0] === k)
  if (byKey) return byKey
  // Only for keys that didn't type a Latin letter/digit themselves, so a QWERTZ/AZERTY
  // user pressing the key labelled N still gets N, not whatever sits at QWERTY's N spot.
  if (/^[a-z0-9]$/.test(k)) return undefined
  const phys = e.code?.match(/^(?:Key([A-Z])|Digit([0-9]))$/)
  if (!phys) return undefined
  const id = (phys[1] ?? phys[2]).toLowerCase()
  return SHORTCUTS.find((s) => s.keys.length === 1 && s.keys[0] === id)
}
