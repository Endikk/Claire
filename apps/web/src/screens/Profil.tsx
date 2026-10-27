import { analyze, SITUATION_LABELS, type Situation } from '@claire/engine'
import { useId, useState } from 'react'
import { NumberPrecision } from '../components/NumberPrecision'
import { StepHeader } from '../components/StepHeader'
import { toPrescriptionLines } from '../lib/lignes'
import { useAnalyse, useAnalyseStore, useSource } from '../state/context'

const SITUATIONS = Object.keys(SITUATION_LABELS) as Situation[]
const AGE_MAX_ANS = 120
const POIDS_MIN_KG = 0.5
const POIDS_MAX_KG = 250
const CLAIRANCE_MAX_ML_MIN = 200
const MAX_ALLERGIES_LENGTH = 200

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function Precisions() {
  const profile = useAnalyse((state) => state.profile)
  const setPrecisions = useAnalyse((state) => state.setPrecisions)
  const id = useId()
  const has = (situation: Situation) => profile.situations.includes(situation)

  return (
    <div className="precisions">
      {has('enceinte') && (
        <div className="precision">
          <label htmlFor={`${id}-trimestre`}>Trimestre de grossesse</label>
          <select
            id={`${id}-trimestre`}
            value={profile.trimestre ?? ''}
            onChange={(event) =>
              setPrecisions({
                trimestre: event.target.value === '' ? undefined : (Number(event.target.value) as 1 | 2 | 3),
              })
            }
          >
            <option value="">Non précisé</option>
            <option value="1">1er trimestre</option>
            <option value="2">2e trimestre</option>
            <option value="3">3e trimestre</option>
          </select>
        </div>
      )}
      {(has('enfant') || has('nourrisson')) && (
        <>
          <NumberPrecision
            label="Âge"
            unit="ans"
            min={0}
            max={AGE_MAX_ANS}
            value={profile.ageAns}
            onChange={(ageAns) => setPrecisions({ ageAns })}
          />
          <NumberPrecision
            label="Poids"
            unit="kg"
            min={POIDS_MIN_KG}
            max={POIDS_MAX_KG}
            value={profile.poidsKg}
            onChange={(poidsKg) => setPrecisions({ poidsKg })}
          />
        </>
      )}
      {has('insuffisance-renale') && (
        <NumberPrecision
          label="Clairance, si elle est connue"
          unit="ml/min"
          min={0}
          max={CLAIRANCE_MAX_ML_MIN}
          value={profile.clairanceMlMin}
          onChange={(clairanceMlMin) => setPrecisions({ clairanceMlMin })}
        />
      )}
      {has('allergies') && (
        <div className="precision">
          <label htmlFor={`${id}-allergies`}>Allergies connues (médicament, aliment)</label>
          <input
            id={`${id}-allergies`}
            value={profile.allergies ?? ''}
            maxLength={MAX_ALLERGIES_LENGTH}
            autoComplete="off"
            onChange={(event) => setPrecisions({ allergies: event.target.value || undefined })}
          />
        </div>
      )}
    </div>
  )
}

export function Profil() {
  const source = useSource()
  const store = useAnalyseStore()
  const lines = useAnalyse((state) => state.lines)
  const profile = useAnalyse((state) => state.profile)
  const toggleSituation = useAnalyse((state) => state.toggleSituation)
  const goTo = useAnalyse((state) => state.goTo)
  const setResult = useAnalyse((state) => state.setResult)
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyse() {
    setIsAnalysing(true)
    setError(null)
    try {
      const result = await analyze(toPrescriptionLines(lines), profile, source)
      // Si l'analyse a été effacée ou modifiée pendant le calcul, ce résultat ne correspond plus à rien.
      const current = store.getState()
      if (current.step !== 'profil' || current.lines !== lines || current.profile !== profile) return
      setResult(result)
    } catch {
      setError('L’analyse a échoué. Les données saisies sont conservées : relancez l’analyse.')
      setIsAnalysing(false)
    }
  }

  return (
    <main className="screen">
      <StepHeader current="Profil patient" />
      <p className="lede">
        Cochez ce qui concerne le patient. Aucune case cochée : l’analyse portera sur l’ordonnance seule.
      </p>

      <fieldset className="situations" disabled={isAnalysing}>
        <legend className="visually-hidden">Situations du patient</legend>
        {SITUATIONS.map((situation) => (
          <label key={situation} className="situation">
            <input
              type="checkbox"
              checked={profile.situations.includes(situation)}
              onChange={() => toggleSituation(situation)}
            />
            <span>{capitalize(SITUATION_LABELS[situation])}</span>
          </label>
        ))}
      </fieldset>

      <Precisions />

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="action-bar">
        <button
          type="button"
          className="button-quiet"
          disabled={isAnalysing}
          onClick={() => goTo('ordonnance')}
        >
          Retour
        </button>
        <button type="button" className="button-primary" disabled={isAnalysing} onClick={handleAnalyse}>
          {isAnalysing ? 'Analyse en cours' : 'Lancer l’analyse'}
        </button>
      </div>
    </main>
  )
}
