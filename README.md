# Claire

Aide à l'analyse d'ordonnance en arrière-pharmacie, d'après le cahier des charges v1 (octobre 2026).
PWA entièrement locale : la photo, la saisie et l'analyse restent sur le téléphone, rien n'est envoyé
ni conservé. Le choix des technologies est expliqué dans [docs/benchmark-technos.md](docs/benchmark-technos.md).

Claire est une aide. Elle ne remplace pas l'analyse pharmaceutique du pharmacien.

## Démarrer

Node 22.12 ou plus récent.

```bash
npm install
npm run data   # télécharge la BDPM et écrit apps/web/public/data/bdpm.json
npm run dev    # http://localhost:5173
```

`npm run check` enchaîne lint, vérification des types, tests et build.

Pour publier (Cloudflare Pages, offre gratuite) : commande de build `npm run build:deploy`, dossier de
sortie `apps/web/dist`. Elle télécharge la BDPM du jour avant de construire, et échoue si les fichiers
sont incomplets. Les en-têtes de sécurité sont dans `apps/web/public/_headers`.

## Organisation

| Dossier | Rôle |
|---|---|
| `packages/engine` | Moteur d'analyse : types, règles, alertes classées par gravité. Ne dépend d'aucune source précise. |
| `packages/bdpm` | Lecture des fichiers de la BDPM, jeu de données embarqué, recherche de spécialités. Implémente la source de données du moteur. |
| `apps/web` | Application (Vite + React). Les données d'une analyse vivent en mémoire uniquement. |

Une future base sous licence (Vidal, Thériaque, BCB, Posos) s'ajoutera comme une nouvelle
implémentation de `DrugKnowledgeSource`, sans toucher au moteur ni à l'application.

## Fonctionnalités

- Saisie des médicaments par recherche dans la BDPM, ou saisie manuelle d'un médicament hors base.
- Photo de l'ordonnance affichée pendant la saisie, ni lue ni envoyée.
- Profil patient avec les précisions du cahier (trimestre, âge, poids, clairance, allergies).
- Alertes classées par gravité : doublons de principe actif, médicaments non identifiés.
- Liste des contrôles réalisés et non réalisés à chaque analyse.
- Effacement à la fin de l'analyse, à la fermeture, et après cinq minutes en arrière-plan.

## Feuille de route

- Lecture automatique de la photo (Tesseract.js).
- Interactions issues du Thésaurus de l'ANSM.
- Doublons de classe thérapeutique (classes ATC d'Open Medic).
- Mode étudiant.

## Licences des données

BDPM : réutilisation libre sans altération, avec mention de la source et de la date de mise à jour,
affichées dans l'application.
