# Changelog - Ajout des salons "memes" et "jobs"

## 📅 Date : 03/10/2025

## ✨ Nouveautés

### 1. Nouveau salon `#memes` 😂
- Ajouté dans la catégorie **DISCUSSIONS**
- Accessible à tous les membres vérifiés
- Canal libre pour partager memes et délires

### 2. Nouveau salon `#jobs` 💼
- Ajouté dans la catégorie **DISCUSSIONS**
- Accessible en lecture seule aux membres vérifiés
- Affichage automatique des offres d'emploi étudiants à Lille

### 3. Système de scraping automatisé 🤖
- Intégration de l'**API officielle France Travail**
- Recherche automatique toutes les 6 heures
- Filtrage intelligent des offres adaptées aux étudiants
- Zone géographique : Lille et environs (10 km)

## 📦 Fichiers créés

### Services
- `src/services/jobsService.ts` - Interface avec l'API France Travail
  - Authentification OAuth2
  - Recherche d'offres par commune
  - Filtrage pour étudiants

### Utilitaires
- `src/utils/jobsManager.ts` - Gestionnaire d'affichage Discord
  - Création d'embeds enrichis
  - Système de cache anti-doublon
  - Mise à jour automatique
  - Sauvegarde des offres postées

### Commandes
- `src/commands/admin/refresh-jobs.ts` - Commande de mise à jour manuelle
  - Réservée aux administrateurs
  - Force la recherche de nouvelles offres

### Documentation
- `docs/JOBS_API.md` - Guide complet de configuration
- `docs/CHANGELOG_JOBS.md` - Ce fichier

## 🔧 Fichiers modifiés

### Configuration
- `package.json` - Ajout de la dépendance `axios`
- `env.example` - Ajout des variables d'environnement :
  - `FRANCE_TRAVAIL_CLIENT_ID`
  - `FRANCE_TRAVAIL_CLIENT_SECRET`
  - `CHANNEL_JOBS_ID`

### Setup
- `src/commands/setup/setup.ts`
  - Ajout du canal `#memes` (ligne 373-378)
  - Ajout du canal `#jobs` (ligne 380-396)
  - Ajout de `CHANNEL_JOBS_ID` dans le résumé .env

### Événements
- `src/events/ready.ts`
  - Initialisation du JobsManager au démarrage
  - Démarrage de la mise à jour automatique (6h)

## 🚀 Installation

### 1. Installer les dépendances

```bash
npm install
# ou
bun install
```

### 2. Configurer l'API France Travail

1. Créez un compte sur https://francetravail.io/
2. Créez une application et souscrivez à l'API "Offres d'emploi v2"
3. Récupérez vos identifiants (Client ID et Secret)

### 3. Mettre à jour le fichier .env

```env
# API France Travail
FRANCE_TRAVAIL_CLIENT_ID=votre_client_id
FRANCE_TRAVAIL_CLIENT_SECRET=votre_client_secret
```

### 4. Reconfigurer le serveur Discord

Si votre serveur est déjà configuré, vous avez deux options :

#### Option A : Relancer le setup complet
```
/setup
```
> ⚠️ Cela recréera tous les salons !

#### Option B : Créer les salons manuellement
1. Créez un salon `#memes` dans la catégorie DISCUSSIONS
2. Créez un salon `#jobs` dans la catégorie DISCUSSIONS (en lecture seule)
3. Ajoutez `CHANNEL_JOBS_ID` dans votre `.env` avec l'ID du canal jobs

### 5. Redémarrer le bot

```bash
npm run dev
# ou
bun run dev
```

## 📊 Fonctionnement

### Mise à jour automatique
- **Fréquence** : Toutes les 6 heures
- **Première exécution** : 1 minute après le démarrage
- **Zone** : Lille et 10 communes environnantes (10 km de rayon)
- **Limite** : 20 offres maximum par mise à jour

### Critères de filtrage
- **Types de contrat** : CDD, CDI, Intérim, Saisonnier
- **Expérience** : Débutant accepté
- **Temps de travail** : Temps plein et temps partiel
- **Mots-clés** : étudiant, temps partiel, weekend, soir, alternance, flexible

### Mise à jour manuelle

Utilisez la commande (admin uniquement) :
```
/refresh-jobs
```

## 🗺️ Zone géographique couverte

- Lille (59350)
- Villeneuve-d'Ascq (59491)
- Wasquehal (59512)
- Croix (59152)
- Roubaix (59163)
- Tourcoing (59606)
- La Madeleine (59178)
- Lambersart (59017)
- Mons-en-Barœul (59368)
- Marquette-lez-Lille (59457)
- Hem (59298)

Rayon de recherche : **10 km** autour de chaque commune

## 📁 Structure des données

Le système crée automatiquement un fichier de cache :
```
data/posted-jobs.json
```

Ce fichier contient :
- Les IDs des 1000 dernières offres postées
- La date de dernière mise à jour

## ⚙️ Configuration avancée

### Modifier la fréquence de mise à jour

Dans `src/events/ready.ts`, ligne 17 :
```typescript
jobsManager.startAutoUpdate(6); // 6 heures
```

Changez le nombre d'heures selon vos besoins.

### Modifier le nombre d'offres affichées

Dans `src/services/jobsService.ts`, ligne 198 :
```typescript
return allOffers.slice(0, 20); // 20 offres max
```

### Ajouter d'autres communes

Dans `src/services/jobsService.ts`, lignes 131-141 :
```typescript
const communes = [
  '59350', // Lille
  // Ajoutez vos codes communes ici
];
```

Trouvez les codes communes sur : https://www.insee.fr/fr/recherche/recherche-geographique

## 🐛 Dépannage

Consultez le fichier `docs/JOBS_API.md` pour le guide complet de dépannage.

### Messages courants

- ✅ "X offre(s) postée(s) dans #jobs" → Tout fonctionne
- ℹ️ "Aucune nouvelle offre à poster" → Pas de nouvelles offres
- ⚠️ "API France Travail non configurée" → Vérifiez vos identifiants
- ❌ "Erreur lors de l'authentification" → Client ID/Secret invalides

## 📚 Documentation complète

Pour plus de détails, consultez :
- `docs/JOBS_API.md` - Configuration détaillée de l'API
- API France Travail : https://francetravail.io/data/documentation

## 🎯 Prochaines étapes

1. Installer les dépendances : `npm install`
2. Configurer l'API France Travail
3. Mettre à jour votre `.env`
4. Redémarrer le bot
5. Tester avec `/refresh-jobs`
