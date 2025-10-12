# Classement des Professeurs

Le module « Classement des professeurs » permet aux étudiants de voter chaque semaine pour leurs enseignants favoris tout en offrant aux administrateurs un contrôle complet sur la liste, les statistiques et les archives.

## Fonctionnalités principales

- **Votes pondérés** : 3 points pour le premier choix, 2 pour le deuxième, 1 pour le troisième.
- **Limitation à un vote par semaine et par utilisateur**.
- **Classements multi-périodes** : hebdomadaire (en direct), mensuel et annuel.
- **Historique consultable** : évolution d’un professeur sur les dernières semaines.
- **Classement des votants** : met en avant les membres les plus actifs.
- **Archivage automatique** : chaque dimanche soir (18h UTC ≈ 20h heure de Paris), les résultats sont publiés dans un salon configuré et les compteurs hebdo sont remis à zéro.

## Stockage et persistance

Toutes les données sont sauvegardées dans la base YAML (`prof_ranking_<guildId>`), avec :

- La liste des professeurs (actifs/inactifs) et leurs métadonnées.
- Les votes de la semaine en cours et leur total de points.
- Les archives hebdomadaires (classements complets).
- Les statistiques mensuelles/annuelles cumulées.
- Un suivi des votants (compteur total et dernière participation).

## Commandes utilisateur

| Commande | Rôle | Description |
| --- | --- | --- |
| Bouton **Voter** | Étudiant | Ouvre un sélecteur multi-choix (jusqu’à 3 professeurs) directement depuis le panneau. |
| Boutons **Classement mensuel / annuel** | Étudiant | Affichent les podiums agrégés du mois ou de l’année courante. |
| Bouton **Historique prof** | Étudiant/Admin | Permet de choisir un professeur et d’afficher son évolution sur plusieurs semaines. |
| Bouton **Top votants** | Étudiant/Admin | Met en avant les membres les plus assidus avec horodatage du dernier vote. |
| `/prof-vote` *(optionnel)* | Étudiant | Fallback par commande si le panneau n’est pas disponible. |
| `/ranking ...` *(optionnel)* | Étudiant/Admin | Accès manuel aux classements lorsque les composants sont désactivés. |

## Commandes administrateur

| Commande | Description |
| --- | --- |
| `/prof add <nom>` | Ajoute un professeur (bio, citation et emoji optionnels). |
| `/prof remove <professeur>` | Désactive un professeur tout en conservant les archives. |
| `/prof reset <cible>` | Réinitialise les votes hebdo/mois/année ou efface tout. |
| `/prof archive-channel [salon]` | Définit ou supprime le salon où envoyer les résultats hebdo. |
| `/prof panel [salon]` | Publie le panneau interactif (embed + boutons). Sans salon ⇒ retire le panneau actuel. |
| `/prof list` | Affiche la liste des professeurs actifs et archivés. |

> ⚠️ Toutes les commandes du groupe `/prof` exigent la permission **Administrateur**.

## Interface interactive

- Le panneau (`/prof panel`) publie un embed “🏆 Classement des professeurs” mis à jour automatiquement.
- Les boutons permettent de voter sans commande, consulter les classements mensuels/annuels, voir l’historique d’un professeur et le top des votants.
- Après chaque vote ou archivage hebdo, le panneau se rafraîchit tout seul. En cas de suppression accidentelle du message, relance `/prof panel` pour le republier.

## Configuration recommandée

1. Ajoutez vos professeurs via `/prof add`.
2. Configurez un salon d’archives (ex. `#archives-ranking`) avec `/prof archive-channel`.
3. Publiez le panneau interactif dans le salon de votre choix via `/prof panel` puis épinglez-le.
4. Encouragez les étudiants à utiliser le bouton **Voter** et partagez les podiums mensuels/annuels.
5. Consultez `/ranking voters` (ou le bouton **Top votants**) pour remercier les membres les plus actifs.

## Extensions possibles

- Ajouter un message épinglé mis à jour automatiquement à chaque vote.
- Générer des graphiques d’évolution à partir des archives YAML.
- Définir plusieurs catégories de classement (ex. « Le plus drôle », « Le plus exigeant », etc.).
