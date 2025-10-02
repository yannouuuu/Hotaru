# Configuration de l'API France Travail (Offres d'Emploi)

Le bot Hotaru peut automatiquement récupérer et afficher des offres d'emploi étudiants dans la région lilloise grâce à l'API officielle France Travail.

## Fonctionnalités

- 🔄 **Mise à jour automatique** : Vérification toutes les 6 heures
- 📍 **Géolocalisation** : Offres limitées à Lille et environs (Villeneuve-d'Ascq, Tourcoing, Roubaix, etc.)
- 🎓 **Filtre étudiant** : Seulement les offres adaptées aux étudiants (temps partiel, alternance, débutant accepté)
- 💼 **Affichage enrichi** : Embeds Discord avec toutes les informations importantes
- 🚫 **Anti-doublon** : Les offres déjà postées ne sont pas réaffichées

## Configuration

### 1. Créer un compte développeur France Travail

1. Rendez-vous sur **https://francetravail.io/**
2. Cliquez sur **"S'inscrire"** en haut à droite
3. Créez votre compte développeur
4. Une fois connecté, allez dans **"Mes applications"**

### 2. Créer une application

1. Cliquez sur **"Créer une application"**
2. Remplissez les informations :
   - **Nom** : Hotaru Bot (ou le nom de votre choix)
   - **Description** : Bot Discord pour le BUT Informatique
   - **Type** : Application web
3. Validez la création

### 3. Obtenir les identifiants

1. Dans votre application, allez dans l'onglet **"API"**
2. Souscrivez à l'API **"Offres d'emploi v2"**
3. Vous obtiendrez :
   - Un **Client ID**
   - Un **Client Secret**

### 4. Configurer le bot

Ajoutez ces variables dans votre fichier `.env` :

```env
FRANCE_TRAVAIL_CLIENT_ID=votre_client_id_ici
FRANCE_TRAVAIL_CLIENT_SECRET=votre_client_secret_ici
CHANNEL_JOBS_ID=id_du_canal_jobs
```

> ⚠️ **Important** : Le `CHANNEL_JOBS_ID` sera automatiquement généré par la commande `/setup`. Si vous avez déjà configuré votre serveur, vous devrez relancer `/setup` ou ajouter l'ID manuellement.

## Utilisation

### Automatique

Une fois configuré, le bot vérifiera automatiquement les nouvelles offres **toutes les 6 heures** et les postera dans le canal `#jobs`.

### Manuelle

Vous pouvez forcer une mise à jour avec la commande slash :

```
/refresh-jobs
```

> 📝 **Note** : Cette commande est réservée aux administrateurs.

## Critères de recherche

Le bot recherche des offres avec les critères suivants :

### Localisation
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

**Rayon** : 10 km autour de chaque commune

### Type de contrat
- CDD
- CDI
- Intérim (MIS)
- Saisonnier

### Expérience
- Débutant accepté

### Mots-clés filtrés
Les offres doivent contenir au moins un des mots-clés suivants :
- "étudiant"
- "temps partiel"
- "weekend"
- "soir"
- "alternance"
- "flexible"

## Dépannage

### Le bot ne poste aucune offre

1. **Vérifiez la configuration**
   - Les identifiants API sont-ils corrects dans `.env` ?
   - Le `CHANNEL_JOBS_ID` est-il défini ?

2. **Vérifiez les logs**
   - Le bot affiche-t-il des erreurs au démarrage ?
   - Regardez la console pour les messages commençant par `🔍`, `✅` ou `❌`

3. **Testez manuellement**
   - Utilisez `/refresh-jobs` pour forcer une mise à jour
   - Cela affichera des messages d'erreur détaillés si la configuration est incorrecte

### "API France Travail non configurée"

Ce message apparaît si les variables `FRANCE_TRAVAIL_CLIENT_ID` ou `FRANCE_TRAVAIL_CLIENT_SECRET` sont manquantes dans le fichier `.env`.

### "Aucune nouvelle offre à poster"

C'est normal ! Cela signifie que :
- Soit il n'y a pas de nouvelles offres depuis la dernière vérification
- Soit toutes les offres ont déjà été postées

### Erreur 401 (Unauthorized)

Vos identifiants API sont incorrects. Vérifiez :
1. Le Client ID et Client Secret dans votre fichier `.env`
2. Que vous avez bien souscrit à l'API "Offres d'emploi v2" sur francetravail.io
3. Que votre application n'a pas été désactivée

## Limites

- **Rate limit** : L'API France Travail limite à 3 requêtes par seconde
- **Résultats** : Maximum 20 offres par mise à jour
- **Cache** : Les 1000 dernières offres postées sont gardées en mémoire pour éviter les doublons
- **Délai** : 1 seconde entre chaque message Discord pour éviter le rate limit

## Structure des données

Les offres sont stockées temporairement dans :
```
data/posted-jobs.json
```

Ce fichier contient les IDs des offres déjà postées et la date de dernière mise à jour.

## API France Travail

- **Documentation** : https://francetravail.io/data/documentation
- **Inscription** : https://francetravail.io/
- **Support** : Via le portail francetravail.io


