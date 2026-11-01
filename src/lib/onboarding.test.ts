import { describe, expect, test } from 'bun:test'
import { markOnboarded, needsOnboarding, ONBOARDED_KEY } from './onboarding'

const reader = (data: Record<string, string>) => (k: string) => data[k] ?? null
const store = (goals: unknown[], logs: unknown[]) => JSON.stringify({ state: { goals, logs, settings: {} }, version: 1 })

describe('needsOnboarding', () => {
  test('brand-new visitor sees it', () => {
    expect(needsOnboarding(reader({}))).toBe(true)
  })

  test('saved store with no goals or logs still sees it', () => {
    expect(needsOnboarding(reader({ 'disciplined-times': store([], []) }))).toBe(true)
  })

  test('existing users with goals or logs skip it', () => {
    expect(needsOnboarding(reader({ 'disciplined-times': store([{ id: 'a' }], []) }))).toBe(false)
    expect(needsOnboarding(reader({ 'disciplined-times': store([], [{ id: 'l' }]) }))).toBe(false)
  })

  test('finished or skipped once means never again', () => {
    expect(needsOnboarding(reader({ [ONBOARDED_KEY]: '1' }))).toBe(false)
  })

  test('corrupt data or blocked storage does not nag', () => {
    expect(needsOnboarding(reader({ 'disciplined-times': '{nope' }))).toBe(false)
    expect(
      needsOnboarding(() => {
        throw new Error('blocked')
      }),
    ).toBe(false)
  })
})

describe('markOnboarded', () => {
  test('writes the flag', () => {
    const data: Record<string, string> = {}
    markOnboarded((k, v) => (data[k] = v))
    expect(needsOnboarding(reader(data))).toBe(false)
  })

  test('swallows storage errors', () => {
    expect(() =>
      markOnboarded(() => {
        throw new Error('quota')
      }),
    ).not.toThrow()
  })
})
