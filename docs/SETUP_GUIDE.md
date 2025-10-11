# Guide des Commandes Setup et Cleanup

Ce guide détaille l'utilisation des commandes `/setup` et `/cleanup` pour configurer automatiquement votre serveur Discord pour le BUT Informatique de l'Université de Lille.

## 📋 Table des matières

- [Commande /setup](#commande-setup)
- [Commande /cleanup](#commande-cleanup)
- [Structure créée](#structure-créée)
- [Messages interactifs](#messages-interactifs)
- [Composants créés](#composants-créés)
- [Configuration avancée](#configuration-avancée)

---

## 🚀 Commande /setup

### Description
La commande `/setup` configure automatiquement un serveur Discord complet avec tous les rôles, catégories, salons et messages interactifs nécessaires.

### Permissions requises
- ✅ Administrateur du serveur

### Utilisation
```
/setup
```

### Processus de configuration

La commande exécute 7 étapes successives :

#### Étape 1 : Création des rôles (8 rôles)
- 🤖 **Hotaru** (Bleu) - Rôle du bot avec permissions de gestion
- 👑 **Admin** (Rouge) - Permissions administrateur complètes
- 📋 **Délégué** (Orange) - Modération et gestion des messages
- 🎯 **Support** (Bleu clair) - Gestion des tickets et messages
- 🎉 **Animateur** (Or) - Gestion des événements
- 🎓 **Étudiant** (Violet) - Rôle de base pour les étudiants
- ✅ **Vérifié** (Vert) - Accès aux salons privés (invisible)
- 💼 **Jobs** (Vert clair) - Accès au salon des offres d'emploi (invisible)

#### Étape 2 : Création des catégories et salons (6 catégories, ~27 salons)

**🛠️ SYSTÈME** (Public)
- 👋・bienvenue
- ✅・vérification
- 📜・règlement
- 📢・annonces
- 🎭・rôles
- ℹ️・informations
- 🎪・animations

**💬 DISCUSSIONS** (Vérifié uniquement)
- 💬・général
- 🗣️・gossip
- 📸・pictures
- 💭・citations-profs
- 🤖・commandes
- 📊・sondages
- 😂・memes
- 🔗・liens-utiles
- 💼・jobs (Rôle Jobs requis)

**🔊 SALONS VOCAUX** (Vérifié uniquement)
- 🔊・Vocal 1
- 🔊・Vocal 2
- 🔊・Vocal 3
- 🎓・Amphi (50 personnes max)

**📚 COURS & ENTRAIDE** (Vérifié uniquement)
- 📝・aide-devoirs (Forum)
- 🎯・sae
- 📖・ressources
- 📚・partage-cours

**🎟️ SUPPORT** (Public, lecture seule)
- 🎫・support

**🛡️ MODÉRATION** (Admin/Délégués uniquement)
- 🎛️・panel-contrôle
- 🤖・logs-bots
- ⚖️・logs-modération
- 📋・logs-serveur

#### Étape 3 : Envoi des messages interactifs (5 messages)
- Message de vérification
- Message des rôles
- Message des liens utiles
- Message de support
- Panel de contrôle

#### Étape 4 : Sauvegarde dans la base de données
Toutes les données sont enregistrées dans `database.yml`

#### Étape 5 : Génération des identifiants
Configuration `.env` générée automatiquement

#### Étape 6 : Configuration des permissions
Permissions finalisées pour tous les salons

#### Étape 7 : Finalisation
Message de confirmation avec résumé complet

### Résultat final
Après l'exécution, vous recevez :
- ✅ Confirmation de la création de tous les éléments
- 📊 Statistiques détaillées
- 📝 Configuration `.env` à copier

### Sécurité
- ⚠️ Un seul setup par serveur autorisé
- 🔒 Utiliser `/cleanup` avant un nouveau setup
- 💾 Toutes les données sont sauvegardées

---

## 🗑️ Commande /cleanup

### Description
La commande `/cleanup` supprime **COMPLÈTEMENT** tout ce qui a été créé par le setup. Cette opération est **IRRÉVERSIBLE**.

### Permissions requises
- ✅ Administrateur du serveur

### Utilisation
```
/cleanup
```

### Processus de nettoyage

#### Étape 1 : Premier avertissement
- ⚠️ Affichage du nombre d'éléments à supprimer
- Bouton "⚠️ Oui, je veux nettoyer"
- Bouton "❌ Annuler"

#### Étape 2 : Confirmation finale
- 🚨 Avertissement explicite des conséquences
- Bouton "🗑️ SUPPRIMER DÉFINITIVEMENT"
- Bouton "❌ Annuler"

#### Étape 3 : Suppression
1. Suppression de tous les salons (avec délai anti-rate-limit)
2. Suppression de toutes les catégories
3. Suppression de tous les rôles (sauf @everyone)
4. Suppression des données de la base de données

### Éléments supprimés
- 💬 Tous les salons créés par le setup
- 📁 Toutes les catégories
- 🎭 Tous les rôles (sauf @everyone)
- 📨 Tous les messages interactifs
- 💾 Toutes les données de la base de données

### Sécurité
- 🔒 Double confirmation obligatoire
- ❌ Possibilité d'annuler à chaque étape
- 📊 Rapport détaillé après suppression

### ⚠️ ATTENTION
Cette commande est principalement destinée aux **tests** et au développement. Elle supprime **DÉFINITIVEMENT** tous les éléments créés sans possibilité de récupération.

---

## 🏗️ Structure créée

### Résumé des éléments
- **8 rôles** avec permissions personnalisées
- **6 catégories** organisées par thème
- **27 salons** (texte, vocal, forum, annonces)
- **5 messages interactifs** avec boutons et menus

### Permissions configurées
- **Public** : Catégorie SYSTÈME (lecture seule)
- **Vérifié** : DISCUSSIONS, VOCAUX, COURS & ENTRAIDE
- **Jobs** : Salon dédié aux offres d'emploi
- **Support/Délégués** : SUPPORT
- **Admin/Délégués** : MODÉRATION

---

## 🎮 Messages interactifs

### 1. Message de vérification
**Salon :** ✅・vérification
**Contenu :** Instructions pour utiliser `/verify`
**Action :** Les utilisateurs doivent se vérifier pour accéder au serveur

### 2. Message des rôles
**Salon :** 🎭・rôles
**Boutons :**
- 📋 **Délégué** - Toggle le rôle Délégué
- 💼 **Jobs** - Toggle l'accès au salon des offres

### 3. Message des liens utiles
**Salon :** 🔗・liens-utiles
**Menu déroulant :** Sélection de liens (Notion, EDT, etc.)
**Action :** Affiche le lien sélectionné

### 4. Message de support
**Salon :** 🎫・support
**Bouton :** 🎫 Créer un ticket
**Action :** Crée un salon privé pour le demandeur

### 5. Panel de contrôle
**Salon :** 🎛️・panel-contrôle
**Boutons :**
- 🔄 **Rafraîchir** - Recrée tous les messages interactifs
- 📊 **Statistiques** - Affiche les stats du serveur
- ⚙️ **Configuration** - Affiche la config actuelle

---

## 🔧 Composants créés

### Boutons
- `cleanup_confirm_first` - Première confirmation du cleanup
- `cleanup_execute` - Exécution du cleanup
- `cleanup_cancel` - Annulation du cleanup
- `role_delegue` - Toggle rôle Délégué
- `role_jobs` - Toggle rôle Jobs
- `create_ticket` - Création d'un ticket de support
- `panel_refresh` - Rafraîchissement des messages
- `panel_stats` - Affichage des statistiques
- `panel_config` - Affichage de la configuration

### Menus déroulants
- `useful_links_menu` - Sélection de liens utiles

### Fonctionnalités des composants

#### Système de tickets
- Création automatique d'un salon privé
- Permissions configurées pour le créateur et le support
- Nom : `ticket-{username}`
- Parents : Catégorie SUPPORT

#### Système de rôles auto-attribuables
- Toggle automatique (ajouter/retirer)
- Confirmation visuelle avec embed
- Éphémère (visible uniquement par l'utilisateur)

#### Panel administrateur
- **Rafraîchir** : Supprime et recrée tous les messages interactifs
- **Statistiques** : Membres, salons, rôles, date du setup
- **Configuration** : Détails des rôles et catégories créés

---

## ⚙️ Configuration avancée

### Fichier de configuration
Les identifiants sont générés dans `.env` après le setup :

```env
# Rôles
ROLE_HOTARU=123456789
ROLE_ADMIN=123456789
ROLE_DELEGUE=123456789
ROLE_SUPPORT=123456789
ROLE_ANIMATEUR=123456789
ROLE_ETUDIANT=123456789
ROLE_VERIFIE=123456789
ROLE_JOBS=123456789

# Catégories
CATEGORY_SYSTEME=123456789
CATEGORY_DISCUSSIONS=123456789
CATEGORY_VOCAUX=123456789
CATEGORY_COURS=123456789
CATEGORY_SUPPORT=123456789
CATEGORY_MODERATION=123456789

# Salons principaux
CHANNEL_VERIFICATION=123456789
CHANNEL_ROLES=123456789
CHANNEL_SUPPORT=123456789
CHANNEL_PANEL=123456789
```

### Base de données
Structure dans `database.yml` :

```yaml
setup_GUILD_ID:
  guildId: "123456789"
  setupDate: 1696723200000
  roles:
    hotaru: "123456789"
    admin: "123456789"
    # ... autres rôles
  categories:
    systeme: "123456789"
    # ... autres catégories
  channels:
    verification: "123456789"
    # ... autres salons
  messages:
    verification: "123456789"
    # ... autres messages
```

### Personnalisation

#### Modifier les couleurs des rôles
Éditez `src/utils/SetupManager.ts` dans la méthode `getRolesConfig()`.

#### Modifier les salons créés
Éditez `src/utils/SetupManager.ts` dans la méthode `getCategoriesConfig()`.

#### Modifier les messages interactifs
Éditez `src/utils/SetupMessages.ts` pour chaque type de message.

#### Ajouter des liens dans le menu
Éditez `src/utils/SetupMessages.ts` dans `createUsefulLinksMessage()`.

---

## 🐛 Résolution de problèmes

### Le setup échoue
1. Vérifiez que le bot a les permissions nécessaires
2. Utilisez `/cleanup` pour nettoyer les éléments partiels
3. Réessayez le setup

### Un message interactif ne fonctionne pas
Utilisez le bouton "🔄 Rafraîchir" dans le panel de contrôle.

### Les permissions sont incorrectes
1. Vérifiez la hiérarchie des rôles (Hotaru doit être en haut)
2. Vérifiez les permissions du bot au niveau du serveur

### Erreur lors du cleanup
Si des éléments n'ont pas été supprimés :
1. Supprimez-les manuellement
2. Utilisez `/cleanup` à nouveau pour nettoyer la base de données

---

## 📚 Références

### Fichiers principaux
- `src/commands/Admin/slashcommand-setup.ts` - Commande setup
- `src/commands/Admin/slashcommand-cleanup.ts` - Commande cleanup
- `src/utils/SetupManager.ts` - Gestionnaire principal
- `src/utils/SetupMessages.ts` - Messages interactifs
- `src/types/setup.d.ts` - Types TypeScript

### Composants
- `src/components/Button/` - Tous les boutons interactifs
- `src/components/SelectMenu/` - Menus déroulants

---

## ✅ Checklist post-setup

- [ ] Vérifier que tous les rôles sont créés
- [ ] Vérifier que toutes les catégories sont créées
- [ ] Vérifier que tous les salons sont créés
- [ ] Tester les boutons dans le salon des rôles
- [ ] Tester la création d'un ticket
- [ ] Copier la configuration `.env` générée
- [ ] Configurer les logs si nécessaire
- [ ] Personnaliser les liens utiles
- [ ] Tester le panel de contrôle

---

## 🎯 Cas d'usage

### Premier déploiement
```
1. /setup
2. Copier la config .env
3. Tester les fonctionnalités
4. Personnaliser si nécessaire
```

### Tests et développement
```
1. /setup (créer la structure)
2. Tester les modifications
3. /cleanup (tout supprimer)
4. Recommencer
```

### Migration depuis un autre bot
```
1. Sauvegarder les données existantes
2. /cleanup si ancien setup présent
3. /setup pour nouvelle structure
4. Importer les données sauvegardées
```

---

**Note :** Ce système est conçu pour être utilisé sur un serveur Discord dédié au BUT Informatique de l'Université de Lille. Adaptez la configuration selon vos besoins spécifiques.
