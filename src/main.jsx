import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Vérification que l'élément root existe
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found. Make sure index.html has <div id="root"></div>')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)