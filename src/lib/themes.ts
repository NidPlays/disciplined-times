/**
 * Themes are a neutral palette (backgrounds, text, borders) plus an accent
 * colour, each with a dark and a light variant.
 *
 * Components use semantic Tailwind tokens:
 *   n-950 … n-100   neutral scale, from page background (950) to main text (100)
 *   accent          buttons, rings, highlights
 *   accent-hover    hover state for accent buttons
 *   accent-fg       accent-coloured text on the page background
 *   on-accent       text drawn on top of an accent background
 *   danger          destructive actions
 *   success         completed goals (always green, whatever the accent)
 * The tokens are CSS variables, so switching themes only rewrites those variables.
 */

type Scale = Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950, string>

const neutrals = {
  slate: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617' },
  gray: { 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827', 950: '#030712' },
  zinc: { 50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8', 400: '#a1a1aa', 500: '#71717a', 600: '#52525b', 700: '#3f3f46', 800: '#27272a', 900: '#18181b', 950: '#09090b' },
  neutral: { 50: '#fafafa', 100: '#f5f5f5', 200: '#e5e5e5', 300: '#d4d4d4', 400: '#a3a3a3', 500: '#737373', 600: '#525252', 700: '#404040', 800: '#262626', 900: '#171717', 950: '#0a0a0a' },
  stone: { 50: '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4', 300: '#d6d3d1', 400: '#a8a29e', 500: '#78716c', 600: '#57534e', 700: '#44403c', 800: '#292524', 900: '#1c1917', 950: '#0c0a09' },
  // Deep blue-green tint for the Ocean theme.
  ocean: { 50: '#f0f9ff', 100: '#e6f2f8', 200: '#cfe3ee', 300: '#a9c8d9', 400: '#7ba3b9', 500: '#567f96', 600: '#3e6176', 700: '#2a4759', 800: '#173041', 900: '#0c1f2c', 950: '#04121c' },
  // Purple tint for the Grape theme.
  grape: { 50: '#faf8ff', 100: '#f3f0fb', 200: '#e5def5', 300: '#cdc2e6', 400: '#a597c8', 500: '#7c6ea3', 600: '#5d5182', 700: '#433a63', 800: '#2a2442', 900: '#1a1530', 950: '#0d0a1c' },
} satisfies Record<string, Scale>

interface AccentSet {
  accent: string
  hover: string
  fg: string
  on: string
}

export interface Theme {
  id: string
  name: string
  description: string
  neutral: Scale
  dark: AccentSet
  light: AccentSet
}

export const THEMES: Theme[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Slate & emerald',
    neutral: neutrals.slate,
    dark: { accent: '#10b981', hover: '#34d399', fg: '#34d399', on: '#022c22' },
    light: { accent: '#047857', hover: '#065f46', fg: '#047857', on: '#ffffff' },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep blue & sky',
    neutral: neutrals.ocean,
    dark: { accent: '#38bdf8', hover: '#7dd3fc', fg: '#7dd3fc', on: '#082f49' },
    light: { accent: '#0369a1', hover: '#075985', fg: '#0369a1', on: '#ffffff' },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Warm stone & lime',
    neutral: neutrals.stone,
    dark: { accent: '#a3e635', hover: '#bef264', fg: '#bef264', on: '#1a2e05' },
    light: { accent: '#4d7c0f', hover: '#3f6212', fg: '#3f6212', on: '#ffffff' },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Charcoal & orange',
    neutral: neutrals.zinc,
    dark: { accent: '#fb923c', hover: '#fdba74', fg: '#fdba74', on: '#431407' },
    light: { accent: '#c2410c', hover: '#9a3412', fg: '#c2410c', on: '#ffffff' },
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Gray & pink',
    neutral: neutrals.gray,
    dark: { accent: '#fb7185', hover: '#fda4af', fg: '#fda4af', on: '#4c0519' },
    light: { accent: '#e11d48', hover: '#be123c', fg: '#be123c', on: '#ffffff' },
  },
  {
    id: 'grape',
    name: 'Grape',
    description: 'Plum & violet',
    neutral: neutrals.grape,
    dark: { accent: '#a78bfa', hover: '#c4b5fd', fg: '#c4b5fd', on: '#2e1065' },
    light: { accent: '#7c3aed', hover: '#6d28d9', fg: '#6d28d9', on: '#ffffff' },
  },
  {
    id: 'mono',
    name: 'Mono',
    description: 'Pure black & white',
    neutral: neutrals.neutral,
    dark: { accent: '#f5f5f5', hover: '#ffffff', fg: '#ffffff', on: '#0a0a0a' },
    light: { accent: '#171717', hover: '#404040', fg: '#0a0a0a', on: '#ffffff' },
  },
]

export type ThemeId = (typeof THEMES)[number]['id']
export type ColorMode = 'system' | 'light' | 'dark'
export type ResolvedMode = 'light' | 'dark'

export const getTheme = (id: string) => THEMES.find((t) => t.id === id) ?? THEMES[0]

const STEPS = [950, 900, 800, 700, 600, 500, 400, 300, 200, 100] as const

/** Map the semantic neutral steps onto a palette for the given mode. */
function neutralSteps(s: Scale, mode: ResolvedMode): Record<(typeof STEPS)[number], string> {
  if (mode === 'dark') return { 950: s[950], 900: s[900], 800: s[800], 700: s[700], 600: s[600], 500: s[500], 400: s[400], 300: s[300], 200: s[200], 100: s[100] }
  // Light: tinted page, white cards, and the rest of the scale inverted.
  return { 950: s[100], 900: '#ffffff', 800: s[200], 700: s[300], 600: s[400], 500: s[500], 400: s[600], 300: s[700], 200: s[800], 100: s[900] }
}

export function themeVars(theme: Theme, mode: ResolvedMode): Record<string, string> {
  const n = neutralSteps(theme.neutral, mode)
  const a = theme[mode]
  const vars: Record<string, string> = {
    '--color-accent': a.accent,
    '--color-accent-hover': a.hover,
    '--color-accent-fg': a.fg,
    '--color-on-accent': a.on,
    '--color-danger': mode === 'dark' ? '#f87171' : '#dc2626',
    '--color-success': mode === 'dark' ? '#34d399' : '#047857',
  }
  for (const k of STEPS) vars[`--color-n-${k}`] = n[k]
  return vars
}

export function resolveMode(mode: ColorMode): ResolvedMode {
  if (mode !== 'system') return mode
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

/** Apply a theme to the document. Safe to call before React renders. */
export function applyTheme(themeId: string, mode: ColorMode) {
  const resolved = resolveMode(mode)
  const vars = themeVars(getTheme(themeId), resolved)
  const root = document.documentElement
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
  root.style.colorScheme = resolved
  root.style.background = vars['--color-n-950']
  root.dataset.mode = resolved
  const bg = vars['--color-n-950']
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg)
  // Cached so index.html can paint the right background before JS loads.
  try {
    localStorage.setItem('dt-boot', JSON.stringify({ bg, scheme: resolved }))
  } catch {
    /* storage unavailable */
  }
}
