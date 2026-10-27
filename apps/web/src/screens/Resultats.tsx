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
          Résumé
        </h2>
        <p>
          Médicaments analysés : {scope.recognizedCount} sur {scope.lineCount}.
        </p>
        <p>{scope.withProfile ? `Profil : ${describeProfile(profile)}.` : 'Profil : non renseigné.'}</p>
        <p className="hint">{RAPPEL_TRAITEMENTS_ABSENTS}</p>
      </section>

      <section aria-labelledby="alertes-title">
        <h2 id="alertes-title">Alertes</h2>
        {result.alerts.length === 0 ? (
          <p className="empty">Aucune alerte sur les contrôles réalisés.</p>
        ) : (
          <ol className="alerts">
            {result.alerts.map((alert) => (
              <AlertItem
                key={`${alert.kind}-${alert.lineIds.join('-')}-${alert.problem}`}
                alert={alert}
                lineLabels={lineLabels}
              />
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="controles-title">
        <h2 id="controles-title">Contrôles</h2>
        <h3>Réalisés</h3>
        <ul className="checks">
          {scope.checksPerformed.map((check) => (
            <li key={check.kind}>
              {check.label} : {check.alertCount === 0 ? 'aucune alerte' : plural(check.alertCount, 'alerte')}
            </li>
          ))}
        </ul>
        <h3>Non réalisés</h3>
        <ul className="checks">
          {scope.checksNotPerformed.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      </section>

      {recognized.length > 0 && (
        <section aria-labelledby="notices-title">
          <h2 id="notices-title">Notices</h2>
          <p className="hint">Notices officielles, sur le site de l’ANSM.</p>
          <ul className="notices">
            {recognized.map((line) => (
              <li key={line.id}>
                <a href={noticeUrl(line.productId!)} target="_blank" rel="noopener noreferrer">
                  {line.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="results-footer">
        <p>{AVERTISSEMENT}</p>
        <p>
          Source :{' '}
          {result.sources
            .map((item) => `${item.name}, mise à jour du ${formatDate(item.updatedAt)}`)
            .join(' ; ')}
          .
        </p>
      </footer>

      <div className="action-bar">
        <button type="button" className="button-quiet" onClick={() => goTo('ordonnance')}>
          Modifier l’ordonnance
        </button>
        <button type="button" className="button-primary" onClick={reset}>
          Terminer
        </button>
      </div>
    </main>
  )
}
