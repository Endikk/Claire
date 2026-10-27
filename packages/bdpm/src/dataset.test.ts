import { describe, expect, test } from 'vitest'
import { buildDataset, isBdpmDataset } from './dataset'

const valid = buildDataset(
  [
    {
      cis: '1',
      denomination: 'DOLIPRANE 1000 mg, comprimé',
      forme: 'comprimé',
      voies: ['orale'],
      commercialisee: true,
      dateAmm: '2002-07-09',
      titulaire: 'LABO',
    },
  ],
  [
    {
      cis: '1',
      element: 'comprimé',
      substanceCode: '02202',
      substance: 'PARACÉTAMOL',
      nature: 'SA',
      liaison: '1',
    },
  ],
  { updatedAt: '2026-09-29', generatedAt: '2026-10-27T10:00:00.000Z' },
)

describe('isBdpmDataset', () => {
  test('accepte un jeu de données construit par buildDataset', () => {
    expect(isBdpmDataset(JSON.parse(JSON.stringify(valid)))).toBe(true)
  })

  test('refuse des compositions absentes', () => {
    expect(isBdpmDataset({ ...valid, ingredients: null })).toBe(false)
  })

  test('refuse une spécialité sans code CIS', () => {
    expect(isBdpmDataset({ ...valid, products: [{ name: 'DOLIPRANE' }] })).toBe(false)
  })

  test('refuse une date de mise à jour mal formée', () => {
    expect(isBdpmDataset({ ...valid, meta: { ...valid.meta, updatedAt: '29/09/2026' } })).toBe(false)
  })

  test('refuse autre chose qu’un objet', () => {
    expect(isBdpmDataset('bdpm')).toBe(false)
  })
})
