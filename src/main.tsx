import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { useStore } from './lib/store'
import { applyTheme } from './lib/themes'

// Apply the saved theme before the first render.
const { theme, colorMode } = useStore.getState().settings
applyTheme(theme, colorMode)

// Ask the browser not to evict our local data (important on iOS Safari).
navigator.storage?.persist?.().catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
