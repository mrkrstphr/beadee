import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Apply saved theme before first render to avoid flash
const savedTheme = localStorage.getItem('beadee-theme') || 'dark'
document.documentElement.dataset.theme = savedTheme

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
