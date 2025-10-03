<img alt="Hotaru: A Discord bot for student servers" src="assets/header.png" width="100%" />

Hotaru est un bot Discord développé pour la gestion de serveurs dédiés aux étudiants du BUT Informatique de l'Université de Lille. Il intègre des fonctionnalités de vérification, modération, gestion de contenu et intégration IA.

## Fonctionnalités Principales

- **Vérification Utilisateur** : Authentification via email universitaire avec attribution automatique de rôles.
- **Modération** : Outils pour kick, ban, timeout, warn et suppression de messages.
- **Gestion de Contenu** : Système de citations, liens utiles, contacts et rappels.
- **Support** : Système de tickets avec salons privés.
- **Intégration IA** : Commandes pour explication de code, revue, génération et traduction via OpenRouter.
- **Administration** : Configuration automatique du serveur et outils de maintenance.
- **Logs** : Trois canaux dédiés pour logs bot, modération et serveur.

## Installation

### Prérequis
- Bun runtime
- Compte Discord Developer

### Étapes
1. Cloner le dépôt : `git clone <repo>`
2. Installer dépendances : `bun install`
3. Configurer application Discord avec intents activés.
4. Remplir `.env` avec TOKEN, CLIENT_ID, GUILD_ID et optionnellement OPENROUTER_KEY.
5. Lancer : `bun run dev` (développement) ou `bun start` (production)

## Configuration Serveur
Exécuter `/setup` pour configurer rôles, catégories et canaux automatiquement. Mettre à jour `.env` avec IDs générés.

## Commandes

<details>
<summary>Liste des Commandes</summary>

### Générales
- `/verify` : Vérifier l'identité via email universitaire.
- `/info` : Afficher informations générales.
- `/links` : Afficher liens utiles.
- `/contacts` : Afficher contacts du département.
- `/quote` : Ajouter une citation.
- `/quotes` : Afficher citations.
- `/remind` : Définir un rappel.
- `/reminders` : Lister rappels.
- `/translate` : Traduire documentation technique.
- `/summarize` : Résumer article via URL.

### Modération
- `/kick` : Expulser membre.
- `/ban` : Bannir membre.
- `/timeout` : Mettre en timeout.
- `/warn` : Avertir membre.
- `/clear` : Supprimer messages.

### IA
- `/ai-chat` : Discuter avec IA.
- `/ai-explain` : Expliquer code.
- `/ai-review` : Revoir code.
- `/ai-gen` : Générer code.

### Administration
- `/setup` : Configurer serveur.
- `/cleanup` : Nettoyer serveur.
- `/refresh-links` : Rafraîchir message liens.
- `/refresh-jobs` : Rafraîchir offres d'emploi.
- `/refresh-ticket` : Rafraîchir message tickets.
- `/manage-verified` : Gérer utilisateurs vérifiés (remove, list, check).

</details>

## Structure du Serveur

- **SYSTÈME** : Bienvenue, vérification, règlement, annonces, rôles, liens.
- **DISCUSSIONS** : Général, gossip, pictures, citations, commandes.
- **SALONS VOCAUX** : Vocaux multiples.
- **COURS & ENTRAIDE** : Aide, SAE, ressources, partage.
- **SUPPORT** : Tickets.
- **MODÉRATION** : Panel, logs.

## Déploiement

### Heroku
Utiliser `deploy-heroku.ps1` pour déploiement automatique. Voir `HEROKU_DEPLOYMENT.md`.

## Technologies
- Bun
- Discord.js v14
- TypeScript
- SQLite

<img alt="Hotaru: A Discord bot for student servers" src="assets/footer.png" width="100%" />
