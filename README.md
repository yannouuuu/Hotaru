# 🎓 Hotaru - Bot Discord BUT Informatique Lille

**Hotaru** est un bot Discord conçu spécifiquement pour les étudiants du BUT Informatique de l'Université de Lille. Il permet de gérer facilement un serveur Discord pour votre promotion avec des fonctionnalités adaptées à la vie étudiante.

## ✨ Fonctionnalités

### 🔐 Vérification universitaire
- Vérification via email @univ-lille.fr
- Renommage automatique (Prénom Nom)
- Attribution des rôles Vérifié + Étudiant
- Disparition du salon de vérification après validation

### 🛡️ Modération complète
- `/kick` - Expulser un membre
- `/ban` - Bannir un membre
- `/timeout` - Mettre en timeout
- `/warn` - Avertir un membre
- `/clear` - Supprimer des messages en masse

### 💬 Système de citations
- `/quote` - Ajouter une citation de professeur
- `/quotes` - Afficher les dernières citations
- Affichage automatique dans #citations-profs

### 📚 Informations universitaires
- `/info` - Informations générales
- `/links` - Liens utiles
- `/contacts` - Contacts du département
- Menu interactif dans #liens-utiles

### 🎫 Système de tickets
- Salon #support permanent avec bouton
- Création automatique de salons privés
- Visible par l'étudiant + délégués/support/admins

### 📸 Salon photos avec threads
- Threads automatiques sur chaque image
- Numérotation : Photo 1, Photo 2, etc.
- Compteur persistant en base de données

### 🎭 Sélection de rôles
- Bouton pour obtenir le rôle Délégué
- Système toggle (ajouter/retirer)

### 🎛️ Panel de contrôle (Admins)
- Rafraîchir tous les messages automatiques
- Git pull depuis Discord
- Maintenance facilitée

### 📊 Trois systèmes de logs
- 🤖 logs-bots : Actions du bot
- 🛡️ logs-modération : Actions de modération
- 🗂️ logs-serveur : Événements du serveur

### 🤖 Productivité & IA
- `/ai-chat <message>` - Discute avec l'IA de manière naturelle
- `/ai-explain <code>` - Explique un code source
- `/ai-review <code>` - Relecture et suggestions d'amélioration
- `/ai-gen <prompt>` - Génère un snippet de code
- `/translate <lang> <text>` - Traduit une documentation technique
- `/summarize <url>` - Résume un article ou documentation

### ⚙️ Setup & Maintenance
- `/setup` - Configuration automatique complète
- `/cleanup` - Nettoyage pour recommencer

## 🚀 Installation rapide

> **💡 Déploiement sur Heroku** : Consultez `QUICKSTART_HEROKU.md` pour déployer en production avec vos crédits GitHub Student Pack !

### 1. Prérequis
- [Bun](https://bun.sh/) installé
- Compte Discord Developer

### 2. Installation

```bash
git clone <votre-repo>
cd Hotaru
bun install
```

### 3. Configuration Discord

1. Créez une application sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Onglet **Bot** → Activez les 3 intents:
   - Presence Intent
   - Server Members Intent
   - Message Content Intent
3. Copiez le **Token**
4. Onglet **OAuth2** → Générez l'URL d'invitation avec `bot` + `applications.commands` + `Administrator`
5. Invitez le bot sur votre serveur

### 4. Configuration du bot

```bash
cp env.example .env
```

Éditez `.env` et remplissez:
```env
DISCORD_TOKEN=votre_token
CLIENT_ID=votre_client_id
GUILD_ID=votre_server_id
OPENROUTER_KEY=votre_cle_openrouter  # Optionnel : pour les commandes IA
```

> **Note :** Pour utiliser les commandes IA (`/ai-explain`, `/ai-review`, etc.), vous devez créer un compte sur [OpenRouter](https://openrouter.ai/) et obtenir une clé API.

### 5. Lancement

```bash
# Développement (auto-reload)
bun run dev

# Production
bun start
```

### 6. Configuration automatique

Sur Discord:
```
/setup
```

Copiez tous les IDs générés dans votre `.env`, puis redémarrez le bot.

## 📖 Commandes disponibles

### Pour tous
- `/verify` - Vérification universitaire
- `/info` - Informations générales
- `/links` - Liens utiles
- `/contacts` - Contacts du département
- `/quote` - Ajouter une citation
- `/quotes` - Voir les citations

### Modérateurs
- `/kick` `/ban` `/timeout` `/warn` `/clear`

### Administrateurs
- `/setup` - Configurer le serveur
- `/cleanup` - Nettoyer le serveur
- `/refresh-links` - Rafraîchir le message des liens
- `/refresh-ticket` - Rafraîchir le message des tickets

## 🗂️ Structure du serveur

```text
### 🛠️ SYSTÈME
- 👋 bienvenue (vide, personnalisable)
- ✅ vérification (disparaît après vérification)
- 📜 règlement (lecture seule)
- 📢 annonces (admins seulement)
- 🎭 rôles (sélection du rôle Délégué)
- 🔗 liens-utiles (menu interactif)

### 💬 DISCUSSIONS
- 💬 général
- ☕ gossip
- 🖼️ pictures (threads automatiques)
- 📖 citations-profs (lecture seule)
- 🤖 commandes

### 🔊 SALONS VOCAUX
- 🎙️ Vocal 1, 2, 3
- 🏛️ Amphi (50 personnes max)

### 📚 COURS & ENTRAIDE
- 📝 aide-devoirs
- 🎯 sae
- 📂 ressources
- 📑 partage-cours

### 🎟️ SUPPORT
- 🎟️ support (bouton pour tickets)

### 🛡️ MODÉRATION
- 🎛️ panel-controle (admins)
- 🤖 logs-bots
- 🛡️ logs-modération
- 🗂️ logs-serveur

## 🔄 Réutilisation

Pour chaque nouveau semestre:
1. Nouveau serveur Discord
2. Nouveau bot Discord
3. Même code source
4. `/setup`
5. Copier les IDs
6. Redémarrer
7. ✅ Prêt !

## 🌐 Déploiement en production

### Heroku (Recommandé avec GitHub Student Pack)
```bash
# Installation automatique
.\deploy-heroku.ps1

# Voir QUICKSTART_HEROKU.md pour le guide complet
```

**Avantages** :
- ✅ ~$13/mois de crédits gratuits avec GitHub Student Pack
- ✅ Déploiement simple avec Git
- ✅ Logs et monitoring intégrés
- ✅ Parfait pour un bot Discord étudiant

### Autres options
- **Railway** - Alternative moderne à Heroku
- **Fly.io** - Hébergement gratuit limité
- **VPS** (DigitalOcean, Linode) - Plus de contrôle
- **Serveur local** - Pour développement uniquement

📖 Documentation complète : `HEROKU_DEPLOYMENT.md`

## 📝 Personnalisation

### Modifier les contacts
Éditez `src/utils/universityData.ts`

### Ajouter des commandes
Créez un fichier dans `src/commands/[catégorie]/`
Le bot chargera automatiquement la nouvelle commande.

## 🛠️ Technologies

- **Bun** - Runtime JavaScript ultra-rapide
- **Discord.js v14** - Framework Discord
- **TypeScript** - JavaScript typé
- **SQLite** - Base de données

## 📄 Licence

MIT License - Libre d'utilisation et modification


