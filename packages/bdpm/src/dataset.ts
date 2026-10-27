import type { ActiveIngredient } from '@claire/engine'
import { activeIngredientsOf, type Composition, type Specialite } from './parse'

export const BDPM_SOURCE_NAME = 'BDPM (ANSM)'

export interface BdpmProduct {
  cis: string
  name: string
  forme: string
  commercialisee: boolean
  dateAmm: string
  titulaire: string
}

/** Données embarquées dans l'application, générées chaque mois depuis les fichiers de la BDPM. */
export interface BdpmDataset {
  meta: { source: string; updatedAt: string; generatedAt: string }
  products: BdpmProduct[]
  ingredients: Record<string, ActiveIngredient[]>
}

export function buildDataset(
  specialites: Specialite[],
  compositions: Composition[],
  dates: { updatedAt: string; generatedAt: string },
): BdpmDataset {
  const compositionsByCis = new Map<string, Composition[]>()
  for (const composition of compositions) {
    compositionsByCis.set(composition.cis, [...(compositionsByCis.get(composition.cis) ?? []), composition])
  }

  const products = specialites
    .map((specialite) => ({
      cis: specialite.cis,
      name: specialite.denomination,
      forme: specialite.forme,
      commercialisee: specialite.commercialisee,
      dateAmm: specialite.dateAmm,
      titulaire: specialite.titulaire,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))

  const ingredients = Object.fromEntries(
    specialites
      .filter((specialite) => compositionsByCis.has(specialite.cis))
      .map((specialite) => [specialite.cis, activeIngredientsOf(compositionsByCis.get(specialite.cis)!)]),
  )

  return { meta: { source: BDPM_SOURCE_NAME, ...dates }, products, ingredients }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isProduct(value: unknown): value is BdpmProduct {
  return (
    isRecord(value) &&
    typeof value.cis === 'string' &&
    typeof value.name === 'string' &&
    typeof value.forme === 'string' &&
    typeof value.commercialisee === 'boolean' &&
    typeof value.dateAmm === 'string' &&
    typeof value.titulaire === 'string'
  )
}

function isIngredientList(value: unknown): value is ActiveIngredient[] {
  return (
    Array.isArray(value) &&
    value.every((item) => isRecord(item) && typeof item.code === 'string' && typeof item.name === 'string')
  )
}

/** Vérifie le fichier chargé par l'application avant de s'en servir : une donnée mal formée ne doit pas passer pour une absence. */
export function isBdpmDataset(value: unknown): value is BdpmDataset {
  if (!isRecord(value) || !isRecord(value.meta) || !isRecord(value.ingredients)) return false
  const { meta, products, ingredients } = value
  return (
    typeof meta.source === 'string' &&
    typeof meta.updatedAt === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(meta.updatedAt) &&
    Array.isArray(products) &&
    products.every(isProduct) &&
    Object.values(ingredients).every(isIngredientList)
  )
}
