/**
 * External links tapped inside the installed PWA open in an in-app browser view (Custom Tab on
 * Android, Safari view on iOS) instead of a real browser. This returns an href that leaves the
 * app and opens a proper external browser:
 *  - Android: an intent: URL handed to Chrome; if Chrome isn't installed, Android falls back to
 *    the plain URL.
 *  - iOS (installed app only): the x-safari-https:// scheme, which opens Safari itself (iOS 17+).
 *  - Everywhere else: the normal link (desktop PWAs already open links in the default browser).
 */
export function externalHref(
  url: string,
  userAgent: string = typeof navigator === 'undefined' ? '' : navigator.userAgent,
  standalone = false,
): string {
  const u = new URL(url)
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return url
  const scheme = u.protocol.slice(0, -1)
  const rest = `${u.host}${u.pathname}${u.search}${u.hash}`
  if (/android/i.test(userAgent)) {
    return `intent://${rest}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`
  }
  if (standalone && /iphone|ipad|ipod/i.test(userAgent)) return `x-safari-${scheme}://${rest}`
  return url
}
