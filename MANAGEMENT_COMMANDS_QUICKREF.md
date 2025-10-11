# 🎯 Commandes de Management - Aide Rapide

## 📋 Commandes Disponibles

### `/manage-verified stats`
Affiche les statistiques globales de vérification
- Total d'utilisateurs vérifiés
- Vérifications aujourd'hui / cette semaine
- Taux de réussite

**Permission** : Administrator  
**Visibilité** : Éphémère (toi seul)

---

### `/manage-verified list [page]`
Liste tous les utilisateurs vérifiés (10 par page)
- Utilisateur Discord
- Email vérifié
- Date de vérification
- Méthode (Email ou Manuel)

**Permission** : Administrator  
**Visibilité** : Éphémère (toi seul)

**Exemple** :
```
/manage-verified list page:2
```

---

### `/manage-verified search query:<email|id>`
Recherche un utilisateur vérifié
- Par email (partiel accepté)
- Par ID Discord complet

**Permission** : Administrator  
**Visibilité** : Éphémère (toi seul)

**Exemples** :
```
/manage-verified search query:yann
/manage-verified search query:910244631281815634
/manage-verified search query:@univ-lille.fr
```

---

### `/manage-verified remove user:<@user> [reason]`
Retire la vérification d'un utilisateur

**Effet** :
- ❌ Supprime l'entrée dans la base de données
- 🎭 Retire les rôles **Vérifié** + **Étudiant**
- 📝 Envoie un log dans le canal configuré
- ✉️ Affiche les rôles retirés dans le message

**Permission** : Administrator  
**Visibilité** : Éphémère (toi seul) + Log public

**Exemples** :
```
/manage-verified remove user:@Yann reason:Email invalide
/manage-verified remove user:@Yann reason:Plus inscrit à l'université
/manage-verified remove user:@Yann
```

---

### `/manage-verified manual-verify user:<@user> email:<email> [reason]`
Vérifie manuellement un utilisateur (bypass email)

**Effet** :
- ✅ Ajoute l'utilisateur dans la base de données
- 🎭 Attribue les rôles **Vérifié** + **Étudiant**
- 📝 Envoie un log dans le canal configuré
- ✉️ Affiche les rôles attribués dans le message

**Permission** : Administrator  
**Visibilité** : Éphémère (toi seul) + Log public

**Exemples** :
```
/manage-verified manual-verify user:@Yann email:yann.renard.etu@univ-lille.fr reason:Document vérifié
/manage-verified manual-verify user:@Yann email:yann.renard@univ-lille.fr reason:Professeur invité
/manage-verified manual-verify user:@Yann email:test@etu.univ-lille.fr
```

---

## 🎭 Système de Rôles Automatique

### Comment ça fonctionne ?

Les commandes récupèrent **automatiquement** les rôles depuis le setup :

```yaml
setup_GUILD_ID:
  roles:
    verifie: '1425265508399190086'   # Rôle Vérifié
    etudiant: '1425265505098530959'  # Rôle Étudiant
```

### Avantages

✅ **Zéro configuration manuelle** : fonctionne dès que `/setup` est exécuté  
✅ **Synchronisation automatique** : si les rôles sont recréés avec `/setup`, tout fonctionne  
✅ **Transparence** : les messages indiquent quels rôles ont été attribués/retirés  

### Rôles attribués/retirés

| Commande | Rôle Vérifié | Rôle Étudiant |
|----------|--------------|---------------|
| `manual-verify` | ✅ Attribué | ✅ Attribué |
| `remove` | ❌ Retiré | ❌ Retiré |

---

## 📊 Messages de Retour

### Vérification manuelle réussie
```
✅ Utilisateur vérifié manuellement

@Yann a été vérifié avec succès.

📧 Email: yann.renard.etu@univ-lille.fr
📝 Raison: Document vérifié
👤 Par: @Admin
🎭 Rôles attribués: <@&1425265508399190086> (Vérifié)
                     <@&1425265505098530959> (Étudiant)
```

### Retrait de vérification
```
🗑️ Vérification retirée

La vérification de @Yann a été retirée avec succès.

📧 Email: yann.renard.etu@univ-lille.fr
📝 Raison: Email invalide
👤 Par: @Admin
🎭 Rôles retirés: ✅ Vérifié, 👨‍🎓 Étudiant
```

### Statistiques
```
📊 Statistiques de vérification

Vue d'ensemble :

👥 Total vérifié : 42 utilisateurs
📅 Aujourd'hui : 5 vérifications
📆 Cette semaine : 18 vérifications
📝 Tentatives totales : 57
✅ Taux de réussite : 89%

Performance :
🟢 Excellent
```

---

## ⚠️ Erreurs Courantes

### Email invalide
```
❌ Email invalide

Le format de l'email n'est pas valide.

💡 Suggestion :
Exemple: prenom.nom.etu@univ-lille.fr
```

### Utilisateur non vérifié
```
❌ Erreur

Cet utilisateur n'est pas vérifié.
```

### Utilisateur déjà vérifié
```
❌ Erreur

Cet utilisateur est déjà vérifié.
```

### Page invalide
```
❌ Page invalide

Il n'y a que 5 page(s) disponible(s).
```

---

## 🔒 Permissions et Sécurité

### Permissions requises
- `Administrator` sur le serveur Discord
- Le bot doit avoir la permission de gérer les rôles
- Le rôle du bot doit être **au-dessus** des rôles Vérifié/Étudiant dans la hiérarchie

### Visibilité des messages
- **Réponses** : Éphémères (visibles uniquement par l'admin qui exécute la commande)
- **Logs** : Publics dans le canal configuré (`verification_config.logChannelId`)

### Canal de logs

Pour configurer le canal de logs, modifie `database.yml` :
```yaml
verification_config:
  enabled: true
  logChannelId: "1234567890123456789"  # ID du canal #logs-verification
```

---

## 🛠️ Configuration Requise

### Prérequis
1. Avoir exécuté `/setup` sur le serveur
2. Système de vérification activé dans `database.yml` :
   ```yaml
   verification_config:
     enabled: true
   ```

### Vérifier la configuration

1. Ouvre `database.yml`
2. Vérifie que `verification_config.enabled: true`
3. Vérifie que `setup_GUILD_ID.roles.verifie` et `.etudiant` existent

---

## 📚 Ressources

### Documentation complète
- `MANAGEMENT_COMMANDS_REFACTOR.md` - Documentation technique complète
- `MANAGEMENT_COMMANDS_SUMMARY.md` - Résumé exécutif
- `VERIFICATION_GUIDE.md` - Guide complet du système de vérification

### Support
Si tu rencontres un problème :
1. Vérifie les logs console du bot
2. Vérifie que les rôles existent dans `database.yml`
3. Vérifie les permissions du bot
4. Crée un ticket avec `/support`

---

## 🎯 Cas d'Usage

### Scénario 1 : Étudiant perd son email universitaire
```
/manage-verified remove user:@Étudiant reason:Email universitaire invalide
```

### Scénario 2 : Professeur invité
```
/manage-verified manual-verify user:@Professeur email:prof@univ-lille.fr reason:Professeur invité
```

### Scénario 3 : Vérifier tous les utilisateurs d'un domaine
```
/manage-verified search query:@etu.univ-lille.fr
```

### Scénario 4 : Consulter l'activité du jour
```
/manage-verified stats
```

---

**Fichier** : `src/commands/Verification/slashcommand-manage-verified.ts`  
**Version** : 2.0.0 - Refonte complète  
**Date** : 8 octobre 2025  
**Status** : ✅ Production ready
