import { noticeUrl } from '@claire/bdpm'
import {
  AVERTISSEMENT,
  type PatientProfile,
  RAPPEL_TRAITEMENTS_ABSENTS,
  SITUATION_LABELS,
} from '@claire/engine'
import { AlertItem } from '../components/AlertItem'
import { StepHeader } from '../components/StepHeader'
import { formatDate } from '../lib/date'
import { useAnalyse } from '../state/context'

function describeProfile(profile: PatientProfile): string {
  return profile.situations
    .map((situation) => {
      const label = SITUATION_LABELS[situation]
      if (situation === 'enceinte' && profile.trimestre) return `${label} (${profile.trimestre}e trimestre)`
      return label
    })
    .join(', ')
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count > 1 ? 's' : ''}`
}

export function Resultats() {
  const result = useAnalyse((state) => state.result)
  const lines = useAnalyse((state) => state.lines)
  const profile = useAnalyse((state) => state.profile)
  const goTo = useAnalyse((state) => state.goTo)
  const reset = useAnalyse((state) => state.reset)

  if (!result) return null

  const lineLabels = new Map(lines.map((line) => [line.id, line.label]))
  const { scope } = result
  const recognized = lines.filter(
    (line) => line.productId !== null && scope.recognizedLineIds.includes(line.id),
  )

  return (
    <main className="screen">
      <StepHeader current="Résultats" />

      <section className="scope" aria-labelledby="scope-title">
        <h2 id="scope-title" className="visually-hidden">
          Périmètre de l’analyse
        </h2>
        <p>
          Analyse portée sur {plural(scope.lineCount, 'médicament')}, dont {scope.recognizedCount} reconnu
          {scope.recognizedCount > 1 ? 's' : ''} dans les données.
        </p>
        <p>
          {scope.withProfile
            ? `Profil pris en compte : ${describeProfile(profile)}.`
            : 'Analyse sans profil patient : aucune case cochée.'}
        </p>
        <p>{RAPPEL_TRAITEMENTS_ABSENTS}</p>
      </section>

      <section aria-labelledby="controles-title">
        <h2 id="controles-title">Contrôles effectués</h2>
        <ul className="checks">
          {scope.checksPerformed.map((check) => (
            <li key={check.kind}>
              <p>
                {check.label} :{' '}
                {check.alertCount === 0 ? 'aucune alerte' : plural(check.alertCount, 'alerte')}.
              </p>
              <p className="hint">{check.limit}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="alertes-title">
        <h2 id="alertes-title">Alertes, de la plus grave à la moins grave</h2>
        <ol className="alerts">
          {result.alerts.map((alert) => (
            <AlertItem
              key={`${alert.kind}-${alert.lineIds.join('-')}-${alert.problem}`}
              alert={alert}
              lineLabels={lineLabels}
            />
          ))}
        </ol>
      </section>

      {recognized.length > 0 && (
        <section aria-labelledby="fiches-title">
          <h2 id="fiches-title">Fiches conseils</h2>
          <p className="hint">
            Chaque lien ouvre la notice officielle sur le site public de la BDPM (ANSM) : le nom du médicament
            lui est transmis, aucune donnée du patient.
          </p>
          <ul className="notices">
            {recognized.map((line) => (
              <li key={line.id}>
                <a href={noticeUrl(line.productId!)} target="_blank" rel="noopener noreferrer">
                  Notice de {line.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="results-footer">
        <p>{AVERTISSEMENT}</p>
        <p>
          Sources :{' '}
          {result.sources
            .map((item) => `${item.name}, mise à jour du ${formatDate(item.updatedAt)}`)
            .join(' ; ')}
        </p>
      </footer>

      <div className="action-bar">
        <button type="button" className="button-quiet" onClick={() => goTo('ordonnance')}>
          Modifier l’ordonnance
        </button>
        <button type="button" className="button-primary" onClick={reset}>
          Terminer et effacer
        </button>
      </div>
    </main>
  )
}
