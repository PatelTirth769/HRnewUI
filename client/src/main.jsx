import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/auth.jsx'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'
import { registerServiceWorker } from './pwa/registerSW.js'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </BrowserRouter>
)

// Register the PWA service worker (production + secure context only).
registerServiceWorker()
