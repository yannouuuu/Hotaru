# 📧 Système de Vérification par Email

Système complet de vérification d'identité universitaire via email pour Discord.

## 🎯 Fonctionnalités

- ✅ **Vérification par email** avec codes temporaires (15 min)
- 🔒 **Anti-spam** : cooldown 5 min + limite 3/jour
- 🎨 **Emails HTML** professionnels avec templates
- 👑 **Commandes admin** complètes (stats, liste, recherche, suppression, vérification manuelle)
- 📊 **Logs automatiques** de toutes les actions
- 🛡️ **Sécurité** : validation de domaine, unicité email/utilisateur, expiration

## 🚀 Installation rapide

### 1. Installer les dépendances

```bash
bun add nodemailer @types/nodemailer
```

### 2. Configurer le SMTP (`.env`)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-application
EMAIL_FROM="Hotaru Bot <noreply@hotaru-bot.com>"
```

> 💡 **Gmail** : Utilisez un [mot de passe d'application](https://support.google.com/accounts/answer/185833)

### 3. Tester la configuration

```bash
bun run src/utils/test-email.ts
```

### 4. Configurer le bot

Dans votre fichier de configuration, ajoutez l'objet de configuration de vérification avec :
- `verifiedRoleId` : ID du rôle "✅ Vérifié"
- `allowedDomains` : Domaines universitaires autorisés
- `logChannelId` (optionnel) : Canal pour les logs

Exemple :
```typescript
verification: {
    enabled: true,
    verifiedRoleId: "1234567890",
    allowedDomains: ["univ-lille.fr", "etu.univ-lille.fr"],
    logChannelId: "1234567890", // optionnel
    // ...
}
```

### 5. Lancer le bot

```bash
bun start
```

## 📖 Documentation complète

Consultez **[VERIFICATION_GUIDE.md](./VERIFICATION_GUIDE.md)** pour :
- Guide utilisateur complet
- Toutes les commandes admin
- Configuration avancée
- Dépannage
- Sécurité

## 🎮 Commandes Discord

### Pour les étudiants

| Commande | Description |
|----------|-------------|
| `/verify` | Demander un code de vérification |
| `/verify-code <code>` | Valider le code reçu par email |

### Pour les administrateurs

| Commande | Description |
|----------|-------------|
| `/manage-verified stats` | Statistiques complètes |
| `/manage-verified list [page]` | Liste des utilisateurs vérifiés |
| `/manage-verified search <query>` | Rechercher un utilisateur |
| `/manage-verified remove <user> [reason]` | Retirer une vérification |
| `/manage-verified manual-verify <user> <email> [reason]` | Vérifier manuellement |

## 📁 Architecture

```
src/
├── types/
│   └── verify.d.ts                 # Types TypeScript
├── utils/
│   ├── EmailService.ts             # Service d'envoi d'emails
│   ├── VerificationManager.ts      # Logique de vérification
│   ├── VerificationMessages.ts     # Messages/embeds Discord
│   └── test-email.ts               # Script de test SMTP
├── commands/Verification/
│   ├── slashcommand-verify.ts      # Commande /verify
│   ├── slashcommand-verify-code.ts # Commande /verify-code
│   └── slashcommand-manage-verified.ts # Commande /manage-verified
└── components/Modal/
    └── verify-email-modal.ts       # Handler du modal d'email
```

## 🔐 Sécurité

- **Validation de domaine** : whitelist configurable
- **Expiration** : codes valides 15 minutes
- **Limite de tentatives** : 3 max par code
- **Cooldown** : 5 min entre demandes
- **Limite quotidienne** : 3 tentatives/jour
- **Unicité** : 1 email = 1 compte Discord
- **Logs** : audit trail complet

## 🧪 Tests

```bash
# Tester la configuration SMTP
bun run src/utils/test-email.ts

# Lancer le bot en mode développement
bun run dev
```

## 🐛 Dépannage

### Emails non reçus
1. Vérifiez les spams/courrier indésirable
2. Testez avec `bun run src/utils/test-email.ts`
3. Vérifiez les logs du bot

### Erreur d'authentification SMTP
- Gmail : utilisez un **mot de passe d'application**, pas votre mot de passe principal
- Vérifiez `SMTP_USER` et `SMTP_PASS` dans `.env`

### Le rôle n'est pas attribué
- Le rôle du bot doit être **au-dessus** du rôle "✅ Vérifié"
- Vérifiez que `verifiedRoleId` est correct

## 📊 Statistiques exemple

```
📊 Statistiques de vérification

👥 Total vérifié : 142 utilisateurs
📅 Aujourd'hui : 8 vérifications
📆 Cette semaine : 47 vérifications
📝 Tentatives totales : 156
✅ Taux de réussite : 91%

Performance : 🟢 Excellent
```

## 💡 Support

- 📖 Voir [VERIFICATION_GUIDE.md](./VERIFICATION_GUIDE.md)
- 🐛 Vérifier les logs du bot
- 📧 Tester avec `src/utils/test-email.ts`

---

**Développé avec ❤️ pour le BUT Informatique - Université de Lille**
