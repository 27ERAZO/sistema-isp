import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'

import VistaControlAcceso from './components/VistaControlAcceso'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <VistaControlAcceso/>
  </StrictMode>,
)
