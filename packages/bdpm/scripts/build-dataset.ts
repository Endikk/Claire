/**
 * Télécharge les fichiers de la BDPM et écrit `bdpm.json` dans le dossier donné.
 * Usage : tsx build-dataset.ts <dossier de sortie>
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  buildDataset,
  decodeBdpm,
  parseCompositions,
  parseRows,
  parseSpecialites,
  parseUpdateDate,
} from '../src/index'

const BDPM_BASE_URL = 'https://base-donnees-publique.medicaments.gouv.fr'
const DOWNLOAD_TIMEOUT_MS = 60_000
/** Garde-fou : la BDPM compte environ 16 000 spécialités. En dessous, le téléchargement est suspect. */
const MIN_EXPECTED_PRODUCTS = 10_000
/** Presque toutes les spécialités ont une composition. Sinon, le fichier des compositions est tronqué. */
const MIN_COMPOSITION_COVERAGE = 0.9

async function download(path: string): Promise<Uint8Array> {
  const response = await fetch(`${BDPM_BASE_URL}${path}`, {
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`BDPM : ${path} a répondu ${response.status} ${response.statusText}`)
  }
  return new Uint8Array(await response.arrayBuffer())
}

async function main(outDir: string | undefined): Promise<void> {
  if (!outDir) {
    throw new Error('Dossier de sortie manquant. Usage : tsx build-dataset.ts <dossier>')
  }

  const [page, specialitesFile, compositionsFile] = await Promise.all([
    download('/telechargement'),
    download('/download/file/CIS_bdpm.txt'),
    download('/download/file/CIS_COMPO_bdpm.txt'),
  ])

  const updatedAt = parseUpdateDate(decodeBdpm(page))
  const specialites = parseSpecialites(parseRows(decodeBdpm(specialitesFile)))
  const compositions = parseCompositions(parseRows(decodeBdpm(compositionsFile)))

  if (specialites.length < MIN_EXPECTED_PRODUCTS) {
    throw new Error(
      `BDPM : ${specialites.length} spécialités seulement, téléchargement probablement incomplet.`,
    )
  }

  const dataset = buildDataset(specialites, compositions, {
    updatedAt,
    generatedAt: new Date().toISOString(),
  })

  const coverage = Object.keys(dataset.ingredients).length / dataset.products.length
  if (coverage < MIN_COMPOSITION_COVERAGE) {
    throw new Error(
      `BDPM : compositions trouvées pour ${Math.round(coverage * 100)} % des spécialités seulement, fichier probablement tronqué.`,
    )
  }

  await mkdir(outDir, { recursive: true })
  const target = join(outDir, 'bdpm.json')
  await writeFile(target, JSON.stringify(dataset))

  process.stdout.write(
    `BDPM du ${updatedAt} : ${dataset.products.length} spécialités, ` +
      `${Object.keys(dataset.ingredients).length} compositions, écrit dans ${target}\n`,
  )
}

main(process.argv[2]).catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
