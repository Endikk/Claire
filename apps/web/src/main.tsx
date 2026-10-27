import '@fontsource-variable/atkinson-hyperlegible-next'
import './styles.css'
import { registerSW } from 'virtual:pwa-register'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Boot } from './Boot'

registerSW({ immediate: true })

const root = document.getElementById('root')
if (!root) throw new Error('Élément #root introuvable dans index.html')

createRoot(root).render(
  <StrictMode>
    <Boot />
  </StrictMode>,
)
