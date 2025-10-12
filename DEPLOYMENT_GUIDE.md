# 🚀 Guide de Déploiement Hotaru sur Discord Étudiant

## 📋 Checklist complète avant déploiement

### ✅ Étape 1 : Configuration Heroku (FAIT ✓)
- [x] Buildpack Bun installé
- [x] Remote Heroku configuré (`hotaru-bot-app`)

---

## 🔧 Étape 2 : Variables d'environnement Heroku

### **Variables OBLIGATOIRES** (à vérifier/mettre à jour)

#### 🤖 Discord Bot
```bash
# Token du bot Discord (ATTENTION : celui actuel semble invalide)
heroku config:set CLIENT_TOKEN=VOTRE_NOUVEAU_TOKEN_DISCORD --app hotaru-bot-app

# ID de ton bot Discord (déjà configuré)
heroku config:set CLIENT_ID=1422956554390474842 --app hotaru-bot-app

# ID de ton serveur Discord étudiant (CHANGER si nouveau serveur)
heroku config:set GUILD_ID=TON_NOUVEAU_GUILD_ID --app hotaru-bot-app

# Ton ID Discord (propriétaire du bot)
heroku config:set OWNER_ID=TON_USER_ID_DISCORD --app hotaru-bot-app

# IDs des développeurs (séparés par virgules)
heroku config:set DEVELOPER_IDS=TON_USER_ID,AUTRE_ID --app hotaru-bot-app
```

#### 📧 Configuration SMTP (pour vérification email)
**Option 1 : Gmail (Recommandé)**
```bash
heroku config:set SMTP_HOST=smtp.gmail.com --app hotaru-bot-app
heroku config:set SMTP_PORT=587 --app hotaru-bot-app
heroku config:set SMTP_SECURE=false --app hotaru-bot-app
heroku config:set SMTP_USER=ton-email@gmail.com --app hotaru-bot-app
heroku config:set SMTP_PASS=ton-mot-de-passe-application --app hotaru-bot-app
heroku config:set EMAIL_FROM="Hotaru Bot <noreply@hotaru-bot.com>" --app hotaru-bot-app
```

📝 **Comment obtenir un mot de passe d'application Gmail :**
1. Va sur https://myaccount.google.com/security
2. Active la validation en 2 étapes
3. Cherche "Mots de passe des applications"
4. Génère un mot de passe pour "Mail" / "Autre"
5. Copie le mot de passe de 16 caractères

**Option 2 : Email universitaire**
```bash
heroku config:set SMTP_HOST=smtp.univ-lille.fr --app hotaru-bot-app
heroku config:set SMTP_PORT=465 --app hotaru-bot-app
heroku config:set SMTP_SECURE=true --app hotaru-bot-app
heroku config:set SMTP_USER=ton-login-universitaire --app hotaru-bot-app
heroku config:set SMTP_PASS=ton-mot-de-passe --app hotaru-bot-app
```

#### 🎓 Configuration Université
```bash
# Domaine email de ton université
heroku config:set UNIVERSITY_DOMAIN=univ-lille.fr --app hotaru-bot-app
```

### **Variables OPTIONNELLES** (mais recommandées)

#### 🤖 OpenRouter (pour commandes IA)
```bash
# Si tu veux les commandes /ai-chat, /ai-explain, etc.
heroku config:set OPENROUTER_KEY=ta-clé-openrouter --app hotaru-bot-app
```
📝 Obtenir une clé : https://openrouter.ai/keys

#### 💼 France Travail (pour flux jobs)
```bash
# Si tu veux le système d'offres d'emploi
heroku config:set FRANCE_TRAVAIL_CLIENT_ID=ton-client-id --app hotaru-bot-app
heroku config:set FRANCE_TRAVAIL_CLIENT_SECRET=ton-client-secret --app hotaru-bot-app
```
📝 S'inscrire : https://francetravail.io/

---

## 🎯 Étape 3 : Configuration du bot Discord

### 1. **Créer/Vérifier le bot sur Discord Developer Portal**
- Va sur https://discord.com/developers/applications
- Sélectionne ton application (ID: 1422956554390474842)
- **Bot Tab** :
  - ✅ Presence Intent
  - ✅ Server Members Intent
  - ✅ Message Content Intent
  - Copie le **TOKEN** (Reset si nécessaire)

### 2. **Inviter le bot sur ton serveur**
URL d'invitation (avec toutes les permissions nécessaires) :
```
https://discord.com/oauth2/authorize?client_id=1422956554390474842&permissions=8&scope=bot%20applications.commands
```

---

## 📝 Étape 4 : Configurer config.ts en local

**Fichier : `src/config.ts`**
```typescript
export const config: Config = {
    database: {
        path: './database.yml'
    },
    development: {
        enabled: false,  // ⚠️ Mettre false en production
        guildId: 'TON_GUILD_ID_ETUDIANT'
    },
    commands: {
        prefix: '!',
        message_commands: true,
        application_commands: {
            chat_input: true,
            user_context: true,
            message_context: true
        }
    },
    users: {
        ownerId: 'TON_USER_ID_DISCORD',
        developers: ['TON_USER_ID_DISCORD']
    },
    messages: {
        // Messages en français
        NOT_BOT_OWNER: 'Tu n\'as pas la permission d\'utiliser cette commande (réservée au propriétaire) !',
        NOT_BOT_DEVELOPER: 'Tu n\'as pas la permission d\'utiliser cette commande (réservée aux développeurs) !',
        NOT_GUILD_OWNER: 'Tu n\'as pas la permission d\'utiliser cette commande (réservée au propriétaire du serveur) !',
        CHANNEL_NOT_NSFW: 'Tu ne peux pas utiliser cette commande dans un salon non-NSFW !',
        MISSING_PERMISSIONS: 'Tu n\'as pas les permissions nécessaires pour utiliser cette commande.',
        COMPONENT_NOT_PUBLIC: 'Tu n\'es pas autorisé à utiliser ce composant !',
        GUILD_COOLDOWN: 'Tu es en cooldown. Tu pourras réutiliser cette commande dans `%cooldown%s`.'
    }
};
```

---

## 🚀 Étape 5 : Déploiement sur Heroku

### 1. **Commit et push**
```bash
git add .
git commit -m "Configure bot for student Discord server"
git push heroku main
```

### 2. **Activer le worker**
```bash
heroku ps:scale worker=1 --app hotaru-bot-app
```

### 3. **Vérifier les logs**
```bash
heroku logs --tail --app hotaru-bot-app
```

✅ Tu devrais voir : `✅ Hotaru est connecté !`

---

## 🎓 Étape 6 : Configuration sur le serveur Discord

### 1. **Lancer la configuration automatique**
Une fois le bot en ligne, tape sur ton serveur :
```
/setup
```

Cette commande va automatiquement créer :
- ✅ 8 rôles (Admin, Support, Délégué, Vérifié, Étudiant, Jobs, Bot)
- ✅ 6 catégories (Accueil, Général, Vocal, Modération, Tickets, Logs)
- ✅ ~27 salons configurés

### 2. **Tester la vérification email**
```
/verify email:ton-email@univ-lille.fr
```

### 3. **Tester les commandes de base**
```
/ping          # Vérifier la latence
/help          # Voir toutes les commandes
/agenda        # Voir l'agenda (si configuré)
/ai-chat       # Tester l'IA (si OpenRouter configuré)
```

---

## 🔍 Étape 7 : Vérifications post-déploiement

### ✅ Checklist finale
- [ ] Bot en ligne (statut vert)
- [ ] Commandes slash visibles (`/help` fonctionne)
- [ ] `/setup` a créé tous les salons et rôles
- [ ] Système de vérification email fonctionne
- [ ] Permissions du bot correctes (Administrateur recommandé)
- [ ] Logs Heroku sans erreurs

### 🐛 En cas de problème

#### **Bot hors ligne**
```bash
# Voir les logs
heroku logs --tail --app hotaru-bot-app

# Redémarrer le worker
heroku restart --app hotaru-bot-app
```

#### **Token invalide**
- Vérifie que `CLIENT_TOKEN` sur Heroku est correct
- Regénère le token sur Discord Developer Portal si nécessaire

#### **Emails ne partent pas**
- Vérifie les variables SMTP sur Heroku
- Teste avec : `heroku run bash --app hotaru-bot-app` puis `bun run src/utils/test-email.ts`

#### **Commandes slash n'apparaissent pas**
- Attends 1-5 minutes (propagation Discord)
- Vérifie les intents sur Discord Developer Portal
- Kick et re-invite le bot

---

## 📊 Commandes utiles Heroku

```bash
# Voir toutes les variables
heroku config --app hotaru-bot-app

# Modifier une variable
heroku config:set NOM_VARIABLE=valeur --app hotaru-bot-app

# Voir les logs en temps réel
heroku logs --tail --app hotaru-bot-app

# Redémarrer le bot
heroku restart --app hotaru-bot-app

# Ouvrir le dashboard
heroku dashboard --app hotaru-bot-app

# Se connecter en SSH
heroku run bash --app hotaru-bot-app
```

---

## 🎯 Résumé : Les 3 choses ESSENTIELLES à ne PAS oublier

1. **🔑 Variables d'environnement** : CLIENT_TOKEN, GUILD_ID, OWNER_ID, SMTP (email)
2. **🤖 Intents Discord** : Message Content, Server Members, Presence
3. **⚙️ Lancer /setup** : Pour créer automatiquement toute la structure du serveur

---

## 🆘 Support

Si tu rencontres un problème :
1. Vérifie les logs : `heroku logs --tail --app hotaru-bot-app`
2. Consulte la documentation : `docs/technical_reference.md`
3. Teste les commandes développeur : `/eval`, `/reload`

Bon déploiement ! 🚀
