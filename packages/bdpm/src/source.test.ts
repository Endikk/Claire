import { describe, expect, test } from 'vitest'
import { buildDataset } from './dataset'
import type { Composition, Specialite } from './parse'
import { createBdpmSource } from './source'

function specialite(cis: string, denomination: string, commercialisee = true): Specialite {
  return {
    cis,
    denomination,
    forme: 'comprimé',
    voies: ['orale'],
    commercialisee,
    dateAmm: '2002-07-09',
    titulaire: 'LABO',
  }
}

function compo(cis: string, substanceCode: string, substance: string): Composition {
  return { cis, element: 'comprimé', substanceCode, substance, nature: 'SA', liaison: '1' }
}

const dataset = buildDataset(
  [
    specialite('1', 'DOLIPRANE 1000 mg, comprimé'),
    specialite('2', 'DOLIPRANE 500 mg, comprimé'),
    specialite('3', 'PARACÉTAMOL BIOGARAN 500 mg, comprimé'),
    specialite('4', 'DOLIPRANE 1000 mg, suppositoire', false),
    specialite('5', 'ADVIL 200 mg, comprimé enrobé'),
  ],
  [compo('1', '02202', 'PARACÉTAMOL'), compo('3', '02202', 'PARACÉTAMOL'), compo('5', '00513', 'IBUPROFÈNE')],
  { updatedAt: '2026-09-29', generatedAt: '2026-10-27T10:00:00.000Z' },
)

describe('source BDPM', () => {
  test('donne la composition d’une spécialité avec sa source datée', async () => {
    const source = createBdpmSource(dataset)

    expect(await source.composition('1')).toEqual({
      ingredients: [{ code: '02202', name: 'PARACÉTAMOL' }],
      source: { name: 'BDPM (ANSM)', updatedAt: '2026-09-29' },
    })
  })

  test('ne donne rien pour une spécialité absente des données', async () => {
    const source = createBdpmSource(dataset)

    expect(await source.composition('999')).toBeUndefined()
  })

  test('ne confond pas un identifiant avec une propriété héritée de l’objet', async () => {
    expect(await createBdpmSource(dataset).composition('constructor')).toBeUndefined()
  })

  test('annonce la BDPM et sa date de mise à jour', () => {
    expect(createBdpmSource(dataset).versions()).toEqual([{ name: 'BDPM (ANSM)', updatedAt: '2026-09-29' }])
  })
})

describe('recherche de spécialités', () => {
  test('trouve une spécialité sans tenir compte des accents ni de la casse', () => {
    const names = createBdpmSource(dataset)
      .search('paracetamol')
      .map((product) => product.name)

    expect(names).toEqual(['PARACÉTAMOL BIOGARAN 500 mg, comprimé'])
  })

  test('exige que chaque mot tapé commence un mot du nom', () => {
    const names = createBdpmSource(dataset)
      .search('dolip 1000')
      .map((product) => product.name)

    expect(names).toEqual(['DOLIPRANE 1000 mg, comprimé', 'DOLIPRANE 1000 mg, suppositoire'])
  })

  test('place les spécialités commercialisées avant les autres', () => {
    const results = createBdpmSource(dataset).search('doliprane')

    expect(results.at(-1)?.commercialisee).toBe(false)
  })

  test('ne renvoie rien pour une recherche vide', () => {
    expect(createBdpmSource(dataset).search('   ')).toEqual([])
  })

  test('indique le titulaire pour distinguer deux spécialités de même nom', () => {
    expect(createBdpmSource(dataset).search('advil')[0]?.titulaire).toBe('LABO')
  })

  test('limite le nombre de résultats', () => {
    expect(createBdpmSource(dataset).search('doliprane', 2)).toHaveLength(2)
  })
})
