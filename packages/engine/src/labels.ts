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
  "Cette analyse est une aide. Elle ne remplace pas l'analyse pharmaceutique du pharmacien, qui en garde la responsabilité."

export const RAPPEL_TRAITEMENTS_ABSENTS =
  "Les traitements qui ne figurent pas sur l'ordonnance scannée ne sont pas pris en compte, sauf s'ils ont été ajoutés à la main."
