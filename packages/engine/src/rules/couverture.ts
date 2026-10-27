import type { Alert, PrescriptionLine } from '../types'

/** Contrôles qu'aucune source actuelle ne permet : ils sont affichés à côté des contrôles réalisés. */
export const CONTROLES_NON_REALISES = [
  'Interactions médicamenteuses',
  'Contre-indications',
  'Posologies',
  'Durées de traitement',
  'Doublons de classe thérapeutique',
] as const

export function medicamentsNonReconnus(lines: PrescriptionLine[], recognizedIds: Set<string>): Alert[] {
  return lines
    .filter((line) => !recognizedIds.has(line.id))
    .map((line) => ({
      kind: 'information-insuffisante',
      lineIds: [line.id],
      problem: 'Médicament non identifié dans la base : non inclus dans l’analyse.',
      suggestedAction: 'Contrôler ce médicament manuellement.',
      source: null,
    }))
}
