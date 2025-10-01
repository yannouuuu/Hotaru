# 🚀 Guide de déploiement - Hotaru

## 📦 Fichiers du projet

### Documentation
- `README.md` - Documentation principale
- `CHANGELOG.md` - Historique des versions
- `CONTRIBUTING.md` - Guide de contribution
- `PRODUCTION.md` - Checklist de production
- `CAS_INSTRUCTIONS.md` - Instructions pour activer le CAS (futur)
- `DEPLOYMENT.md` - Ce fichier

### Configuration
- `.env` - Variables d'environnement (à créer)
- `env.example` - Template de configuration
- `.gitignore` - Fichiers à ignorer
- `tsconfig.json` - Configuration TypeScript
- `package.json` - Dépendances

### Code source
- `src/` - Code source du bot (44 fichiers)
- `data/` - Base de données (généré automatiquement)

## 🎯 Commandes disponibles

### 21 commandes slash au total

**Vérification** (1):
- `/verify` - Vérification universitaire

**Informations** (3):
- `/info` - Informations générales
- `/links` - Liens utiles
- `/contacts` - Contacts du département

**Citations** (2):
- `/quote` - Ajouter une citation
- `/quotes` - Voir les citations

**Modération** (5):
- `/kick` `/ban` `/timeout` `/warn` `/clear`

**Salons vocaux** (4):
- `/private-voice` - Créer un vocal privé
- `/voice-invite` - Inviter
- `/voice-kick` - Expulser
- `/voice-delete` - Supprimer

**Administration** (4):
- `/setup` - Configuration automatique
- `/cleanup` - Nettoyage complet
- `/refresh-links` - Rafraîchir liens
- `/refresh-ticket` - Rafraîchir tickets

**Non visible** (2):
- `/verify-email` - Ancienne méthode (intégrée)

## 📊 Structure de la base de données

### Tables SQLite (4)

1. **quotes** - Citations des professeurs
   - id, quote, professor, author, authorId, timestamp

2. **tickets** - Tickets de support (legacy, utilisé en mémoire)
   - channelId, userId, category, createdAt, status, closedAt

3. **verified_users** - Utilisateurs vérifiés
   - userId, email, verifiedAt

4. **photo_counter** - Compteur de photos
   - channelId, counter

## 🎨 Structure du serveur Discord

### 6 catégories, 25+ salons

1. **🛠️ SYSTÈME** (6 salons)
2. **💬 DISCUSSIONS** (4 salons)
3. **🔊 SALONS VOCAUX** (5 salons + vocaux privés dynamiques)
4. **📚 COURS & ENTRAIDE** (4 salons)
5. **🎟️ SUPPORT** (1 salon + tickets dynamiques)
6. **🛡️ MODÉRATION** (4 salons)

## 🔐 Sécurité pour la production

### ⚠️ À NE JAMAIS commiter
- `.env` - Contient les tokens
- `data/` - Base de données avec emails

### ✅ Bonnes pratiques
- Changer le token régulièrement
- Limiter les accès admin
- Surveiller les logs
- Sauvegarder `data/` régulièrement

## 📝 Notes de version

**Version actuelle**: 1.0.0

**Prochaines fonctionnalités potentielles**:
- Authentification CAS (nécessite hébergement public + acceptation de l'université)
- Statistiques du serveur
- Système de niveaux
- Notifications personnalisées
- API REST pour intégrations externes

---

**Hotaru est prêt pour la production ! 🎉**

