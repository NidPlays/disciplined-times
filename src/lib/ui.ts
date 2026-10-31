import { create } from 'zustand'

export interface Toast {
  id: number
  message: string
  action?: { label: string; run: () => void }
}

interface UiState {
  toast: Toast | null
  notify: (message: string, action?: Toast['action']) => void
  dismiss: () => void
}

let timer: ReturnType<typeof setTimeout> | undefined

export const useUi = create<UiState>()((set) => ({
  toast: null,
  notify: (message, action) => {
    clearTimeout(timer)
    const id = Date.now()
    set({ toast: { id, message, action } })
    timer = setTimeout(() => set((s) => (s.toast?.id === id ? { toast: null } : s)), 4000)
  },
  dismiss: () => set({ toast: null }),
}))

export function haptic(ms = 10) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* not supported */
  }
}
