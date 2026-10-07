import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'
import { CompatGate } from './app/CompatGate'
import { ErrorBoundary } from './app/ErrorBoundary'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <CompatGate>
        <App />
      </CompatGate>
    </ErrorBoundary>
  </React.StrictMode>
)
