# 🎯 Système de Setup Automatique

Ce bot inclut un système complet de configuration automatique de serveur Discord pour le BUT Informatique de l'Université de Lille.

## ✨ Nouvelles Fonctionnalités

### Commande `/setup`
Configure automatiquement un serveur Discord complet en 7 étapes :
- ✅ **8 rôles** avec permissions personnalisées
- ✅ **6 catégories** organisées (Système, Discussions, Vocaux, Cours, Support, Modération)
- ✅ **27 salons** (texte, vocal, forum, annonces)
- ✅ **5 messages interactifs** avec boutons et menus déroulants
- ✅ **Sauvegarde automatique** dans la base de données
- ✅ **Configuration .env** générée automatiquement

### Commande `/cleanup`
Supprime complètement tout ce qui a été créé par le setup :
- 🗑️ **Double confirmation** obligatoire pour la sécurité
- 🗑️ Suppression de tous les salons, catégories et rôles
- 🗑️ Nettoyage complet de la base de données
- 🗑️ **Irréversible** - Parfait pour les tests et le développement

## 🎮 Messages Interactifs

### 1. Système de Vérification
- Message avec instructions pour `/verify`
- Contrôle d'accès au serveur

### 2. Attribution de Rôles
- Bouton **Délégué** (représentant de promo)
- Bouton **Jobs** (accès aux offres d'emploi)
- Toggle automatique (ajouter/retirer)

### 3. Liens Utiles
- Menu déroulant avec liens importants
- Notion, EDT, Moodle, etc.
- Facilement personnalisable

### 4. Système de Tickets
- Bouton de création de ticket
- Salon privé automatique
- Permissions configurées pour le support

### 5. Panel de Contrôle
- 🔄 **Rafraîchir** - Recrée tous les messages
- 📊 **Statistiques** - Stats du serveur
- ⚙️ **Configuration** - Détails de la config

## 📁 Fichiers Créés

### Commandes
- `src/commands/Admin/slashcommand-setup.ts` - Commande de configuration
- `src/commands/Admin/slashcommand-cleanup.ts` - Commande de nettoyage

### Utilitaires
- `src/utils/SetupManager.ts` - Gestionnaire principal (création rôles/salons)
- `src/utils/SetupMessages.ts` - Messages interactifs et embeds

### Composants
- `src/components/Button/cleanup-*.ts` - Boutons de confirmation cleanup (3 fichiers)
- `src/components/Button/role-*.ts` - Boutons d'attribution de rôles (2 fichiers)
- `src/components/Button/create-ticket.ts` - Création de tickets
- `src/components/Button/panel-*.ts` - Boutons du panel admin (3 fichiers)
- `src/components/SelectMenu/useful-links-menu.ts` - Menu des liens utiles

### Types
- `src/types/setup.d.ts` - Interfaces TypeScript complètes

## 🔧 Configuration

### Structure des Données
Toutes les données sont sauvegardées dans `database.yml` :
```yaml
setup_GUILD_ID:
  guildId: "..."
  setupDate: 1696723200000
  roles: { hotaru: "...", admin: "...", ... }
  categories: { systeme: "...", ... }
  channels: { verification: "...", ... }
  messages: { verification: "...", ... }
```

### Variables d'Environnement
Après le setup, copiez la configuration générée dans `.env` :
```env
ROLE_HOTARU=...
ROLE_ADMIN=...
# ... etc
```

## 📖 Documentation Complète

Consultez le guide complet : [`docs/SETUP_GUIDE.md`](./docs/SETUP_GUIDE.md)

## 🎯 Utilisation Rapide

```bash
# 1. Configuration initiale du serveur
/setup

# 2. Copier la config .env générée

# 3. Tester les fonctionnalités

# 4. En cas de problème, tout supprimer :
/cleanup
```

## 🛡️ Sécurité

- ✅ Permissions vérifiées (Administrateur requis)
- ✅ Double confirmation pour le cleanup
- ✅ Rate limiting intégré
- ✅ Sauvegarde automatique
- ✅ Gestion des erreurs complète

## 🎨 Personnalisation

Tous les éléments sont facilement personnalisables :
- **Couleurs des rôles** : `src/utils/SetupManager.ts`
- **Salons créés** : `src/utils/SetupManager.ts`
- **Messages** : `src/utils/SetupMessages.ts`
- **Liens utiles** : `src/utils/SetupMessages.ts`

## 📊 Statistiques

Après un setup complet :
- 🎭 **8 rôles** créés
- 📁 **6 catégories** organisées
- 💬 **27 salons** configurés
- 📨 **5 messages interactifs** déployés
- 🎮 **9 composants** (boutons/menus) fonctionnels

## 🔍 Architecture

### SetupManager
Gère la création des éléments Discord :
- Création de rôles avec permissions
- Création de catégories avec permissions
- Création de salons avec configuration
- Sauvegarde dans la base de données

### SetupMessages
Gère les messages interactifs :
- Embeds personnalisés
- Boutons et menus déroulants
- Messages de progression
- Messages de confirmation

### Composants
Handlers pour les interactions utilisateur :
- Toggle de rôles
- Création de tickets
- Panel administrateur
- Menu de liens utiles

## 🧪 Tests

```bash
# 1. Setup complet
/setup

# 2. Tester tous les boutons et menus

# 3. Vérifier les permissions

# 4. Cleanup complet
/cleanup

# 5. Recommencer
/setup
```

## 🚀 Prochaines Fonctionnalités

- [ ] Commande `/verify` pour le système de vérification
- [ ] Commande `/close-ticket` pour fermer les tickets
- [ ] Logs automatiques dans les salons de modération
- [ ] Statistiques avancées
- [ ] Système de niveaux/XP
- [ ] Gestion des warnings
- [ ] Auto-modération

---

**Note :** Ce système a été conçu spécifiquement pour le BUT Informatique de l'Université de Lille, mais peut être facilement adapté à d'autres contextes.
