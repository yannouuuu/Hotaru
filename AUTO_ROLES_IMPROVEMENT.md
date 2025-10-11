# ✨ Configuration Automatique des Rôles - Plus Simple !

## 🎯 Amélioration majeure

Le système de vérification a été simplifié pour **récupérer automatiquement** les IDs des rôles depuis le setup du serveur. Plus besoin de configuration manuelle ! 🎉

---

## 🔄 Avant vs Après

### ❌ AVANT (Compliqué)

```yaml
verification_config:
  verifiedRoleId: "1234567890123456789"  # ← À copier manuellement
  studentRoleId: "9876543210987654321"   # ← À copier manuellement
```

**Problèmes :**
- Configuration redondante (les rôles existent déjà dans `setup_GUILD_ID.roles`)
- Risque d'erreur lors de la copie des IDs
- Maintenance difficile si on change les rôles

### ✅ APRÈS (Automatique)

```yaml
verification_config:
  enabled: true
  # Les rôles sont automatiquement récupérés depuis le setup ! ✨
```

**Avantages :**
- ✅ Aucune configuration manuelle
- ✅ Utilise directement les rôles créés par `/setup`
- ✅ Pas de risque d'erreur
- ✅ Plus simple et maintenable

---

## 🔧 Comment ça fonctionne ?

### 1. Le setup crée automatiquement les rôles

Quand vous exécutez `/setup`, le bot crée :

```yaml
setup_1425233434766475327:
  roles:
    verifie: '1425265508399190086'    # ← Rôle "✅ Vérifié"
    etudiant: '1425265505098530959'   # ← Rôle "Étudiant"
    # ... autres rôles
```

### 2. Le système de vérification les récupère automatiquement

```typescript
// Code dans VerificationManager.ts
private getRoleIds(guildId: string) {
    const setupData = this.database.get(`setup_${guildId}`);
    
    return {
        verifiedRoleId: setupData?.roles?.verifie,  // ← Récupération auto
        studentRoleId: setupData?.roles?.etudiant   // ← Récupération auto
    };
}
```

### 3. Lors de la vérification

Quand un étudiant se vérifie avec `/verify` :
1. ✅ Le système récupère les IDs depuis le setup
2. 👨‍🎓 Il attribue les 2 rôles automatiquement
3. 🎉 Aucune configuration manuelle requise !

---

## 📋 Utilisation

### Configuration minimale dans database.yml

```yaml
verification_config:
  enabled: true
  logChannelId: null
  welcomeChannelId: null
  allowedDomains:
    - domain: "univ-lille.fr"
      description: "Université de Lille"
      enabled: true
    - domain: "etu.univ-lille.fr"
      description: "Étudiants Université de Lille"
      enabled: true
  codeLength: 8
  codeExpiration: 900000
  cooldownBetweenAttempts: 300000
  maxAttemptsPerDay: 3
  maxValidationAttempts: 3
  requireUniqueEmail: true
```

**C'est tout !** Les rôles sont gérés automatiquement. ✨

---

## 🚀 Étapes de mise en place

### 1. Exécuter le setup

```
/setup
```

Le bot crée automatiquement tous les rôles, dont "vérifié" et "étudiant".

### 2. Initialiser la vérification (optionnel)

Si vous n'avez pas encore la config :

```bash
bun run src/utils/init-verification-db.ts
```

### 3. Lancer le bot

```bash
bun start
```

### 4. Tester

```
/verify
```

Les utilisateurs recevront automatiquement les 2 rôles ! 🎉

---

## 🎯 Rôles attribués automatiquement

Lors de la vérification, l'utilisateur reçoit :

1. **✅ Vérifié** (`setup_GUILD_ID.roles.verifie`)
   - Confirme que l'email est vérifié
   - Donne accès aux canaux vérifiés

2. **👨‍🎓 Étudiant** (`setup_GUILD_ID.roles.etudiant`)
   - Confirme le statut d'étudiant
   - Donne accès aux canaux étudiants

---

## 🔄 Retrait des rôles

Avec `/manage-verified remove @user` :
- Les 2 rôles sont également retirés automatiquement
- Utilise les mêmes IDs depuis le setup

---

## ⚙️ Configuration optionnelle

Si vous voulez **surcharger** les rôles par défaut, vous pouvez toujours ajouter :

```yaml
verification_config:
  enabled: true
  verifiedRoleId: "ID_PERSONNALISE"  # Optionnel
  studentRoleId: "ID_PERSONNALISE"   # Optionnel
```

Mais **ce n'est pas recommandé** ! Laissez le système utiliser les rôles du setup.

---

## 📊 Modifications techniques

### Fichiers modifiés

1. **`src/types/verify.d.ts`**
   - `verifiedRoleId` et `studentRoleId` marqués comme optionnels
   - Documentation mise à jour

2. **`src/utils/VerificationManager.ts`**
   - Nouvelle méthode `getRoleIds(guildId)` qui récupère les IDs depuis le setup
   - `validateCode()` utilise `getRoleIds()`
   - `manualVerify()` utilise `getRoleIds()`

3. **`src/commands/Verification/slashcommand-manage-verified.ts`**
   - Sous-commande `remove` récupère les IDs depuis le setup

4. **`database.yml`**
   - Section `verification_config` simplifiée
   - Plus d'IDs de rôles à configurer manuellement

5. **`src/utils/init-verification-db.ts`**
   - Messages mis à jour
   - Instructions simplifiées

---

## ✅ Avantages de cette approche

1. **🎯 Source unique de vérité**
   - Les IDs des rôles sont dans `setup_GUILD_ID.roles`
   - Pas de duplication de données

2. **🚀 Configuration simplifiée**
   - Aucune copie manuelle d'IDs
   - Moins de risques d'erreurs

3. **🔧 Maintenance facilitée**
   - Si vous recréez les rôles avec `/setup`, tout fonctionne automatiquement
   - Pas besoin de mettre à jour la config

4. **📦 Intégration native**
   - Utilise l'infrastructure existante du bot
   - Cohérence avec les autres fonctionnalités

---

## 🧪 Tests

### Vérifier que ça fonctionne

```bash
# 1. Lancer le bot
bun start

# 2. Sur Discord
/verify

# 3. Entrer votre email universitaire
# 4. Vérifier votre boîte mail
# 5. Valider le code
/verify-code ABC12345

# ✅ Vous devriez avoir les 2 rôles automatiquement !
```

### Vérifier les rôles attribués

Dans votre profil Discord, vous devriez voir :
- ✅ Vérifié
- 👨‍🎓 Étudiant

---

## 🎉 Conclusion

Cette amélioration rend le système :
- **Plus simple** à configurer
- **Plus fiable** (pas d'erreur de configuration)
- **Plus maintenable** (source unique)
- **Plus élégant** (pas de duplication)

**Plus besoin de configurer manuellement les IDs des rôles !** ✨

---

**Développé avec ❤️ pour simplifier la vie des admins**
