import { beforeEach, describe, expect, test } from 'vitest'
import { createAnalyseStore } from './analyse'

function photo(): File {
  return new File(['x'], 'ordonnance.jpg', { type: 'image/jpeg' })
}

let store: ReturnType<typeof createAnalyseStore>

beforeEach(() => {
  store = createAnalyseStore()
})

describe('effacement', () => {
  test('reset efface toutes les données et révoque la photo', () => {
    store.getState().start()
    store.getState().setPhoto(photo())
    store.getState().addLine('60234100', 'DOLIPRANE 1000 mg, comprimé')
    store.getState().toggleSituation('enceinte')
    const url = store.getState().photoUrl

    store.getState().reset()

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(url)
    expect(store.getState()).toMatchObject({
      step: 'accueil',
      photoUrl: null,
      lines: [],
      profile: { situations: [] },
      result: null,
    })
  })

  test('une nouvelle photo révoque la précédente', () => {
    store.getState().setPhoto(photo())
    const first = store.getState().photoUrl

    store.getState().setPhoto(photo())

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(first)
    expect(store.getState().photoUrl).not.toBe(first)
  })

  test('démarrer une analyse révoque une photo restée en mémoire', () => {
    store.getState().setPhoto(photo())
    const url = store.getState().photoUrl

    store.getState().start()

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(url)
    expect(store.getState().photoUrl).toBeNull()
  })
})

describe('résultat périmé', () => {
  const result = {
    alerts: [],
    scope: {
      lineCount: 0,
      recognizedCount: 0,
      recognizedLineIds: [],
      checksPerformed: [],
      situations: [],
      withProfile: false,
    },
    sources: [],
  }

  test('changer le profil efface le résultat calculé avec l’ancien profil', () => {
    store.getState().setResult(result)

    store.getState().toggleSituation('diabete')

    expect(store.getState().result).toBeNull()
  })

  test('changer une précision efface le résultat calculé avant', () => {
    store.getState().setResult(result)

    store.getState().setPrecisions({ poidsKg: 20 })

    expect(store.getState().result).toBeNull()
  })
})

describe('lignes', () => {
  test('ajoute puis retire une ligne', () => {
    store.getState().addLine('60234100', 'DOLIPRANE 1000 mg, comprimé')
    const id = store.getState().lines[0]!.id

    store.getState().removeLine(id)

    expect(store.getState().lines).toEqual([])
  })

  test('modifie la posologie sans muter la liste précédente', () => {
    store.getState().addLine(null, 'XYZOLINE')
    const before = store.getState().lines
    const id = before[0]!.id

    store.getState().updateLine(id, { posologie: '1 cp matin et soir' })

    expect(store.getState().lines[0]?.posologie).toBe('1 cp matin et soir')
    expect(before[0]?.posologie).toBe('')
  })
})

describe('profil', () => {
  test('coche puis décoche une situation', () => {
    store.getState().toggleSituation('diabete')
    expect(store.getState().profile.situations).toEqual(['diabete'])

    store.getState().toggleSituation('diabete')
    expect(store.getState().profile.situations).toEqual([])
  })

  test('une précision remise à vide est retirée du profil', () => {
    store.getState().toggleSituation('enfant')
    store.getState().setPrecisions({ poidsKg: 18 })

    store.getState().setPrecisions({ poidsKg: undefined })

    expect('poidsKg' in store.getState().profile).toBe(false)
  })

  test('décocher « enceinte » efface le trimestre renseigné', () => {
    store.getState().toggleSituation('enceinte')
    store.getState().setPrecisions({ trimestre: 2 })

    store.getState().toggleSituation('enceinte')

    expect(store.getState().profile.trimestre).toBeUndefined()
  })
})
