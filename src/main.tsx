

import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

console.log('🚀 main.tsx loaded!')

try {
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
  document.body.innerHTML = `<div style="padding: 20px; color: red; font-family: Arial;"><h1>Error Loading App</h1><p>${errorMessage}</p></div>`
} 