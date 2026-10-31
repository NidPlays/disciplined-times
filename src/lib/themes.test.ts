import { describe, expect, test } from 'bun:test'
import { THEMES, themeVars } from './themes'

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

describe('themes', () => {
  test('ids are unique', () => {
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length)
  })

  for (const t of THEMES) {
    for (const mode of ['dark', 'light'] as const) {
      test(`${t.name} ${mode} is readable`, () => {
        const v = themeVars(t, mode)
        const c = (k: string) => v[`--color-${k}`]
        // Body text on page and on cards: WCAG AAA.
        expect(contrast(c('n-100'), c('n-950'))).toBeGreaterThanOrEqual(7)
        expect(contrast(c('n-100'), c('n-900'))).toBeGreaterThanOrEqual(7)
        // Secondary text on cards: WCAG AA for normal text.
        expect(contrast(c('n-400'), c('n-900'))).toBeGreaterThanOrEqual(4.5)
        // Button labels on accent, and accent-coloured text on cards: AA.
        expect(contrast(c('on-accent'), c('accent'))).toBeGreaterThanOrEqual(4.5)
        expect(contrast(c('accent-fg'), c('n-900'))).toBeGreaterThanOrEqual(4.5)
        expect(contrast(c('success'), c('n-900'))).toBeGreaterThanOrEqual(4.5)
        expect(contrast(c('danger'), c('n-900'))).toBeGreaterThanOrEqual(4.5)
      })
    }
  }
})
