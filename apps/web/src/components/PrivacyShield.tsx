import { type ReactNode, useEffect, useState } from 'react'
import { useAnalyseStore } from '../state/context'

/** Durée en arrière-plan au-delà de laquelle l'analyse est effacée (cahier des charges §7). */
export const BACKGROUND_RESET_MS = 5 * 60 * 1000

type Props = { children: ReactNode }

/**
 * Masque l'écran dès que l'application passe en arrière-plan, pour que l'aperçu du sélecteur
 * d'applications ne montre pas l'ordonnance, et efface l'analyse après un trop long délai.
 */
export function PrivacyShield({ children }: Props) {
  const store = useAnalyseStore()
  const [isHidden, setIsHidden] = useState(false)

  useEffect(() => {
    let hiddenSince: number | null = null

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        hiddenSince = Date.now()
        setIsHidden(true)
        return
      }
      if (hiddenSince !== null && Date.now() - hiddenSince > BACKGROUND_RESET_MS) {
        store.getState().reset()
      }
      hiddenSince = null
      setIsHidden(false)
    }

    function handlePageHide() {
      store.getState().reset()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [store])

  return (
    <>
      <div className="app" aria-hidden={isHidden} inert={isHidden}>
        {children}
      </div>
      {isHidden && <div className="privacy-shield">Claire</div>}
    </>
  )
}
