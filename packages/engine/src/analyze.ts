import { CONTROLES_NON_REALISES, medicamentsNonReconnus } from './rules/couverture'
import { CONTROLE_DOUBLONS, doublonsDePrincipeActif, type ResolvedLine } from './rules/doublons'
import {
  ALERT_KINDS,
  type Alert,
  type AnalysisResult,
  type DrugKnowledgeSource,
  type PatientProfile,
  type PrescriptionLine,
} from './types'

async function resolveLines(lines: PrescriptionLine[], source: DrugKnowledgeSource): Promise<ResolvedLine[]> {
  const resolved = await Promise.all(
    lines.map(async (line) => {
      if (line.productId === null) return undefined
      const composition = await source.composition(line.productId)
      return composition ? { line, composition } : undefined
    }),
  )
  return resolved.filter((entry) => entry !== undefined)
}

function byGravity(a: Alert, b: Alert): number {
  return ALERT_KINDS.indexOf(a.kind) - ALERT_KINDS.indexOf(b.kind)
}

export async function analyze(
  lines: PrescriptionLine[],
  profile: PatientProfile,
  source: DrugKnowledgeSource,
): Promise<AnalysisResult> {
  const resolved = await resolveLines(lines, source)
  const recognizedIds = new Set(resolved.map((entry) => entry.line.id))

  const doublons = doublonsDePrincipeActif(resolved)
  const alerts = [...doublons, ...medicamentsNonReconnus(lines, recognizedIds)].sort(byGravity)

  return {
    alerts,
    scope: {
      lineCount: lines.length,
      recognizedCount: resolved.length,
      recognizedLineIds: resolved.map((entry) => entry.line.id),
      checksPerformed: [{ ...CONTROLE_DOUBLONS, alertCount: doublons.length }],
      checksNotPerformed: [...CONTROLES_NON_REALISES],
      situations: profile.situations,
      withProfile: profile.situations.length > 0,
    },
    sources: source.versions(),
  }
}
