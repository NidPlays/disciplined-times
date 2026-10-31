/**
 * External links tapped inside the installed PWA open in an in-app Custom Tab (or get grabbed by
 * another app), which doesn't work well for sites like GitHub. On Android we hand the link to
 * Chrome explicitly with an intent: URL; if Chrome isn't installed, Android falls back to the
 * plain https URL. Other platforms keep the normal link.
 */
export function chromeHref(url: string, userAgent: string = typeof navigator === 'undefined' ? '' : navigator.userAgent): string {
  if (!/android/i.test(userAgent)) return url
  const u = new URL(url)
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return url
  const scheme = u.protocol.slice(0, -1)
  const fallback = encodeURIComponent(url)
  return `intent://${u.host}${u.pathname}${u.search}${u.hash}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${fallback};end`
}
