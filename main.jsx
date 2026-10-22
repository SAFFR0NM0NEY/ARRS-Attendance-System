import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter allows users to navigate between website pages. */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
