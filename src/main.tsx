import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { registerServiceWorker } from './utils/serviceWorker'

console.log('🚀 main.tsx loaded!')

// Safari compatibility check
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

if (isSafari || isIOS) {
  console.log('🍎 Safari/iOS detected - using compatibility mode')
}

// Register service worker for CORS proxy
registerServiceWorker()
  .then(() => console.log('✅ Service worker registered successfully'))
  .catch(error => console.error('❌ Service worker registration failed:', error))

// Ensure CSS variables are set before rendering
function ensureCSSVariables() {
  const root = document.documentElement
  const bgPrimary = getComputedStyle(root).getPropertyValue('--bg-primary')
  
  // If CSS variables are not set, we have a problem
  if (!bgPrimary || bgPrimary.trim() === '') {
    console.warn('⚠️ CSS variables not found, initializing defaults')
    
    // Set critical CSS variables if missing
    root.style.setProperty('--bg-primary', '#ffffff')
    root.style.setProperty('--bg-secondary', '#f9fafb')
    root.style.setProperty('--bg-tertiary', '#f3f4f6')
    root.style.setProperty('--text-primary', '#111827')
    root.style.setProperty('--text-secondary', '#4b5563')
    root.style.setProperty('--text-tertiary', '#6b7280')
    root.style.setProperty('--border-primary', '#e5e7eb')
    root.style.setProperty('--border-secondary', '#d1d5db')
  }
}

try {
  // Ensure CSS variables before rendering
  ensureCSSVariables()
  
  const rootElement = document.getElementById('root')
  console.log('📍 Root element:', rootElement)
  
  if (!rootElement) {
    throw new Error('Root element not found!')
  }
  
  const root = ReactDOM.createRoot(rootElement)
  console.log('✅ React root created')
  
  root.render(
    <App />
  )
  console.log('✅ App rendered!')
} catch (error) {
  console.error('❌ Error in main.tsx:', error)
  const errorMessage = error instanceof Error ? error.message : String(error)
  
  // Enhanced Safari-friendly error display
  const errorDiv = document.createElement('div')
  errorDiv.style.cssText = `
    padding: 20px;
    margin: 20px;
    background: #fee;
    border: 2px solid #f44;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    color: #333;
    line-height: 1.5;
  `
  
  errorDiv.innerHTML = `
    <h2 style="margin: 0 0 10px 0; color: #d00;">🚨 App Loading Error</h2>
    <p><strong>Error:</strong> ${errorMessage}</p>
    <p><strong>Browser:</strong> ${navigator.userAgent}</p>
    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
    <details style="margin-top: 15px;">
      <summary style="cursor: pointer; font-weight: bold;">Technical Details</summary>
      <pre style="background: #f5f5f5; padding: 10px; margin-top: 10px; overflow: auto; font-size: 12px;">${error instanceof Error ? error.stack || 'No stack trace available' : 'Unknown error'}</pre>
    </details>
    <p style="margin-top: 15px; font-size: 14px; color: #666;">
      If this problem persists on Safari, try refreshing the page or check the browser console for more details.
    </p>
  `
  
  document.body.appendChild(errorDiv)
} 