import type { ActiveIngredient } from '@claire/engine'

/** Fichier CIS_bdpm.txt (format ANSM v5, §3.1). */
export interface Specialite {
  cis: string
  denomination: string
  forme: string
  voies: string[]
  commercialisee: boolean
  /** Date d'AMM au format AAAA-MM-JJ. */
  dateAmm: string
  /** Premier titulaire de l'AMM : il distingue les spécialités de même nom (importations parallèles). */
  titulaire: string
}

/** Fichier CIS_COMPO_bdpm.txt (format ANSM v5, §3.3). */
export interface Composition {
  cis: string
  element: string
  substanceCode: string
  substance: string
  /** Substance active, ou fraction thérapeutique (notée « ST » dans la documentation, « FT » dans les fichiers). */
  nature: 'SA' | 'FT'
  liaison: string
}

const SPECIALITE_COLUMNS = 12
const COMPOSITION_COLUMNS = 8

/**
 * Plage 0x80-0x9F de Windows-1252. Le TextDecoder de Node la décode comme du Latin-1 (caractères de
 * contrôle), ce qui transformerait l'apostrophe typographique des fichiers BDPM en caractère invisible.
 */
const WINDOWS_1252_HIGH: Record<number, string> = {
  128: '€',
  130: '‚',
  131: 'ƒ',
  132: '„',
  133: '…',
  134: '†',
  135: '‡',
  136: 'ˆ',
  137: '‰',
  138: 'Š',
  139: '‹',
  140: 'Œ',
  142: 'Ž',
  145: '‘',
  146: '’',
  147: '“',
  148: '”',
  149: '•',
  150: '–',
  151: '—',
  152: '˜',
  153: '™',
  154: 'š',
  155: '›',
  156: 'œ',
  158: 'ž',
  159: 'Ÿ',
}

function decodeWindows1252(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => WINDOWS_1252_HIGH[byte] ?? String.fromCharCode(byte)).join('')
}

/** Les fichiers de la BDPM ne partagent pas le même encodage : certains sont en UTF-8, d'autres en Windows-1252. */
export function decodeBdpm(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return decodeWindows1252(bytes)
  }
}

export function parseRows(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((row) => row.length > 0)
    .map((row) => row.split('\t'))
}

function frenchDateToIso(date: string): string {
  const match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) throw new Error(`BDPM : date illisible « ${date} », attendu JJ/MM/AAAA.`)
  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}

function assertColumns(rows: string[][], expected: number, file: string): void {
  const index = rows.findIndex((row) => row.length !== expected)
  if (index !== -1) {
    throw new Error(
      `${file} : ligne ${index + 1} avec ${rows[index]?.length} colonnes au lieu de ${expected}. Le format a peut-être changé.`,
    )
  }
}

export function parseSpecialites(rows: string[][]): Specialite[] {
  assertColumns(rows, SPECIALITE_COLUMNS, 'CIS_bdpm')
  return rows.map(([cis, denomination, forme, voies, , , etat, dateAmm, , , titulaires]) => ({
    cis: cis!,
    denomination: denomination!.trim(),
    forme: forme!.trim(),
    voies: voies!.split(';').map((voie) => voie.trim()),
    commercialisee: etat === 'Commercialisée',
    dateAmm: frenchDateToIso(dateAmm!),
    titulaire: titulaires!.split(';')[0]!.trim(),
  }))
}

export function parseCompositions(rows: string[][]): Composition[] {
  assertColumns(rows, COMPOSITION_COLUMNS, 'CIS_COMPO_bdpm')
  return rows.map(([cis, element, substanceCode, substance, , , nature, liaison]) => ({
    cis: cis!,
    element: element!.trim(),
    substanceCode: substanceCode!,
    substance: substance!.trim(),
    nature: nature === 'FT' || nature === 'ST' ? 'FT' : 'SA',
    liaison: liaison!,
  }))
}

/**
 * Principes actifs d'une spécialité. Quand un sel (SA) est lié à sa fraction thérapeutique (FT),
 * c'est la fraction qui compte : deux sels différents de la même molécule restent un doublon.
 */
export function activeIngredientsOf(compositions: Composition[]): ActiveIngredient[] {
  const groups = new Map<string, Composition[]>()
  for (const composition of compositions) {
    const key = `${composition.element}|${composition.liaison}`
    groups.set(key, [...(groups.get(key) ?? []), composition])
  }

  const retained = [...groups.values()].flatMap((group) => {
    const fractions = group.filter((composition) => composition.nature === 'FT')
    return fractions.length > 0 ? fractions : group
  })

  const byCode = new Map<string, ActiveIngredient>()
  for (const composition of retained) {
    if (!byCode.has(composition.substanceCode)) {
      byCode.set(composition.substanceCode, { code: composition.substanceCode, name: composition.substance })
    }
  }
  return [...byCode.values()]
}

export function parseUpdateDate(html: string): string {
  const match = html.match(/Dernière mise à jour le (\d{2}\/\d{2}\/\d{4})/)
  if (!match?.[1]) {
    throw new Error('Page de téléchargement de la BDPM : date de mise à jour introuvable.')
  }
  return frenchDateToIso(match[1])
}
