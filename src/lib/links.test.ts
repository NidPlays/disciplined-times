import { describe, expect, test } from 'bun:test'
import { chromeHref } from './links'

const url = 'https://github.com/NidPlays/disciplined-times'

describe('chromeHref', () => {
  test('wraps links in a Chrome intent on Android', () => {
    expect(chromeHref(url, 'Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe(
      'intent://github.com/NidPlays/disciplined-times#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=https%3A%2F%2Fgithub.com%2FNidPlays%2Fdisciplined-times;end',
    )
  })
  test('leaves links alone elsewhere', () => {
    expect(chromeHref(url, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe(url)
    expect(chromeHref(url, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(url)
  })
})
