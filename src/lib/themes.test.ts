import { describe, expect, test } from 'bun:test'
import { GOAL_COLORS, ON_GOAL, THEMES, contrast, themeVars } from './themes'

// WCAG 2.2 thresholds
const AA_TEXT = 4.5 // normal-size text (1.4.3)
const AAA_TEXT = 7 // enhanced (1.4.6), used for primary text
const UI = 3 // non-text UI: rings, outlines, progress (1.4.11)

/** Every surface text is drawn on: page, cards, chips/active items. */
const SURFACES = ['n-950', 'n-900', 'n-800']

describe('themes', () => {
  test('ids are unique', () => {
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length)
  })

  for (const t of THEMES) {
    for (const mode of ['dark', 'light'] as const) {
      describe(`${t.name} ${mode}`, () => {
        const v = themeVars(t, mode)
        const c = (k: string) => v[`--color-${k}`]

        for (const [fg, min] of [
          ['n-100', AAA_TEXT],
          ['n-200', AAA_TEXT],
          ['n-300', AAA_TEXT],
          ['n-400', AA_TEXT],
          ['n-500', AA_TEXT],
          ['accent-fg', AA_TEXT],
          ['success', AA_TEXT],
          ['danger', AA_TEXT],
        ] as const) {
          test(`${fg} text is readable on every surface (≥ ${min}:1)`, () => {
            for (const bg of SURFACES) expect(contrast(c(fg), c(bg))).toBeGreaterThanOrEqual(min)
          })
        }

        test('button labels on the accent colour (≥ 4.5:1)', () => {
          expect(contrast(c('on-accent'), c('accent'))).toBeGreaterThanOrEqual(AA_TEXT)
          expect(contrast(c('on-accent'), c('accent-hover'))).toBeGreaterThanOrEqual(AA_TEXT)
        })

        test('accent and outline graphics stand out from cards (≥ 3:1)', () => {
          expect(contrast(c('accent'), c('n-900'))).toBeGreaterThanOrEqual(UI)
          expect(contrast(c('n-600'), c('n-900'))).toBeGreaterThanOrEqual(UI)
        })

        test('text hierarchy stays ordered', () => {
          const bg = c('n-900')
          expect(contrast(c('n-100'), bg)).toBeGreaterThanOrEqual(contrast(c('n-300'), bg))
          expect(contrast(c('n-300'), bg)).toBeGreaterThanOrEqual(contrast(c('n-400'), bg))
          expect(contrast(c('n-400'), bg)).toBeGreaterThanOrEqual(contrast(c('n-500'), bg))
        })
      })
    }
  }

  test('labels on goal colours are readable (≥ 4.5:1)', () => {
    for (const g of GOAL_COLORS) expect(contrast(ON_GOAL, g)).toBeGreaterThanOrEqual(AA_TEXT)
  })
})
