import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { templates } from './data/templates'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App templates={templates} />
  </StrictMode>,
)
