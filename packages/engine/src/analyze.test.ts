import { describe, expect, test } from 'vitest'
import { analyze } from './analyze'
import type { CompositionFact, DrugKnowledgeSource, PrescriptionLine } from './types'

const BDPM = { name: 'BDPM (ANSM)', updatedAt: '2026-09-29' }

function sourceWith(compositions: Record<string, CompositionFact['ingredients']>): DrugKnowledgeSource {
  return {
    versions: () => [BDPM],
    composition: async (productId) => {
      const ingredients = compositions[productId]
      return ingredients ? { ingredients, source: BDPM } : undefined
    },
  }
}

const PARACETAMOL = { code: '02202', name: 'PARACÉTAMOL' }
const CODEINE = { code: '01178', name: 'CODÉINE (PHOSPHATE DE) HÉMIHYDRATÉ' }
const IBUPROFENE = { code: '00513', name: 'IBUPROFÈNE' }

function line(id: string, productId: string | null, label = id): PrescriptionLine {
  return { id, productId, label }
}

describe('information insuffisante', () => {
  test('signale un médicament non reconnu et ne le prend pas en compte', async () => {
    const source = sourceWith({ doliprane: [PARACETAMOL] })

    const result = await analyze(
      [line('a', 'doliprane'), line('b', null, 'XYZOLINE 5 mg')],
      { situations: [] },
      source,
    )

    const alert = result.alerts.find((item) => item.lineIds.includes('b'))
    expect(alert?.kind).toBe('information-insuffisante')
    expect(alert?.problem).toContain('XYZOLINE 5 mg')
    expect(result.scope.recognizedCount).toBe(1)
  })

  test('signale un médicament absent des données même avec un identifiant', async () => {
    const source = sourceWith({})

    const result = await analyze([line('a', 'inconnu', 'PRODUIT RETIRÉ')], { situations: [] }, source)

    expect(result.alerts.find((item) => item.lineIds.includes('a'))?.kind).toBe('information-insuffisante')
  })

  test('signale chaque situation cochée que les sources ne permettent pas de vérifier', async () => {
    const source = sourceWith({ doliprane: [PARACETAMOL] })

    const result = await analyze(
      [line('a', 'doliprane')],
      { situations: ['enceinte', 'insuffisance-renale'] },
      source,
    )

    const situationAlerts = result.alerts.filter(
      (item) => item.kind === 'information-insuffisante' && item.lineIds.length === 0 && item.source === null,
    )
    expect(situationAlerts.map((item) => item.problem)).toEqual([
      expect.stringContaining('enceinte'),
      expect.stringContaining('insuffisance rénale'),
      expect.stringContaining('Interactions'),
    ])
  })

  test('signale que les interactions, posologies et durées ne sont pas vérifiées', async () => {
    const source = sourceWith({ doliprane: [PARACETAMOL] })

    const result = await analyze([line('a', 'doliprane')], { situations: [] }, source)

    const alert = result.alerts.find((item) => item.problem.startsWith('Interactions'))
    expect(alert?.kind).toBe('information-insuffisante')
    expect(alert?.problem).toContain('posologies')
    expect(alert?.problem).toContain('durées')
  })
})

describe('périmètre et ordre', () => {
  test('indique une analyse sans profil patient quand aucune case n’est cochée', async () => {
    const result = await analyze([line('a', 'doliprane')], { situations: [] }, sourceWith({}))

    expect(result.scope.withProfile).toBe(false)
  })

  test('indique les cases du profil prises en compte', async () => {
    const result = await analyze([line('a', 'doliprane')], { situations: ['diabete'] }, sourceWith({}))

    expect(result.scope).toMatchObject({ withProfile: true, situations: ['diabete'] })
  })

  test('classe les alertes par gravité, du plus grave au moins grave', async () => {
    const source = sourceWith({ p1: [PARACETAMOL], p2: [PARACETAMOL] })

    const result = await analyze(
      [line('x', null), line('a', 'p1'), line('b', 'p2')],
      { situations: [] },
      source,
    )

    expect(result.alerts[0]?.kind).toBe('doublon')
    expect(result.alerts.slice(1).every((item) => item.kind === 'information-insuffisante')).toBe(true)
  })

  test('rappelle les sources utilisées et leur date', async () => {
    const result = await analyze([], { situations: [] }, sourceWith({}))

    expect(result.sources).toEqual([BDPM])
  })

  test('liste les lignes reconnues, celles que les contrôles ont réellement couvertes', async () => {
    const source = sourceWith({ doliprane: [PARACETAMOL] })

    const result = await analyze(
      [line('a', 'doliprane'), line('b', null), line('c', 'sans-composition')],
      { situations: [] },
      source,
    )

    expect(result.scope.recognizedLineIds).toEqual(['a'])
  })

  test('décrit le contrôle des doublons effectué et sa limite, même sans alerte', async () => {
    const source = sourceWith({ doliprane: [PARACETAMOL], advil: [IBUPROFENE] })

    const result = await analyze([line('a', 'doliprane'), line('b', 'advil')], { situations: [] }, source)

    expect(result.scope.checksPerformed).toEqual([
      {
        kind: 'doublon',
        label: 'Doublons de principe actif',
        limit:
          'Même substance dans la BDPM. Les doublons de classe thérapeutique ne sont pas encore vérifiés.',
        alertCount: 0,
      },
    ])
  })
})

describe('doublons de principe actif', () => {
  test('signale deux lignes qui contiennent le même principe actif', async () => {
    const source = sourceWith({ doliprane: [PARACETAMOL], codoliprane: [PARACETAMOL, CODEINE] })

    const result = await analyze(
      [line('a', 'doliprane', 'DOLIPRANE 1000 mg'), line('b', 'codoliprane', 'CODOLIPRANE')],
      { situations: [] },
      source,
    )

    const doublons = result.alerts.filter((alert) => alert.kind === 'doublon')
    expect(doublons).toHaveLength(1)
    expect(doublons[0]?.lineIds).toEqual(['a', 'b'])
    expect(doublons[0]?.problem).toContain('PARACÉTAMOL')
    expect(doublons[0]?.source).toEqual(BDPM)
  })

  test('ne signale rien quand les principes actifs sont différents', async () => {
    const source = sourceWith({ doliprane: [PARACETAMOL], advil: [IBUPROFENE] })

    const result = await analyze([line('a', 'doliprane'), line('b', 'advil')], { situations: [] }, source)

    expect(result.alerts.filter((alert) => alert.kind === 'doublon')).toEqual([])
  })

  test('regroupe en une seule alerte trois lignes qui partagent le même principe actif', async () => {
    const source = sourceWith({ p1: [PARACETAMOL], p2: [PARACETAMOL], p3: [PARACETAMOL, CODEINE] })

    const result = await analyze(
      [line('a', 'p1'), line('b', 'p2'), line('c', 'p3')],
      { situations: [] },
      source,
    )

    const doublons = result.alerts.filter((alert) => alert.kind === 'doublon')
    expect(doublons).toHaveLength(1)
    expect(doublons[0]?.lineIds).toEqual(['a', 'b', 'c'])
  })
})
