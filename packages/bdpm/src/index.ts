export { BDPM_SOURCE_NAME, type BdpmDataset, type BdpmProduct, buildDataset, isBdpmDataset } from './dataset'
export {
  activeIngredientsOf,
  type Composition,
  decodeBdpm,
  parseCompositions,
  parseRows,
  parseSpecialites,
  parseUpdateDate,
  type Specialite,
} from './parse'
export { type BdpmSource, createBdpmSource } from './source'

/** Page de la spécialité sur le site de la BDPM, où se trouve la notice officielle. */
export function noticeUrl(cis: string): string {
  return `https://base-donnees-publique.medicaments.gouv.fr/medicament/${encodeURIComponent(cis)}/extrait#tab-notice`
}
