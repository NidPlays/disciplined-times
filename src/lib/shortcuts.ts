/** Key ids match the `id`s on the visual keyboard (see KEYBOARD below). */
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

const LABELS: Record<string, string> = {
  arrowleft: '←',
  arrowright: '→',
  arrowup: '↑',
  arrowdown: '↓',
  escape: 'Esc',
  shift: 'Shift',
  'shift-r': 'Shift',
  'meta-r': 'Cmd',
  backspace: '⌫',
  enter: 'Enter',
  tab: 'Tab',
  caps: 'Caps',
  space: 'Space',
  ctrl: 'Ctrl',
  alt: 'Alt',
  meta: 'Cmd',
}

/** What's printed on a key cap. */
export const keyLabel = (id: string) => LABELS[id] ?? id.toUpperCase()

/** Spoken name for screen readers. */
const SPOKEN: Record<string, string> = { arrowleft: 'Left arrow', arrowright: 'Right arrow', '/': 'Slash', escape: 'Escape' }
export const keyName = (id: string) => SPOKEN[id] ?? keyLabel(id)

export interface KeyCap {
  id: string
  /** Width in key units (a letter key is 1). */
  w?: number
}

const row = (s: string): KeyCap[] => [...s].map((id) => ({ id }))

/** A compact US layout: enough to locate every shortcut key. */
export const KEYBOARD: KeyCap[][] = [
  [{ id: 'escape', w: 1.5 }, ...row('1234567890-='), { id: 'backspace', w: 1.5 }],
  [{ id: 'tab', w: 1.5 }, ...row('qwertyuiop[]'), { id: '\\', w: 1.5 }],
  [{ id: 'caps', w: 1.75 }, ...row("asdfghjkl;'"), { id: 'enter', w: 2.25 }],
  [{ id: 'shift', w: 2.25 }, ...row('zxcvbnm,./'), { id: 'arrowup' }, { id: 'shift-r', w: 1.75 }],
  [{ id: 'ctrl', w: 1.5 }, { id: 'alt', w: 1.25 }, { id: 'meta', w: 1.25 }, { id: 'space', w: 7 }, { id: 'meta-r', w: 1 }, { id: 'arrowleft' }, { id: 'arrowdown' }, { id: 'arrowright' }],
]

/**
 * The shortcut a key press triggers, if any. `?` arrives as e.key '?' with shiftKey
 * on US layouts, so it's matched by character rather than by physical keys.
 */
export function matchShortcut(e: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey'>): Shortcut | undefined {
  if (e.metaKey || e.ctrlKey || e.altKey) return undefined
  const k = e.key.toLowerCase()
  if (k === '?') return SHORTCUTS.find((s) => s.id === 'help')
  return SHORTCUTS.find((s) => s.keys.length === 1 && s.keys[0] === k)
}
