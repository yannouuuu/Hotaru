# 🍓 Déploiement sur Raspberry Pi (Devuan)

Ce document guide le déploiement manuel du bot Hotaru sur un Raspberry Pi (OS Devuan) en utilisant une connexion SSH depuis un Mac et `tmux` pour la persistance du processus.

## 🔌 1. Connexion SSH

Depuis le terminal de votre Mac :
```bash
# Remplacez user par le nom d'utilisateur et l'IP par celle du Raspberry
ssh user@192.168.X.X
```

## 🛠️ 2. Installation de l'environnement (Première fois)

Si le Raspberry Pi n'est pas encore configuré pour le bot :

### Installation de Bun & Outils
```bash
# Mise à jour du système
sudo apt-get update && sudo apt-get upgrade -y

# Installation des outils de base
sudo apt-get install -y unzip git curl tmux nano

# Installation de Bun (Runtime JS)
curl -fsSL https://bun.sh/install | bash

# Activation de Bun (ou redémarrer le terminal)
source ~/.bashrc
```

### Installation du Projet
```bash
git clone https://github.com/yannouuuu/Hotaru.git

cd Hotaru

bun install
```

## ⚙️ 3. Configuration

Avant de lancer le bot, assurez-vous que les fichiers de configuration sont prêts.

### Variables d'environnement (.env)
```bash
cp .env.example .env
vim .env
# Remplir CLIENT_TOKEN, CLIENT_ID, etc.
# Sauvegarder : :w
# Quitter : :q
```

### Configuration Bot (config.ts)
```bash
cp src/config.example.ts src/config.ts
vim src/config.ts
# Vérifier les IDs des admins/devs
```

## 🖥️ 4. Gestion du processus avec TMUX

`tmux` permet de laisser tourner le bot même une fois la session SSH fermée.

### ➤ Créer une nouvelle session et lancer le bot
1. Créer la session nommée `hotaru` :
   ```bash
   tmux new -s hotaru
   ```

2. Une fois dans l'interface tmux (barre verte en bas), lancez le bot :
   ```bash
   # Mode Développement (avec auto-reload) - Comme demandé
   bun run dev
   ```
   *(Note : Pour la production stable sans redémarrage automatique, utilisez `bun run start`)*

### ➤ Détacher la session (Laisser tourner en fond)
Pour sortir de tmux sans arrêter le bot :
1. Appuyer sur **`Ctrl`** + **`B`**
2. Relâcher les touches
3. Appuyer sur **`D`**

Vous serez de retour sur le terminal principal et le bot continue de tourner. Vous pouvez fermer le SSH.

### ➤ Revenir sur la session (Rattacher)
Pour voir les logs ou contrôler le bot :
```bash
tmux attach -t hotaru
```

## 🔄 5. Maintenance & Mise à jour

Procédure standard pour mettre à jour le bot :

1. Se connecter en SSH & Rattacher la session :
   ```bash
   ssh user@ip
   tmux attach -t hotaru
   ```

2. Arrêter le bot (si en cours) :
   Faire **`Ctrl` + `C`**

3. Mettre à jour le code :
   ```bash
   git pull
   bun install  # Au cas où il y a de nouvelles dépendances
   ```

4. Relancer et détacher :
   ```bash
   bun run dev
   # Puis Ctrl+B, D
   ```

## 📋 Commandes TMUX Utiles

| Action | Commande / Raccourci |
|--------|----------------------|
| Lister les sessions | `tmux ls` |
| Tuer la session `hotaru` | `tmux kill-session -t hotaru` |
| **Scroll dans les logs** | `Ctrl`+`B` puis `[` (utiliser les flèches, `q` pour quitter) |
| Renommer session | `Ctrl`+`B` puis `$` |
