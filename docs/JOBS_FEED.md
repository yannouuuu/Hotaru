# 💼 Flux d'offres France Travail

Ce module permet d'alimenter automatiquement le salon `💼・jobs` avec des offres d'emploi issues de l'API France Travail.

## ✨ Fonctionnalités principales

- **Mise à jour automatique** : récupération périodique des nouvelles offres (intervalle configurable).
- **Déduplication** : chaque offre n'est postée qu'une seule fois, même en cas de rafraîchissements répétés.
- **Présentation soignée** : publication sous forme d'embed avec titre, entreprise, localisation, contrat, salaire et dates clés.
- **Commande d'administration** : `/jobs refresh` pour forcer un rafraîchissement immédiat et `/jobs statut` pour consulter l'état du flux.
- **Gestion des erreurs** : journalisation des échecs d'appel API et affichage dans `/jobs statut`.

## ⚙️ Prérequis API France Travail

1. Créez une application sur [France Travail développeurs](https://entreprise.francetravail.fr/).
2. Récupérez votre `client_id` et `client_secret`.
3. Activez l'API **Offres d'emploi v2** et conservez la portée `api_offresdemploiv2 o2dsoffre`.
4. Renseignez les variables d'environnement :

```env
FRANCE_TRAVAIL_CLIENT_ID=...
FRANCE_TRAVAIL_CLIENT_SECRET=...
# Optionnel : personnalisation du flux
FRANCE_TRAVAIL_KEYWORDS=informatique,développeur
FRANCE_TRAVAIL_DEPARTMENTS=59,62
FRANCE_TRAVAIL_CONTRACTS=CDI,CDD,MIS
FRANCE_TRAVAIL_UPDATE_INTERVAL=60
```

> Astuce : référez-vous au fichier `.env.example` pour l'ensemble des options disponibles.

## 🚀 Démarrage

1. Assurez-vous d'avoir lancé la commande `/setup` pour créer le rôle `Jobs` et le salon `💼・jobs`.
2. Redémarrez le bot : le **JobsManager** sera initialisé lors de l'évènement `clientReady`.
3. Vérifiez l'état du flux avec `/jobs statut`.
4. Si nécessaire, lancez un rafraîchissement manuel avec `/jobs refresh` (permission `Gérer le serveur`).

## 📦 Données stockées

Le bot stocke un cache léger pour chaque serveur dans la base YAML :

```yaml
jobs_feed_{guildId}:
  knownOfferIds: ["123456", "654321", ...]
  lastFetchAt: 1731175200000
  lastPublishAt: 1731175260000
  lastError: null
```

- `knownOfferIds` : dernières offres déjà publiées (limité à 200).
- `lastFetchAt` : date du dernier appel à l'API France Travail.
- `lastPublishAt` : date de la dernière publication dans Discord.
- `lastError` : message d'erreur de la dernière tentative (si échec).

## ❗ Dépannage

- **Pas de nouvelles offres publiées** : vérifiez que l'intervalle est raisonnable (`FRANCE_TRAVAIL_UPDATE_INTERVAL`) et que les critères (`FRANCE_TRAVAIL_KEYWORDS`, `FRANCE_TRAVAIL_DEPARTMENTS`, etc.) ne sont pas trop restrictifs.
- **Erreur d'authentification** : confirmez que `FRANCE_TRAVAIL_CLIENT_ID` et `FRANCE_TRAVAIL_CLIENT_SECRET` sont valides et que votre application dispose des droits sur l'API.
- **Salon introuvable** : relancez `/setup` ou mettez à jour la base (`setup_{guildId}`) avec l'identifiant correct du salon jobs.

## 🔄 Personnalisation avancée

Les options par défaut (mots-clés, départements, types de contrat) sont définies dans `JobsManager`. Vous pouvez modifier le comportement en ajustant les variables d'environnement ou en étendant la classe pour appliquer des logiques spécifiques (ex. multi-sources, filtres par rôle, webhooks externes).

## 🔮 Pistes d'amélioration

- Ajouter une commande `/jobs config` pour modifier les paramètres directement via Discord.
- Activer la suppression automatique des offres expirées après X jours.
- Envoyer un résumé hebdomadaire dans un salon staff.
- Supporter plusieurs salons d'offres (ex. alternance, stage, CDI) avec des filtres dédiés.

---

Pour toute évolution ou intégration supplémentaire, consultez `src/utils/JobsManager.ts` et la commande `src/commands/Utility/slashcommand-jobs.ts`.
