# Benchmark des technologies

Projet : application d'aide à l'analyse d'ordonnance et au conseil patient, d'après le cahier
des charges v1 d'octobre 2026 (porteuse : Mathilde Follet).

Contrainte posée par le développeur : le projet doit être 100 % gratuit.

Rédigé le 25 octobre 2026, révisé le 26 octobre pour cette contrainte. Les informations sur les
éditeurs, les données publiques et les hébergeurs ont été vérifiées en ligne ces deux jours-là.
Les sources sont listées en fin de document, et ce qui n'a pas pu être vérifié a sa propre
section.

---

## Recommandation en une page

La technique peut être entièrement gratuite : une PWA qui fait tout sur le téléphone, sans
serveur. Rien ne quitte l'appareil, ce qui fait disparaître en même temps la question de
l'hébergement HDS.

Le prix de la gratuité se paie sur le périmètre de l'analyse. Aucune base agréée par la HAS n'est
gratuite pour un éditeur de logiciel, et les données publiques gratuites ne couvrent qu'une
partie des alertes demandées : les interactions entre médicaments (avec des données figées en
2023) et les doublons. Les contre-indications liées au profil patient, les posologies et les
durées ne sont couvertes par aucune source gratuite. Le détail est au §1.

Deux sorties, qui ne s'excluent pas :

1. construire la version gratuite avec ce périmètre réduit, affiché clairement à chaque analyse ;
2. demander aux éditeurs de bases une licence gratuite pour un projet non commercial, et la
   brancher si elle arrive.

Le choix du périmètre acceptable revient à Mathilde et aux pharmaciens qui testeront l'outil.

| Couche | Choix | Coût |
|---|---|---|
| Application | PWA statique : Vite + React + TypeScript | 0 € |
| Lecture de l'ordonnance imprimée | Tesseract.js dans le navigateur, modèle français, dans un Web Worker | 0 € |
| Ordonnance manuscrite | Saisie assistée : autocomplétion sur la BDPM, posologies en choix rapides | 0 € |
| Données médicamenteuses | BDPM (mise à jour mensuelle), Thésaurus des interactions de l'ANSM (figé au 15/09/2023), classes ATC d'Open Medic, embarqués dans l'appli | 0 € |
| Analyse | Moteur de règles en TypeScript, exécuté dans le navigateur | 0 € |
| Serveur | Aucun | 0 € |
| Hébergement | Cloudflare Pages, offre gratuite | 0 € |
| Mise à jour des données | GitHub Actions, tâche planifiée mensuelle qui reconstruit et redéploie | 0 € |
| Fiches conseils | Lien vers la notice officielle, plus des fiches rédigées par des pharmaciens pour les traitements courants | 0 € |
| Adresse | Sous-domaine gratuit en `pages.dev` | 0 € |

```
TÉLÉPHONE (PWA, tout se passe ici)                       HÉBERGEMENT STATIQUE (Cloudflare Pages)

photo ─> OCR navigateur ─> relecture ─> moteur de règles      sert une seule fois le code de l'appli,
                                        + données publiques   le modèle OCR et les données publiques,
                                          embarquées          puis le service worker les garde en cache
                                              │
                                              v
                                   alertes + source + date

aucune donnée d'ordonnance n'est envoyée nulle part
```

Bonus de cette architecture : l'appli fonctionne hors connexion une fois chargée.

---

## Ce qui reste payant malgré tout

| Poste | Gratuit ? | Ce qui le déclenche |
|---|---|---|
| Frais de store | Oui, évités par la PWA | Passage à une appli native (Apple 99 $ par an, Google 25 $ une fois) |
| Serveur et hébergement HDS | Oui, évités par l'absence de serveur | Une base sous licence accessible seulement par API (voir §9) |
| Licence d'une base agréée | Non, sauf accord gratuit d'un éditeur | Vouloir les contre-indications par profil et les posologies |
| Marquage CE | Non si l'appli est un dispositif médical de classe IIa ou plus (organisme notifié) | Usage en officine sur de vrais patients (voir §8) |
| Nom de domaine | Oui avec `pages.dev` | Vouloir une adresse propre : quelques euros par an |
| Temps de travail | Gratuit en argent, pas en heures | Transcription du Thésaurus, relecture par des pharmaciens, développement |

Le marquage CE est le seul poste qui peut rendre le « 100 % gratuit » impossible. Il dépend de la
fonction revendiquée par l'appli, quelle que soit la technique choisie. C'est la première
question à faire trancher (§8).

---

## 1. Ce que les données gratuites couvrent

Correspondance entre les types d'alertes du §4.2 du cahier et les sources publiques gratuites.

| Alerte demandée | Source gratuite | Couverte ? | Fraîcheur |
|---|---|---|---|
| Contre-indication liée au profil (grossesse, insuffisance rénale, enfant…) | Aucune source structurée | Non : l'appli répond « information insuffisante » | |
| Association contre-indiquée entre deux médicaments | Thésaurus ANSM | Oui | Figée au 15/09/2023 |
| Association déconseillée | Thésaurus ANSM | Oui | Figée au 15/09/2023 |
| Précaution d'emploi | Thésaurus ANSM (niveaux « précaution d'emploi » et « à prendre en compte ») | Oui, pour les associations seulement | Figée au 15/09/2023 |
| Posologie hors limites | Aucune source structurée | Non | |
| Doublon de principe actif | BDPM, fichier des compositions | Oui | Mensuelle |
| Doublon de classe | Classes ATC d'Open Medic, croisées avec la BDPM | Oui pour les médicaments remboursés en ville | Annuelle |
| Durée de traitement inhabituelle | Aucune source structurée | Non | |
| Information insuffisante | Produite par le moteur | Oui | |

### Ce que ça change pour le profil patient

Sans source gratuite sur les contre-indications par situation, cocher « enceinte » ou
« insuffisance rénale » ne modifie aucune alerte. Le §6 du cahier (« chaque case cochée modifie
l'analyse ») ne peut pas être tenu dans la version gratuite. Deux façons honnêtes de le gérer :
masquer la grille de profil, ou la garder et afficher pour chaque case cochée « situation non
vérifiée faute de données ». Je recommande la seconde : elle prépare l'écran à la version sous
licence et rappelle à chaque analyse ce qui n'a pas été contrôlé.

### Ce que ça change pour les interactions

Le Thésaurus de l'ANSM est la référence officielle des interactions, mais sa dernière version
date du 15 septembre 2023 et l'ANSM a cessé de le mettre à jour. Il sera retiré de son site après
le 15 juin 2027, l'ANSM renvoyant désormais aux RCP de chaque médicament. Trois règles en
découlent pour le moteur :

1. chaque analyse affiche « Interactions : Thésaurus ANSM du 15/09/2023, plus mis à jour » ;
2. une substance dont la première autorisation de mise sur le marché (date fournie par la BDPM)
   est postérieure au 15/09/2023 déclenche « interactions non vérifiées pour cette substance » ;
3. l'appli n'écrit jamais « aucune interaction », seulement « aucune interaction trouvée dans le
   Thésaurus 2023 ».

La version gratuite a donc une date de péremption naturelle. Plus on s'éloigne de 2023, plus le
risque d'alerte manquée grandit, et c'est la mesure que le cahier juge la plus critique (§10).
Si l'outil doit servir en officine au-delà de 2027, il faut une licence d'ici là.

### Le travail que demande la gratuité

Le Thésaurus n'existe qu'en PDF. Il faut le transcrire une fois en données structurées (couples
de substances ou de classes, niveau, conduite à tenir, page du PDF), puis faire vérifier chaque
entrée par un pharmacien. Le Thésaurus étant figé, ce travail ne se refait jamais. Une étude
universitaire de 2016 l'avait déjà converti en format web sémantique, mais sur une version
ancienne, inutilisable telle quelle.

---

## 2. Licences des données gratuites

| Source | Conditions | Conséquence dans l'appli |
|---|---|---|
| BDPM (ANSM) | Réutilisation libre si les données ne sont pas altérées, avec mention de la source et de la date de mise à jour | Écran « Sources » et mention sur chaque analyse. Conversion de format autorisée, contenu intact. |
| Thésaurus ANSM | Réutilisation encadrée par le code des relations entre le public et l'administration, avec mention de la source et de la date | Chaque alerte cite le Thésaurus, sa date et la page d'origine. |
| Open Medic (Assurance Maladie) | Les conditions de data.ameli indiquent la licence ODbL, à confirmer pour ce jeu précis | L'ODbL impose de republier sous la même licence la base dérivée si l'appli est publique. Sans gêne pour un projet gratuit. |

---

## 3. Ce que le cahier des charges impose à la technique

| Exigence (section) | Conséquence technique |
|---|---|
| Pas de devinette (§3.2) et « aucune erreur présentée avec assurance » (§10) | Chaque champ lu porte un niveau de confiance mesuré. L'outil de lecture doit pouvoir dire « illisible ». |
| Alertes issues d'une base officielle, source visible, date de mise à jour (§3.3, §3.4, §8) | Sources publiques officielles dans la version gratuite. Chaque alerte transporte sa source et sa date. |
| Aucune conservation (§3.5, §7) | Tout en mémoire, rien d'écrit sur le téléphone, aucun serveur qui reçoive quoi que ce soit. |
| Donnée de santé en transit (§7) | Aucun transit : l'option « lecture sur le téléphone » du cahier devient la règle, étendue à l'analyse. |
| iPhone et Android, écran étroit (§9) | PWA installable sur les deux. Interface pensée d'abord pour 375 px de large. |
| Résultat en quelques secondes (§9) | Analyse locale sur des données déjà en cache : pas d'attente réseau. |
| Indépendance vis-à-vis du LGO (§3.6, §9) | Aucune intégration. Le QR code de l'ordonnance numérique ne sert à rien ici : il ne contient qu'un numéro unique, et le contenu ne s'obtient que par le logiciel métier et le téléservice de l'Assurance maladie. |
| Tests sur un grand nombre d'ordonnances, avec mesures (§10) | Corpus d'ordonnances fictives versionné, avec résultats attendus, rejoué automatiquement à chaque modification. |

---

## 4. La lecture de l'ordonnance

| Option | Gratuite ? | Possible en PWA ? | Verdict |
|---|---|---|---|
| OCR dans le navigateur (Tesseract.js) | Oui | Oui | Retenue pour l'imprimé |
| OCR natif (Apple Vision, ML Kit) | Oui, mais appli native donc frais de store | Non | Plan B si Tesseract ne suffit pas sur l'imprimé |
| Modèle multimodal sur le téléphone (Apple Foundation Models, Gemini Nano) | Oui | Non, et réservé à certains appareils | Écartée |
| OCR ou modèle d'IA en ligne (Mistral OCR, Azure, Claude, GPT, Gemini…) | Non, ou offre gratuite limitée | Oui, par un serveur | Écartée : payante, et l'image avec le nom du patient quitterait le téléphone |

Deux raisons de fond, en plus du coût, pour écarter les modèles génératifs comme source de
lecture. Un OCR qui lit mal produit une erreur visible : un mot tronqué, une confiance basse,
qu'on surligne. Un modèle génératif qui ne lit pas produit souvent un nom de médicament qui
existe, écrit avec assurance, ce que le critère de réussite du cahier interdit. Et un service en
ligne recevrait l'image complète, nom du patient compris.

### Comment la lecture devient fiable

La confiance d'un champ combine trois signaux, et le champ est surligné dès qu'un seul faiblit :

1. la confiance renvoyée par Tesseract pour les mots du champ ;
2. la correspondance du nom lu avec la BDPM : une seule spécialité candidate, compatible avec le
   dosage et la forme lus. Plusieurs candidates ou aucune : champ incertain, ou « médicament non
   reconnu, saisie manuelle » ;
3. la réussite de l'analyse de la posologie par les règles (« 1 cp matin et soir pendant 7 j »).
   Une tournure non reconnue rend le champ incertain, elle n'est jamais interprétée.

### Le manuscrit en saisie assistée

La FAQ officielle de Tesseract.js indique qu'il ne lit pas le manuscrit et qu'aucun réglage n'y
change rien. L'ordonnance manuscrite passe donc en saisie assistée dès le départ : la photo reste
affichée en haut, l'utilisatrice tape les premières lettres, choisit la spécialité dans la liste
issue de la BDPM (dosage et forme remplis d'office), puis la posologie dans des choix rapides. Un
champ saisi à la main n'est jamais incertain, puisque c'est l'utilisatrice qui l'a écrit.

---

## 5. L'application

| Critère | PWA | Expo (appli native) |
|---|---|---|
| Frais de distribution | 0 € | 99 $ par an + 25 $ une fois |
| Pratique actuelle de la pile | Oui (Next.js, React) | Oui (GoodFood) |
| Lecture sur le téléphone | Tesseract.js, texte imprimé seulement | Apple Vision et ML Kit |
| Blocage des captures d'écran | Impossible | Oui |
| Masquage de l'aperçu du sélecteur d'applications | Sans garantie | Oui |
| Mise à jour | Immédiate, au rechargement | Par les stores, ou mise à jour à chaud d'EAS |
| Fonctionnement hors connexion | Oui, par le service worker | Oui |

Flutter, le natif Swift et Kotlin et Kotlin Multiplatform ont les mêmes frais de store qu'Expo,
avec un langage nouveau ou un double travail en plus. Ils sont écartés.

**Verdict : PWA.** Expo ne redevient intéressant que si l'imprimé est mal lu par Tesseract, ou si
l'avis juridique refuse les deux risques résiduels de confidentialité (§7). Dans ce cas, le
moteur, les données et les tests se gardent ; seuls les écrans et la lecture sont à refaire.

Mise en œuvre :

- Vite + React + TypeScript, avec `vite-plugin-pwa` pour le manifeste et le service worker.
- Prise de vue et import par `<input type="file" accept="image/*" capture="environment">`, qui
  ouvre l'appareil photo du téléphone sur iOS comme sur Android.
- Tesseract.js et le modèle français servis par le même hébergement que l'appli, exécutés dans
  un Web Worker. Prétraitement simple sur canvas avant lecture : redimensionnement, niveaux de
  gris, contraste.
- Données publiques préparées en JSON compact au moment du build, chargées au premier lancement
  puis gardées en cache par le service worker.
- État de l'analyse dans Zustand sans le middleware `persist`. Aucun localStorage ni IndexedDB
  pour les données d'ordonnance. Le cache du service worker ne contient que l'appli et les
  données publiques.
- Formulaire de relecture avec react-hook-form et zod.
- Écran de relecture : image zoomable en haut, champs en dessous, champs incertains surlignés et
  bloquants tant qu'ils ne sont pas confirmés.
- Aucun script tiers dans la page, et une politique de sécurité du contenu qui interdit tout
  envoi réseau en dehors de l'hébergement de l'appli. C'est elle qui garantit techniquement que
  rien ne part.
- Installation : Chrome la propose sur Android. Sur iPhone, Safari, bouton Partager, puis « Sur
  l'écran d'accueil ». L'appli marche aussi dans un simple onglet.

---

## 6. Données, moteur et mise à jour

### Chaîne de mise à jour, gratuite

1. Une tâche GitHub Actions planifiée chaque mois télécharge les fichiers de la BDPM (texte
   séparé par des tabulations, sans en-tête) et la date de mise à jour affichée par l'ANSM.
2. Un script Node les convertit en JSON compact, sans toucher au contenu, et les croise avec les
   classes ATC d'Open Medic (mise à jour annuelle).
3. Le Thésaurus transcrit (§1) est versionné dans le dépôt, puisqu'il ne bouge plus.
4. Les tests du corpus fictif tournent. S'ils échouent, rien n'est déployé.
5. Le build est publié sur Cloudflare Pages.

GitHub Actions est gratuit sans limite pour un dépôt public et dans un quota mensuel pour un
dépôt privé, largement suffisant pour un build par mois. Cloudflare Pages accepte un dépôt privé
dans son offre gratuite, ce que GitHub Pages ne fait pas. Publier le code en open source reste
possible, et cohérent avec un outil qui affiche ses sources. La propriété du code est à convenir
par écrit avec Mathilde, comme le recommande le §12 du cahier.

### Le moteur

Un ensemble de règles écrites en TypeScript, testées une par une, exécutées dans le navigateur.
La source des données est isolée derrière une interface : la version gratuite l'implémente avec
les données publiques, une version sous licence la remplacerait sans toucher au reste.

```ts
interface DrugKnowledgeSource {
  dataVersion(): Promise<{ source: string; updatedAt: string }[]>
  findProduct(query: ProductQuery): Promise<ProductMatch[]>
  interactions(products: ProductId[]): Promise<InteractionFact[]>
  contraindications(product: ProductId, profile: PatientProfile): Promise<ContraindicationFact[] | 'non-couvert'>
  doseLimits(product: ProductId, profile: PatientProfile): Promise<DoseLimitFact | 'non-couvert'>
}

type Alert = {
  kind: 'contre-indication' | 'interaction' | 'precaution' | 'posologie'
      | 'doublon' | 'duree' | 'information-insuffisante'
  severity: 1 | 2 | 3 | 4
  products: ProductId[]
  problem: string
  suggestedAction: string
  source: { base: string; reference: string; updatedAt: string }
}
```

La valeur `'non-couvert'` force le moteur à produire une alerte « information insuffisante » au
lieu de conclure qu'il n'y a rien. Chaque réponse rappelle aussi sur quoi l'analyse a porté
(ordonnance seule ou avec profil, cases cochées, cases non vérifiées), comme le demande le §4.2
du cahier. Aucun modèle d'IA n'intervient dans le moteur.

---

## 7. Fiches conseils et effacement

### Fiches conseils

La version gratuite combine deux contenus. Pour chaque médicament, un lien vers sa notice
officielle sur le site de la BDPM, écrite pour le patient et à jour. Pour les traitements les
plus courants, des fiches rédigées et relues par des pharmaciens bénévoles, versionnées dans le
dépôt avec leur date de relecture. Aucune reformulation par IA : elle serait payante, et la
licence de la BDPM interdit d'altérer les données. L'impression passe par celle du navigateur,
sans fichier enregistré.

### Effacement

| Point | Mesure |
|---|---|
| Photo | Gardée en mémoire (`Blob`), URL révoquée à la sortie. La page n'écrit aucun fichier. Vérifier sur les téléphones de l'officine, iPhone comme Android, que la photo n'est pas ajoutée à la galerie. |
| État de l'analyse | En mémoire uniquement, vidé à la sortie de l'analyse, à la fermeture de l'onglet et après une durée d'inactivité à fixer. |
| Réseau | Aucune requête ne porte de donnée d'ordonnance, garanti par la politique de sécurité du contenu. |
| Navigateur | `autocomplete="off"` sur les champs, aucune donnée dans l'adresse de la page. |
| Aperçu du sélecteur d'applications | Pas de maîtrise garantie en PWA. Atténuation : masquer le contenu à l'événement `visibilitychange`, sans certitude que l'aperçu soit pris après. |
| Captures d'écran | Impossibles à bloquer en PWA. |
| Rapports d'erreur | Aucun service de rapport d'erreur, puisque tout envoi réseau est bloqué. |

Les deux risques résiduels, l'aperçu et les captures, supposent quelqu'un qui manipule le
téléphone de l'officine. Ils sont à inscrire dans l'analyse RGPD, qui devient beaucoup plus
simple : l'éditeur de l'appli ne reçoit ni ne traite aucune donnée.

---

## 8. Réglementation

Ce qui suit oriente la technique et ne remplace pas l'avis juridique que le cahier prévoit de
demander à un spécialiste.

- Depuis une décision du Conseil d'État de 2018, le marquage CE est la seule obligation pour un
  logiciel d'aide à la dispensation. La certification HAS des LAD reste facultative.
- Selon la règle 11 du règlement européen sur les dispositifs médicaux, un logiciel qui fournit
  des informations utilisées pour des décisions thérapeutiques relève au moins de la classe IIa,
  ce qui suppose un organisme notifié, donc des frais. Un outil hospitalier comparable (PharmIA)
  est marqué CE en classe I : la classe dépend de la fonction exacte revendiquée.
- Un logiciel est un dispositif médical selon la finalité médicale que lui donne son fabricant.
  La façon de présenter l'outil compte donc autant que son code.
- Le mode étudiant, limité à des ordonnances fictives, a peu de chances d'avoir une finalité
  médicale. C'est mon hypothèse, à faire confirmer : si elle tient, c'est la partie du projet qui
  peut rester gratuite à coup sûr.
- La PWA échappe à l'examen des stores, dont l'examen renforcé d'Apple pour les applications
  médicales (règle 1.4.1 des App Review Guidelines). Le statut de dispositif médical, lui, ne
  dépend pas du mode de distribution.

Interlocuteurs publics pour poser la question du statut : le guichet G_NIUS de l'Agence du
numérique en santé, qui oriente les porteurs de projets e-santé, et l'ANSM, autorité compétente
pour la qualification des logiciels dispositifs médicaux.

---

## 9. Si une licence gratuite est obtenue

| Forme de la licence | Ce qui change | Reste gratuit ? |
|---|---|---|
| Fichiers de données, embarquables dans l'appli | Rien dans l'architecture : nouvelle implémentation de `DrugKnowledgeSource` | Oui |
| API seulement, avec clé | La clé ne peut pas vivre dans l'appli. Il faut un serveur, et les lignes de médicaments avec le profil transitent par lui. La question HDS revient. | Non dès qu'un hébergement HDS est exigé |

La question 1 à poser aux éditeurs devient donc : acceptez-vous que vos données soient
embarquées dans une application qui tourne entièrement sur le téléphone ?

Questions à envoyer à Vidal, Thériaque (Thériaque Med, groupe Synapse Medicine, avec le CNHIM),
BCB (RESIP, groupe Cegedim), Thesorimed (GIE SIPS) et Posos :

1. Accordez-vous une licence gratuite à un projet non commercial porté par une préparatrice en
   pharmacie ?
2. Vos données peuvent-elles être embarquées dans une application qui fonctionne entièrement sur
   le téléphone, sans serveur ?
3. Quelles données sont couvertes : contre-indications par situation (grossesse par trimestre,
   allaitement, âge, poids, clairance rénale), posologies, interactions avec niveau de gravité,
   doublons, durées de traitement ?
4. Fournissez-vous des contenus destinés au patient ?
5. À quelle fréquence la base est-elle mise à jour, et la date de version est-elle fournie ?
6. L'intégration de votre base a-t-elle un effet sur le statut réglementaire de notre logiciel ?

---

## 10. Les tests

- Corpus fictif : ordonnances rédigées par des pharmaciens, imprimées et manuscrites, avec pour
  chacune la transcription attendue et les alertes attendues. Il vit dans le dépôt et bloque tout
  déploiement en cas d'échec.
- Mesures du §10 du cahier, calculées automatiquement sur ce corpus : erreurs de lecture,
  alertes manquées, fausses alertes, incertitudes correctement signalées.
- Moteur : tests unitaires avec Vitest, une règle par fichier de test.
- Parcours complet : tests de bout en bout avec Playwright en émulation mobile (import d'une image
  du corpus, relecture, analyse, sortie, vérification qu'aucune requête n'est partie et que rien
  ne subsiste dans le stockage du navigateur).
- Corpus réel anonymisé : jamais dans le dépôt ni dans un service en ligne. Stockage chiffré
  hors ligne, sous la responsabilité du pharmacien titulaire qui a donné son accord.

Tous ces outils sont gratuits.

---

## 11. Ordre de marche proposé

1. Poser la question du statut réglementaire (G_NIUS, ANSM), puisque c'est elle qui peut rendre
   la gratuité impossible.
2. Envoyer les questions du §9 aux éditeurs de bases.
3. Construire le prototype : PWA, Tesseract.js, reconnaissance sur la BDPM, saisie assistée,
   écran de relecture, doublons de principe actif. Uniquement sur ordonnances fictives.
4. Faire constituer par des pharmaciens le premier corpus fictif, manuscrit compris.
5. Transcrire le Thésaurus et faire vérifier chaque entrée, puis brancher les interactions.
6. Faire valider par Mathilde et des pharmaciens le périmètre réduit, avant tout usage sur de
   vraies ordonnances.

Le délai de chaque étape reste à fixer avec Mathilde, comme le prévoit le cahier.

---

## Ce que je n'ai pas pu vérifier

- L'existence d'une licence gratuite chez l'un des éditeurs de bases : aucune n'est annoncée
  publiquement.
- La licence exacte d'Open Medic, et la part des médicaments non remboursés absents de ses
  classes ATC.
- La licence exacte applicable au Thésaurus de l'ANSM, au-delà des mentions légales du site.
- Les conditions de récupération des notices en masse depuis le site de la BDPM : elles ne font
  pas partie des fichiers téléchargeables, d'où le choix d'un simple lien.
- La qualité de Tesseract.js sur des photos d'ordonnances imprimées prises au téléphone : seul le
  prototype répondra.
- Le comportement de l'appareil photo appelé par une page web : photo ajoutée ou non à la
  galerie, selon le téléphone.
- La gratuité du service d'orientation G_NIUS et ses délais de réponse.

---

## Sources

Données publiques
- [BDPM : page de téléchargement et licence](https://base-donnees-publique.medicaments.gouv.fr/telechargement)
- [BDPM : contenu et format des fichiers téléchargeables, v3](https://base-donnees-publique.medicaments.gouv.fr/docs/Contenu_et_format_des_fichiers_telechargeables_dans_la_BDM_v3.pdf)
- [data.gouv.fr : BDPM en CSV, conversion mensuelle](https://www.data.gouv.fr/datasets/base-de-donnees-publique-des-medicaments-en-csv-conversion-mensuelle)
- [ANSM : Thésaurus des interactions médicamenteuses, fin des mises à jour](https://ansm.sante.fr/documents/reference/thesaurus-des-interactions-medicamenteuses-1)
- [ANSM : mentions légales et réutilisation](https://ansm.sante.fr/Mentions-legales)
- [DUMAS : conversion du Thésaurus en RDF (2016)](https://dumas.ccsd.cnrs.fr/dumas-01442668v1/document)
- [data.gouv.fr : Open Medic](https://www.data.gouv.fr/datasets/open-medic-base-complete-sur-les-depenses-de-medicaments-interregimes)
- [data.ameli : conditions générales (ODbL)](https://data.ameli.fr:443/terms/terms-and-conditions.pdf)

Bases agréées
- [HAS : bases de données sur les médicaments ayant reçu un agrément](https://has-sante.fr/jcms/c_2790851/fr/bases-de-donnees-sur-les-medicaments-ayant-recu-un-agrement-has)
- [Lonasanté : Thériaque, offres et exploitant](https://www.lonasante.com/?p=19351)
- [ANSM : notification de sécurité API RESIP (BCB), mai 2025](https://ansm.sante.fr/uploads/2025/05/14/20250514-mes-lap-api-resip.pdf)

Lecture
- [Tesseract.js : FAQ (manuscrit non pris en charge)](https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/docs/faq.md)
- [Apple WWDC 2026 : Foundation Models](https://developer.apple.com/wwdc/videos/?id=207)
- [Google : ML Kit GenAI APIs](https://developers.google.com/ml-kit/genai)

Hébergement et HDS
- [ANS : certification HDS](https://esante.gouv.fr/produits-et-services/hds-certification-hebergeur-de-donnees-de-sante)
- [Clever Cloud : offre HDS et tarification](https://www.clever.cloud/health-hds/)

Réglementation
- [HAS : nouveau cadre de certification des LAD d'officine](https://has-sante.fr/jcms/p_3311808/fr/officines-un-nouveau-cadre-pour-la-certification-des-logiciels-d-aide-a-la-dispensation)
- [Le Quotidien du Pharmacien : certification des LGO et marquage CE](https://www.lequotidiendupharmacien.fr/gestion-de-lofficine/e-sante/certification-des-lgo-une-revolution-en-marche)
- [Motherbase : fiche PharmIA (marquage CE classe I)](https://my.motherbase.ai/company/211993-pharmia)
- [FMH : FAQ logiciel dispositif médical (règle 11)](https://contens30.fmh.ch/files/pdf27/faq-software-as-a-medical-device-fr-v1.pdf)
- [ANSM : qualification des logiciels dispositifs médicaux (2019)](https://archive.ansm.sante.fr/var/ansm_site/storage/original/application/1cdae3190aa4e504fc47cc2c28f07d1d.pdf)
- [Le Quotidien du Médecin : lancement du guichet G_NIUS](https://infectiologie.lequotidiendumedecin.fr/actus-medicales/esante/lancement-du-guichet-gnius-pour-les-entrepreneurs-du-numerique)
- [Ordre des pharmaciens : l'ordonnance numérique](https://www.ordre.pharmacien.fr/les-communications/focus-sur/les-actualites/l-ordonnance-numerique-comment-ca-marche)
