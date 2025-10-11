# 🎓 Attribution de deux rôles : "✅ Vérifié" + "Étudiant"

## ✅ Modifications effectuées

Le système de vérification a été mis à jour pour **attribuer automatiquement 2 rôles** lors de la vérification :

1. ✅ **"✅ Vérifié"** - Confirme que l'utilisateur est vérifié
2. 👨‍🎓 **"Étudiant"** - Confirme le statut d'étudiant

---

## 📝 Configuration requise

### Étape 1 : Créer les deux rôles sur Discord

1. Sur votre serveur Discord → **Paramètres du serveur**
2. Allez dans **Rôles**
3. Créez ces deux rôles :
   - **✅ Vérifié** (couleur au choix, ex: vert)
   - **Étudiant** (couleur au choix, ex: bleu)

### Étape 2 : Obtenir les IDs des rôles

1. Activez le **Mode développeur** :
   - Discord → Paramètres utilisateur → Avancés → **Mode développeur** (ON)

2. Copiez les IDs des rôles :
   - Paramètres du serveur → Rôles
   - Clic droit sur **"✅ Vérifié"** → **Copier l'identifiant**
   - Clic droit sur **"Étudiant"** → **Copier l'identifiant**

### Étape 3 : Configurer database.yml

Ouvrez le fichier `database.yml` et modifiez la section `verification_config` :

```yaml
verification_config:
  enabled: true
  
  # Remplacez par l'ID du rôle "✅ Vérifié"
  verifiedRoleId: "1234567890123456789"
  
  # Remplacez par l'ID du rôle "Étudiant"
  studentRoleId: "9876543210987654321"
  
  # ... reste de la configuration
```

### Étape 4 : Vérifier la hiérarchie des rôles

⚠️ **IMPORTANT** : Le rôle du bot doit être **au-dessus** des rôles "✅ Vérifié" et "Étudiant" !

1. Paramètres du serveur → Rôles
2. Glissez le rôle du bot au-dessus de ces deux rôles

Hiérarchie recommandée :
```
🤖 Hotaru Bot
👑 Admin
🛡️ Modérateur
✅ Vérifié
👨‍🎓 Étudiant
@everyone
```

---

## 🎯 Fonctionnement

### Lors de la vérification par email

Quand un étudiant se vérifie avec `/verify` :
1. ✅ Il reçoit le rôle **"✅ Vérifié"**
2. 👨‍🎓 Il reçoit le rôle **"Étudiant"**
3. 🔓 Il obtient accès aux canaux réservés aux étudiants

### Lors de la vérification manuelle

Avec `/manage-verified manual-verify` :
- Les deux rôles sont également attribués

### Lors de la suppression

Avec `/manage-verified remove` :
- Les deux rôles sont retirés automatiquement

---

## 📊 Changements techniques

### Fichiers modifiés

1. **`src/types/verify.d.ts`**
   - Ajout de `studentRoleId?: string` dans `VerificationConfig`

2. **`src/utils/VerificationManager.ts`**
   - `validateCode()` : Attribue les 2 rôles
   - `manualVerify()` : Attribue les 2 rôles

3. **`src/commands/Verification/slashcommand-manage-verified.ts`**
   - Sous-commande `remove` : Retire les 2 rôles

4. **`src/utils/VerificationMessages.ts`**
   - Message de succès mis à jour pour mentionner les 2 rôles

5. **`src/utils/init-verification-db.ts`**
   - Configuration par défaut inclut `studentRoleId`

---

## 🧪 Tester le système

### Test complet

1. Lancez le bot : `bun start`
2. Sur Discord, tapez `/verify`
3. Entrez un email `@univ-lille.fr` ou `@etu.univ-lille.fr`
4. Vérifiez votre boîte mail
5. Tapez `/verify-code VOTRE_CODE`
6. ✅ Vérifiez que vous avez **les 2 rôles** : "✅ Vérifié" ET "Étudiant"

### Test admin

```
/manage-verified manual-verify @utilisateur email@univ-lille.fr
```
→ L'utilisateur reçoit les 2 rôles

```
/manage-verified remove @utilisateur
```
→ Les 2 rôles sont retirés

---

## ❓ Questions fréquentes

### Puis-je n'utiliser qu'un seul rôle ?

Oui ! Si vous ne voulez qu'un seul rôle :
- Configurez seulement `verifiedRoleId`
- Laissez `studentRoleId: null` dans database.yml

### Les anciens utilisateurs vérifiés auront-ils les 2 rôles ?

Non, seules les **nouvelles vérifications** attribueront les 2 rôles.

Pour mettre à jour les anciens utilisateurs :
1. Utilisez `/manage-verified list` pour voir les utilisateurs vérifiés
2. Attribuez manuellement le rôle "Étudiant" aux anciens membres
3. OU retirez et re-vérifiez chaque utilisateur

### Le système fonctionne-t-il sans le rôle "Étudiant" ?

Oui ! Le `studentRoleId` est optionnel. Si vous ne le configurez pas :
- Seul le rôle "✅ Vérifié" sera attribué
- Pas d'erreur, le système fonctionne normalement

---

## 📖 Documentation

- **Guide complet** : `VERIFICATION_GUIDE.md`
- **Quick Start** : `QUICK_START.md`
- **README** : `VERIFICATION_README.md`

---

**✅ Configuration mise à jour et prête à l'emploi !**
