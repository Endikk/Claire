/** Code CIS de la BDPM, ou identifiant équivalent d'une base sous licence. */
export type ProductId = string

export interface SourceRef {
  name: string
  /** Date de mise à jour des données, au format AAAA-MM-JJ. */
  updatedAt: string
  /** Référence précise dans la source (page, rubrique), quand elle existe. */
  reference?: string
}

export interface ActiveIngredient {
  code: string
  name: string
}

export interface CompositionFact {
  ingredients: ActiveIngredient[]
  source: SourceRef
}

/** Ce que le moteur sait demander aux données médicamenteuses, quelle que soit leur origine. */
export interface DrugKnowledgeSource {
  versions(): SourceRef[]
  composition(productId: ProductId): Promise<CompositionFact | undefined>
}

/** Ligne d'ordonnance telle que relue et validée par l'utilisatrice. */
export interface PrescriptionLine {
  id: string
  /** `null` quand le médicament n'a pas été reconnu dans les données. */
  productId: ProductId | null
  label: string
  posologie?: string
  duree?: string
}

export type Situation =
  | 'enceinte'
  | 'allaitement'
  | 'enfant'
  | 'nourrisson'
  | 'personne-agee'
  | 'cancer-chimiotherapie'
  | 'insuffisance-renale'
  | 'insuffisance-hepatique'
  | 'diabete'
  | 'anticoagulant'
  | 'immunodepression'
  | 'allergies'

export interface PatientProfile {
  situations: Situation[]
  trimestre?: 1 | 2 | 3
  ageAns?: number
  poidsKg?: number
  clairanceMlMin?: number
  allergies?: string
}

/** Types d'alertes, dans l'ordre de gravité du cahier des charges (§4.2). */
export const ALERT_KINDS = [
  'contre-indication',
  'association-deconseillee',
  'precaution',
  'posologie',
  'doublon',
  'duree',
  'information-insuffisante',
] as const

export type AlertKind = (typeof ALERT_KINDS)[number]

export interface Alert {
  kind: AlertKind
  /** Lignes de l'ordonnance concernées. Vide quand l'alerte porte sur l'analyse entière. */
  lineIds: string[]
  problem: string
  suggestedAction: string
  /** `null` quand l'alerte porte sur un médicament absent des données. */
  source: SourceRef | null
}

/** Contrôle réellement effectué : il est affiché même quand il ne produit aucune alerte. */
export interface CheckPerformed {
  kind: AlertKind
  label: string
  alertCount: number
}

export interface AnalysisScope {
  lineCount: number
  recognizedCount: number
  recognizedLineIds: string[]
  checksPerformed: CheckPerformed[]
  /** Affichés avec les contrôles réalisés : « aucune alerte » ne veut jamais dire « aucun problème ». */
  checksNotPerformed: string[]
  situations: Situation[]
  withProfile: boolean
}

export interface AnalysisResult {
  alerts: Alert[]
  scope: AnalysisScope
  sources: SourceRef[]
}
