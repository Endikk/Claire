import { LineEditor } from '../components/LineEditor'
import { PhotoField } from '../components/PhotoField'
import { ProductSearch } from '../components/ProductSearch'
import { StepHeader } from '../components/StepHeader'
import { useAnalyse } from '../state/context'

export function Ordonnance() {
  const lines = useAnalyse((state) => state.lines)
  const addLine = useAnalyse((state) => state.addLine)
  const goTo = useAnalyse((state) => state.goTo)
  const reset = useAnalyse((state) => state.reset)

  return (
    <main className="screen">
      <StepHeader current="Ordonnance" />
      <PhotoField />

      <section aria-labelledby="medicaments-title">
        <h2 id="medicaments-title">Médicaments</h2>
        {lines.length === 0 ? (
          <p className="empty">Aucun médicament saisi.</p>
        ) : (
          <ol className="lines">
            {lines.map((line) => (
              <LineEditor key={line.id} line={line} />
            ))}
          </ol>
        )}
        <ProductSearch onSelect={addLine} />
      </section>

      <div className="action-bar">
        <button type="button" className="button-quiet" onClick={reset}>
          Annuler et effacer
        </button>
        <button
          type="button"
          className="button-primary"
          disabled={lines.length === 0}
          onClick={() => goTo('profil')}
        >
          Continuer
        </button>
      </div>
    </main>
  )
}
