import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Ask the browser not to evict our local data (important on iOS Safari).
navigator.storage?.persist?.().catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
