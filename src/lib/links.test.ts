import { describe, expect, test } from 'bun:test'
import { externalHref } from './links'

const url = 'https://github.com/NidPlays/disciplined-times'
const android = 'Mozilla/5.0 (Linux; Android 14; Pixel 8)'
const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'

describe('externalHref', () => {
  test('hands links to the default browser on Android', () => {
    expect(externalHref(url, android)).toBe(
      'intent://github.com/NidPlays/disciplined-times#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url=https%3A%2F%2Fgithub.com%2FNidPlays%2Fdisciplined-times;end',
    )
  })
  test('opens Safari from the installed iOS app', () => {
    expect(externalHref(url, iphone, true)).toBe('x-safari-https://github.com/NidPlays/disciplined-times')
    expect(externalHref(url, iphone, false)).toBe(url)
  })
  test('leaves links alone on desktop', () => {
    expect(externalHref(url, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', true)).toBe(url)
  })
})
