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
          Saisissez l’ordonnance et le profil du patient : les alertes s’affichent par ordre de gravité.
        </p>
      </header>

      <div className="action-bar">
        <button type="button" className="button-primary" onClick={start}>
          Nouvelle analyse
        </button>
      </div>

      {staleVersions.length > 0 && (
        <p className="form-error" role="alert">
          La base des médicaments a plus de {STALE_AFTER_DAYS} jours. Connectez l’appareil à internet puis
          relancez l’application pour la mettre à jour.
        </p>
      )}

      <section className="notice" aria-labelledby="accueil-confidentialite">
        <h2 id="accueil-confidentialite">Confidentialité</h2>
        <p>
          Les données saisies restent sur l’appareil. Elles ne sont ni envoyées ni enregistrées, et sont
          effacées à la fin de chaque analyse.
        </p>
      </section>

      <footer className="accueil-footer">
        <p>{AVERTISSEMENT}</p>
        <p>
          Base des médicaments :{' '}
          {versions
            .map((version) => `${version.name}, mise à jour du ${formatDate(version.updatedAt)}`)
            .join(' ; ')}
          .
        </p>
      </footer>
    </main>
  )
}
