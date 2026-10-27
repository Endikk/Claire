import type { AlertKind, Situation } from './types'

export const SITUATION_LABELS: Record<Situation, string> = {
  enceinte: 'enceinte',
  allaitement: 'allaitement',
  enfant: 'enfant',
  nourrisson: 'nourrisson',
  'personne-agee': 'personne âgée',
  'cancer-chimiotherapie': 'cancer ou chimiothérapie en cours',
  'insuffisance-renale': 'insuffisance rénale',
  'insuffisance-hepatique': 'insuffisance hépatique',
  diabete: 'diabète',
  anticoagulant: 'traitement anticoagulant',
  immunodepression: 'immunodépression',
  allergies: 'allergies connues',
}

export const ALERT_KIND_LABELS: Record<AlertKind, string> = {
  'contre-indication': 'Contre-indication',
  'association-deconseillee': 'Association déconseillée ou interaction',
  precaution: "Précaution d'emploi",
  posologie: 'Posologie hors limites',
  doublon: 'Doublon',
  duree: 'Durée de traitement inhabituelle',
  'information-insuffisante': 'Information insuffisante',
}

export const AVERTISSEMENT =
  'Outil d’aide à l’analyse. Il ne remplace pas l’analyse pharmaceutique, qui reste sous la responsabilité du pharmacien.'

export const RAPPEL_TRAITEMENTS_ABSENTS =
  'Seuls les médicaments saisis sont analysés. Ajoutez les autres traitements du patient pour les inclure.'
