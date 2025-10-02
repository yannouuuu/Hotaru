# ⚡ Guide de démarrage rapide - Heroku

## 🎯 Déploiement en 5 minutes

### Option 1: Script automatique (Recommandé) ⚡

```powershell
# 1. Assurez-vous d'avoir un fichier .env configuré
cp env.example .env
# Éditez .env avec vos tokens Discord

# 2. Exécutez le script de déploiement
.\deploy-heroku.ps1

# Ou avec un nom personnalisé :
.\deploy-heroku.ps1 -AppName "mon-bot-discord"
```

Le script va :
- ✅ Vérifier les prérequis
- ✅ Créer l'application Heroku
- ✅ Configurer toutes les variables d'environnement
- ✅ Ajouter le buildpack Bun
- ✅ Déployer le code
- ✅ Démarrer le worker
- ✅ Afficher les logs

### Option 2: Manuel 🔧

```bash
# 1. Se connecter à Heroku
heroku login

# 2. Créer l'application
heroku create hotaru-but-info

# 3. Ajouter le buildpack Bun
heroku buildpacks:add https://github.com/xmakina/heroku-buildpack-bun.git

# 4. Configurer les variables (minimum requis)
heroku config:set DISCORD_TOKEN="votre_token"
heroku config:set CLIENT_ID="votre_client_id"
heroku config:set GUILD_ID="votre_guild_id"

# 5. Déployer
git push heroku main

# 6. Démarrer le worker
heroku ps:scale worker=1

# 7. Voir les logs
heroku logs --tail
```

## 📋 Checklist pré-déploiement

- [ ] Heroku CLI installé (`heroku --version`)
- [ ] Compte Heroku créé
- [ ] Crédits GitHub Student Pack activés (optionnel mais recommandé)
- [ ] Bot Discord créé sur le Developer Portal
- [ ] Token Discord récupéré
- [ ] Fichier `.env` configuré localement
- [ ] Bot testé en local (`bun run dev`)

## 🎮 Après le déploiement

### 1. Vérifier que le bot est en ligne
```bash
heroku logs --tail
```

Vous devriez voir :
```
✅ Bot connecté en tant que Hotaru#XXXX
```

### 2. Configurer le serveur Discord

Sur votre serveur Discord :
```
/setup
```

Le bot créera automatiquement toute la structure.

### 3. Récupérer et configurer les IDs

Le bot vous donnera une liste d'IDs. Copiez-les et exécutez :

```bash
heroku config:set ROLE_ADMIN_ID="123456..."
heroku config:set ROLE_VERIFIED_ID="123456..."
# ... etc pour tous les IDs
```

### 4. Redémarrer le bot
```bash
heroku restart
```

### 5. C'est prêt ! 🎉

## 🔍 Commandes de diagnostic

```bash
# Voir l'état du bot
heroku ps

# Voir les logs
heroku logs --tail

# Redémarrer
heroku restart

# Voir les variables d'environnement
heroku config

# Ouvrir le dashboard Heroku
heroku open
```

## ⚠️ Problèmes courants

### Le bot ne démarre pas
```bash
heroku logs --tail
# Vérifiez les erreurs dans les logs
```

### Variables manquantes
```bash
heroku config
# Vérifiez que DISCORD_TOKEN, CLIENT_ID, GUILD_ID sont présents
```

### Buildpack non reconnu
```bash
heroku buildpacks
# Si vide ou incorrect :
heroku buildpacks:clear
heroku buildpacks:add https://github.com/xmakina/heroku-buildpack-bun.git
```

## 💡 Astuces

### Voir les crédits restants
Dashboard Heroku → Account → Billing

### Mettre à jour le bot
```bash
git add .
git commit -m "Update bot"
git push heroku main
```

### Passer à un dyno payant (recommandé avec crédits)
```bash
heroku ps:type eco
# Coût: ~$5/mois (couvert par GitHub Student Pack)
```

## 📚 Documentation complète

Pour plus de détails, consultez :
- `HEROKU_DEPLOYMENT.md` - Guide complet
- `DEPLOYMENT.md` - Informations générales sur le projet
- `README.md` - Documentation du bot

## 🆘 Besoin d'aide ?

1. Vérifiez les logs : `heroku logs --tail`
2. Consultez la documentation Heroku : https://devcenter.heroku.com/
3. Vérifiez les issues GitHub du buildpack Bun

---

**Bon déploiement ! 🚀**

