# 📝 Aide-mémoire Heroku - Hotaru

## 🚀 Déploiement initial

```bash
# Script automatique (Recommandé)
.\deploy-heroku.ps1

# OU manuel :
heroku create hotaru-but-info
heroku buildpacks:add https://github.com/xmakina/heroku-buildpack-bun.git
heroku config:set DISCORD_TOKEN="..." CLIENT_ID="..." GUILD_ID="..."
git push heroku main
heroku ps:scale worker=1
```

## 📊 Surveillance

```bash
# Logs en temps réel (essentiel)
heroku logs --tail

# Logs des 100 dernières lignes
heroku logs -n 100

# État du bot
heroku ps

# Variables d'environnement
heroku config
```

## 🔧 Gestion

```bash
# Redémarrer le bot
heroku restart

# Arrêter le bot
heroku ps:scale worker=0

# Démarrer le bot
heroku ps:scale worker=1

# Ouvrir le dashboard web
heroku open
```

## 🔑 Variables d'environnement

```bash
# Ajouter/modifier une variable
heroku config:set NOM_VARIABLE="valeur"

# Voir toutes les variables
heroku config

# Supprimer une variable
heroku config:unset NOM_VARIABLE

# Ajouter plusieurs variables d'un coup
heroku config:set VAR1="val1" VAR2="val2" VAR3="val3"
```

## 📦 Mise à jour du code

```bash
# 1. Faire vos modifications localement
# 2. Tester en local
bun run dev

# 3. Commiter
git add .
git commit -m "Description des changements"

# 4. Déployer sur Heroku
git push heroku main

# Le bot redémarre automatiquement
```

## 💰 Gestion des coûts

```bash
# Voir les dynos actifs
heroku ps

# Passer à un dyno Eco ($5/mois, ne dort jamais)
heroku ps:type eco

# Voir la facturation sur le web
# Dashboard → Account → Billing
```

## 🐛 Dépannage

```bash
# Le bot ne démarre pas
heroku logs --tail
heroku ps
heroku restart

# Erreur de buildpack
heroku buildpacks:clear
heroku buildpacks:add https://github.com/xmakina/heroku-buildpack-bun.git
git commit --allow-empty -m "Rebuild"
git push heroku main

# Variables manquantes
heroku config
# Ajoutez les variables manquantes avec config:set

# Redéployer complètement
git push heroku main --force
```

## 📱 Application Heroku

```bash
# Infos sur l'app
heroku apps:info

# Renommer l'app
heroku apps:rename nouveau-nom

# Supprimer l'app (DANGER!)
heroku apps:destroy hotaru-but-info

# Ouvrir dans le navigateur
heroku open
```

## 🔐 IDs Discord requis

Après avoir exécuté `/setup` sur Discord, configurez ces variables :

```bash
# Rôles
heroku config:set ROLE_ADMIN_ID="..."
heroku config:set ROLE_DELEGUE_ID="..."
heroku config:set ROLE_SUPPORT_ID="..."
heroku config:set ROLE_VERIFIED_ID="..."
heroku config:set ROLE_STUDENT_ID="..."

# Salons
heroku config:set CHANNEL_WELCOME_ID="..."
heroku config:set CHANNEL_QUOTES_ID="..."
heroku config:set CHANNEL_VERIFY_ID="..."
heroku config:set CHANNEL_PICTURES_ID="..."
heroku config:set CATEGORY_TICKETS_ID="..."

# Logs
heroku config:set CHANNEL_LOGS_BOTS_ID="..."
heroku config:set CHANNEL_LOGS_MODERATION_ID="..."
heroku config:set CHANNEL_LOGS_SERVER_ID="..."

# Catégories
heroku config:set CATEGORY_VOICE_ID="..."

# Puis redémarrer
heroku restart
```

## 🎯 Workflow quotidien

```bash
# Vérifier que tout va bien
heroku ps

# En cas de problème
heroku logs --tail

# Après une mise à jour du code
git add .
git commit -m "Update"
git push heroku main
```

## ⚡ Commandes rapides

```bash
alias h='heroku'
alias hl='heroku logs --tail'
alias hr='heroku restart'
alias hp='heroku ps'
alias hc='heroku config'

# Utilisation :
hl  # Logs
hr  # Restart
hp  # Status
hc  # Config
```

## 📞 Support

- **Logs** : `heroku logs --tail`
- **Documentation Heroku** : https://devcenter.heroku.com/
- **Status Heroku** : https://status.heroku.com/
- **Buildpack Bun** : https://github.com/xmakina/heroku-buildpack-bun

## 🎓 GitHub Student Pack

- **Activer** : https://education.github.com/pack
- **Crédits** : $13/mois pendant 12 mois = $156 total
- **Facturation** : Dashboard → Account → Billing

---

**Astuce** : Ajoutez cette page à vos favoris pour un accès rapide ! 📌

