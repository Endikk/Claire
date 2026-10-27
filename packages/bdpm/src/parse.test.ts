import { describe, expect, test } from 'vitest'
import {
  activeIngredientsOf,
  decodeBdpm,
  parseCompositions,
  parseRows,
  parseSpecialites,
  parseUpdateDate,
} from './parse'

describe('decodeBdpm', () => {
  test('lit un fichier en UTF-8', () => {
    const bytes = new TextEncoder().encode('PARACÉTAMOL')

    expect(decodeBdpm(bytes)).toBe('PARACÉTAMOL')
  })

  test('lit un fichier en Windows-1252 quand il n’est pas en UTF-8 valide', () => {
    const bytes = Uint8Array.from([0x50, 0x52, 0xc9, 0x41, 0x20, 0x6c, 0x92, 0x65])

    expect(decodeBdpm(bytes)).toBe('PRÉA l’e')
  })
})

describe('parseRows', () => {
  test('découpe les lignes CRLF ou LF et les colonnes tabulées, sans ligne vide finale', () => {
    expect(parseRows('a\tb\r\nc\td\ne\tf\r\n')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
      ['e', 'f'],
    ])
  })
})

describe('parseSpecialites', () => {
  test('extrait les champs utiles du fichier CIS_bdpm', () => {
    const rows = parseRows(
      [
        '60234100\tDOLIPRANE 1000 mg, comprimé\tcomprimé\torale\tAutorisation active\tProcédure nationale\tCommercialisée\t09/07/2002\t\t\t OPELLA HEALTHCARE FRANCE\tNon',
        '61266250\tA 313 200 000 UI POUR CENT, pommade\tpommade\tcutanée;orale\tAutorisation active\tProcédure nationale\tNon commercialisée\t12/03/1998\t\t\t PHARMA DEVELOPPEMENT\tNon',
      ].join('\r\n'),
    )

    expect(parseSpecialites(rows)).toEqual([
      {
        cis: '60234100',
        denomination: 'DOLIPRANE 1000 mg, comprimé',
        forme: 'comprimé',
        voies: ['orale'],
        commercialisee: true,
        dateAmm: '2002-07-09',
        titulaire: 'OPELLA HEALTHCARE FRANCE',
      },
      {
        cis: '61266250',
        denomination: 'A 313 200 000 UI POUR CENT, pommade',
        forme: 'pommade',
        voies: ['cutanée', 'orale'],
        commercialisee: false,
        dateAmm: '1998-03-12',
        titulaire: 'PHARMA DEVELOPPEMENT',
      },
    ])
  })

  test('refuse une date d’AMM illisible au lieu de produire une date fausse', () => {
    const row = [
      '60234100',
      'DOLIPRANE',
      'comprimé',
      'orale',
      'Autorisation active',
      'Procédure nationale',
      'Commercialisée',
      '2002-07-09',
      '',
      '',
      ' OPELLA',
      'Non',
    ]

    expect(() => parseSpecialites([row])).toThrow(/date/)
  })

  test('refuse une ligne dont le nombre de colonnes ne correspond pas au format', () => {
    expect(() => parseSpecialites([['60234100', 'DOLIPRANE']])).toThrow(/CIS_bdpm/)
  })
})

describe('parseCompositions', () => {
  test('extrait les substances du fichier CIS_COMPO_bdpm', () => {
    const rows = parseRows(
      '60002283\tcomprimé\t42215\tANASTROZOLE\t1,00 mg\tun comprimé\tSA\t1\r\n' +
        '60004932\tcomprimé\t04442\tMETFORMINE\t780 mg\tun comprimé\tFT\t1\r\n',
    )

    expect(parseCompositions(rows)).toEqual([
      {
        cis: '60002283',
        element: 'comprimé',
        substanceCode: '42215',
        substance: 'ANASTROZOLE',
        nature: 'SA',
        liaison: '1',
      },
      {
        cis: '60004932',
        element: 'comprimé',
        substanceCode: '04442',
        substance: 'METFORMINE',
        nature: 'FT',
        liaison: '1',
      },
    ])
  })
})

describe('activeIngredientsOf', () => {
  test('retient la fraction thérapeutique plutôt que le sel quand les deux sont liés', () => {
    const ingredients = activeIngredientsOf([
      {
        cis: '1',
        element: 'comprimé',
        substanceCode: '19810',
        substance: 'ATORVASTATINE CALCIQUE',
        nature: 'SA',
        liaison: '1',
      },
      {
        cis: '1',
        element: 'comprimé',
        substanceCode: '19809',
        substance: 'ATORVASTATINE',
        nature: 'FT',
        liaison: '1',
      },
    ])

    expect(ingredients).toEqual([{ code: '19809', name: 'ATORVASTATINE' }])
  })

  test('garde chaque principe actif une seule fois, même présent dans plusieurs éléments', () => {
    const ingredients = activeIngredientsOf([
      {
        cis: '1',
        element: 'comprimé',
        substanceCode: '02202',
        substance: 'PARACÉTAMOL',
        nature: 'SA',
        liaison: '1',
      },
      {
        cis: '1',
        element: 'comprimé',
        substanceCode: '02202',
        substance: 'PARACÉTAMOL',
        nature: 'SA',
        liaison: '1',
      },
      {
        cis: '1',
        element: 'comprimé',
        substanceCode: '01178',
        substance: 'CODÉINE',
        nature: 'SA',
        liaison: '2',
      },
    ])

    expect(ingredients).toEqual([
      { code: '02202', name: 'PARACÉTAMOL' },
      { code: '01178', name: 'CODÉINE' },
    ])
  })
})

describe('parseUpdateDate', () => {
  test('lit la date de mise à jour affichée sur la page de téléchargement', () => {
    const html = '<p class="date">Dernière mise à jour le 29/09/2026</p>'

    expect(parseUpdateDate(html)).toBe('2026-09-29')
  })

  test('échoue clairement quand la date est introuvable', () => {
    expect(() => parseUpdateDate('<p>rien</p>')).toThrow(/date de mise à jour/)
  })
})
