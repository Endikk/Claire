import { SITUATION_LABELS } from '../labels'
import type { Alert, PrescriptionLine, Situation } from '../types'

export function medicamentsNonReconnus(lines: PrescriptionLine[], recognizedIds: Set<string>): Alert[] {
  return lines
    .filter((line) => !recognizedIds.has(line.id))
    .map((line) => ({
      kind: 'information-insuffisante',
      lineIds: [line.id],
      problem: `« ${line.label} » n'a pas été reconnu dans les données : il n'est pas pris en compte dans l'analyse.`,
      suggestedAction: 'Vérifier ce médicament manuellement.',
      source: null,
    }))
}

/** Aucune source actuelle ne fournit les contre-indications par situation : chaque case cochée est signalée. */
export function situationsNonVerifiees(situations: Situation[]): Alert[] {
  return situations.map((situation) => ({
    kind: 'information-insuffisante',
    lineIds: [],
    problem: `Situation « ${SITUATION_LABELS[situation]} » non vérifiée : aucune source disponible ne donne les contre-indications correspondantes.`,
    suggestedAction: 'Vérifier les contre-indications liées à cette situation dans une base de référence.',
    source: null,
  }))
}

export function controlesNonRealises(): Alert[] {
  return [
    {
      kind: 'information-insuffisante',
      lineIds: [],
      problem:
        'Interactions, posologies et durées de traitement non vérifiées : aucune source disponible ne permet ces contrôles.',
      suggestedAction: 'Effectuer ces contrôles dans une base de référence.',
      source: null,
    },
  ]
}
