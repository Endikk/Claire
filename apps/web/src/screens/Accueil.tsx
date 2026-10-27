import { AVERTISSEMENT } from '@claire/engine'
import { formatDate } from '../lib/date'
import { isStale, STALE_AFTER_DAYS } from '../lib/fraicheur'
import { useAnalyse, useSource } from '../state/context'

export function Accueil() {
  const start = useAnalyse((state) => state.start)
  const versions = useSource().versions()
  const staleVersions = versions.filter((version) => isStale(version.updatedAt, new Date()))

  return (
    <main className="screen accueil">
      <header className="accueil-header">
        <p className="brand">Claire</p>
        <h1>Analyser une ordonnance</h1>
        <p className="lede">
          Photographiez l’ordonnance, saisissez les médicaments, cochez le profil du patient : Claire signale
          les doublons et dit ce qu’elle n’a pas pu vérifier.
        </p>
      </header>

      <div className="action-bar">
        <button type="button" className="button-primary" onClick={start}>
          Nouvelle analyse
        </button>
      </div>

      {staleVersions.length > 0 && (
        <p className="form-error" role="alert">
          Les données des médicaments datent de plus de {STALE_AFTER_DAYS} jours. Reconnectez le téléphone à
          internet et rechargez l’application pour les mettre à jour.
        </p>
      )}

      <section className="notice" aria-labelledby="accueil-confidentialite">
        <h2 id="accueil-confidentialite">Aucune donnée du patient ne quitte ce téléphone</h2>
        <p>
          La photo et la saisie restent dans la mémoire du téléphone. Tout est effacé à la fin de l’analyse ou
          à la fermeture de l’application.
        </p>
      </section>

      <footer className="accueil-footer">
        <p>{AVERTISSEMENT}</p>
        <p>
          Données :{' '}
          {versions
            .map((version) => `${version.name}, mise à jour du ${formatDate(version.updatedAt)}`)
            .join(' ; ')}
        </p>
      </footer>
    </main>
  )
}
