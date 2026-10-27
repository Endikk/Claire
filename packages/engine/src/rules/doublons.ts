import type { ActiveIngredient, Alert, CheckPerformed, CompositionFact, PrescriptionLine } from '../types'

export const CONTROLE_DOUBLONS: Omit<CheckPerformed, 'alertCount'> = {
  kind: 'doublon',
  label: 'Doublons de principe actif',
}

export interface ResolvedLine {
  line: PrescriptionLine
  composition: CompositionFact
}

interface IngredientGroup {
  ingredient: ActiveIngredient
  lines: ResolvedLine[]
}

/** Une alerte par principe actif présent dans au moins deux lignes de l'ordonnance. */
export function doublonsDePrincipeActif(resolved: ResolvedLine[]): Alert[] {
  const groups = new Map<string, IngredientGroup>()

  for (const entry of resolved) {
    for (const ingredient of entry.composition.ingredients) {
      const group = groups.get(ingredient.code) ?? { ingredient, lines: [] }
      if (!group.lines.some((existing) => existing.line.id === entry.line.id)) {
        groups.set(ingredient.code, { ingredient, lines: [...group.lines, entry] })
      }
    }
  }

  return [...groups.values()]
    .filter((group) => group.lines.length >= 2)
    .map((group) => ({
      kind: 'doublon',
      lineIds: group.lines.map((entry) => entry.line.id),
      problem: `Principe actif en double : ${group.ingredient.name}.`,
      suggestedAction: 'S’assurer que l’association est voulue par le prescripteur.',
      source: group.lines[0]!.composition.source,
    }))
}
