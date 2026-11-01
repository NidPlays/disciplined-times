/** Remembers that the walkthrough was finished or skipped. Kept out of the main store
 *  so importing a backup or "Clear all" doesn't bring the walkthrough back. */
export const ONBOARDED_KEY = 'dt-onboarded'
const STORE_KEY = 'disciplined-times'

type Read = (key: string) => string | null

/**
 * Whether to show the first-run walkthrough. People who already have goals or logged
 * time from before the walkthrough existed know the app, so they don't get it.
 */
export function needsOnboarding(read: Read): boolean {
  try {
    if (read(ONBOARDED_KEY)) return false
    const raw = read(STORE_KEY)
    if (!raw) return true
    const s = JSON.parse(raw)?.state
    return !(s?.goals?.length || s?.logs?.length)
  } catch {
    // Storage blocked or corrupt: don't nag on every visit.
    return false
  }
}

export function markOnboarded(write: (key: string, value: string) => void = (k, v) => localStorage.setItem(k, v)) {
  try {
    write(ONBOARDED_KEY, String(Date.now()))
  } catch {
    /* storage unavailable: worst case the walkthrough shows again next visit */
  }
}

/** Checked once at load, before the store writes anything back to storage. */
export const firstRun = typeof localStorage !== 'undefined' && needsOnboarding((k) => localStorage.getItem(k))
