# 📧 Guide de Vérification par Email

Ce guide explique comment utiliser et configurer le système de vérification par email pour le serveur Discord du BUT Informatique.

---

## 📋 Table des matières

1. [Pour les étudiants](#-pour-les-étudiants)
2. [Pour les administrateurs](#-pour-les-administrateurs)
3. [Configuration technique](#-configuration-technique)
4. [Sécurité](#-sécurité)
5. [Dépannage](#-dépannage)

---

## 👨‍🎓 Pour les étudiants

### Comment se vérifier ?

1. **Lancer la commande `/verify`**
   - Un formulaire s'ouvrira automatiquement
   
2. **Entrer votre email universitaire**
   - Format: `prenom.nom.etu@univ-lille.fr` ou `prenom.nom@univ-lille.fr`
   - Seuls les emails des domaines autorisés sont acceptés

3. **Vérifier votre boîte mail**
   - Vous recevrez un code de vérification dans les secondes qui suivent
   - Le code est valide pendant **15 minutes**

4. **Entrer le code avec `/verify-code`**
   - Utilisez la commande `/verify-code` et collez votre code
   - Maximum 3 tentatives par code

5. **Accès accordé ! 🎉**
   - Vous recevrez le rôle "✅ Vérifié"
   - Vous aurez accès à tous les canaux du serveur

### Règles anti-spam

- **Cooldown** : 5 minutes entre chaque demande de code
- **Limite quotidienne** : 3 tentatives de vérification par jour
- Si vous atteignez la limite, réessayez le lendemain

### Problèmes courants

| Problème | Solution |
|----------|----------|
| "Email déjà utilisé" | Cet email est déjà lié à un autre compte |
| "Code expiré" | Demandez un nouveau code avec `/verify` |
| "Trop de tentatives" | Attendez 5 minutes avant de réessayer |
| "Domaine non autorisé" | Utilisez votre email universitaire (@univ-lille.fr) |
| "Email non reçu" | Vérifiez vos spams/courrier indésirable |

---

## 👑 Pour les administrateurs

### Commandes disponibles

#### `/verify`
Commande utilisateur standard pour démarrer le processus de vérification.

#### `/verify-code <code>`
Valider le code de vérification reçu par email.

#### `/manage-verified`
Commande administrative avec plusieurs sous-commandes :

##### 📊 `stats`
Affiche les statistiques complètes :
- Nombre total d'utilisateurs vérifiés
- Vérifications aujourd'hui / cette semaine
- Nombre total de tentatives
- Taux de réussite

##### 📋 `list [page]`
Liste paginée de tous les utilisateurs vérifiés (10 par page).
- Affiche l'ID utilisateur, l'email et la date de vérification
- Navigation par page

##### 🔍 `search <query>`
Rechercher un utilisateur vérifié :
- Par ID Discord
- Par email (recherche partielle)

##### 🗑️ `remove <user> [reason]`
Retirer la vérification d'un utilisateur :
- Supprime l'utilisateur de la base de données
- Retire le rôle "✅ Vérifié"
- Enregistre l'action dans les logs
- Raison optionnelle pour justifier la suppression

##### 👑 `manual-verify <user> <email> [reason]`
Vérifier manuellement un utilisateur (bypass email) :
- Utile pour les cas spéciaux
- Attribue directement le rôle vérifié
- Enregistre l'action avec le nom de l'admin
- Raison optionnelle

### Logs automatiques

Si un canal de logs est configuré, toutes les actions sont enregistrées :
- ✅ Nouvelles vérifications réussies
- 🗑️ Vérifications supprimées (avec admin et raison)
- 👑 Vérifications manuelles (avec admin et raison)

Chaque log contient :
- ID et nom de l'utilisateur
- Email associé
- Date et heure
- Administrateur (si applicable)
- Raison (si applicable)

---

## ⚙️ Configuration technique

### 1. Variables d'environnement (`.env`)

Ajoutez les variables suivantes pour le service SMTP :

```env
# Configuration SMTP (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-application

# Expéditeur des emails
EMAIL_FROM="Hotaru Bot <noreply@hotaru-bot.com>"
```

#### Configuration SMTP pour différents services

##### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```
⚠️ **Important** : Utilisez un [mot de passe d'application](https://support.google.com/accounts/answer/185833) et non votre mot de passe principal.

##### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

##### Custom SMTP (Serveur universitaire)
```env
SMTP_HOST=smtp.univ-lille.fr
SMTP_PORT=465
SMTP_SECURE=true
```

### 2. Configuration dans `src/config.ts`

Ajoutez la section de vérification :

```typescript
export default {
    // ... autres configs
    
    verification: {
        enabled: true,
        verifiedRoleId: '1234567890', // ID du rôle "✅ Vérifié"
        logChannelId: '1234567890',   // ID du canal de logs (optionnel)
        welcomeChannelId: '1234567890', // ID du canal de bienvenue (optionnel)
        allowedDomains: [
            'univ-lille.fr',
            'etu.univ-lille.fr'
        ],
        codeLength: 8,
        codeExpiryMinutes: 15,
        cooldownMinutes: 5,
        maxAttemptsPerDay: 3,
        maxValidationAttempts: 3
    }
}
```

### 3. Initialisation de la base de données

Au premier démarrage, la structure suivante sera créée automatiquement :

```yaml
verification_<guildId>:
  pendingCodes: {}
  verifiedUsers: {}
  attempts: {}
  logs: []
```

### 4. Créer le rôle "✅ Vérifié"

1. Paramètres du serveur → Rôles
2. Créer un nouveau rôle nommé "✅ Vérifié"
3. Définir les permissions appropriées
4. Copier l'ID du rôle (Mode développeur requis)
5. Ajouter l'ID dans `config.ts` → `verifiedRoleId`

### 5. Configurer les canaux (optionnel)

#### Canal de logs
- Créez un canal privé (ex: `#logs-verification`)
- Ajoutez l'ID dans `config.ts` → `logChannelId`
- Tous les événements de vérification y seront enregistrés

#### Canal de bienvenue
- Créez un canal public (ex: `#bienvenue`)
- Ajoutez l'ID dans `config.ts` → `welcomeChannelId`
- Les nouveaux membres vérifiés y seront mentionnés

---

## 🔒 Sécurité

### Mesures implémentées

1. **Validation de domaine**
   - Seuls les domaines universitaires autorisés sont acceptés
   - Liste blanche configurable

2. **Expiration des codes**
   - Les codes expirent après 15 minutes
   - Impossible de réutiliser un code expiré

3. **Anti-spam**
   - Cooldown de 5 minutes entre chaque demande
   - Limite de 3 tentatives par jour
   - Maximum 3 tentatives de validation par code

4. **Unicité**
   - Un email ne peut être lié qu'à un seul compte Discord
   - Un utilisateur ne peut être vérifié qu'une seule fois

5. **Audit trail**
   - Toutes les actions sont enregistrées
   - Logs avec timestamps et IDs Discord
   - Traçabilité complète des vérifications/suppressions

6. **Codes sécurisés**
   - 8 caractères alphanumériques
   - Exclusion des caractères confusables (0, O, 1, I, l)
   - Génération aléatoire cryptographiquement sûre

### Recommandations

1. **Ne partagez jamais vos codes** de vérification
2. **Ne donnez pas votre email** à d'autres personnes
3. Les admins **ne vous demanderont jamais** votre code
4. Utilisez uniquement les commandes officielles du bot
5. Signalez toute activité suspecte aux administrateurs

---

## 🛠️ Dépannage

### Pour les utilisateurs

#### "Le bot ne répond pas"
- Vérifiez que le bot est en ligne
- Assurez-vous d'avoir les permissions pour utiliser les commandes
- Contactez un administrateur

#### "Je ne reçois pas l'email"
1. Vérifiez vos **spams/courrier indésirable**
2. Vérifiez que l'email est correctement orthographié
3. Attendez quelques minutes (délai de livraison)
4. Réessayez avec `/verify`
5. Contactez un admin si le problème persiste

#### "Mon code ne fonctionne pas"
- Vérifiez que vous avez copié le code **exactement** (sensible à la casse)
- Le code expire après **15 minutes**
- Vous avez **3 tentatives maximum** par code
- Demandez un nouveau code si nécessaire

### Pour les administrateurs

#### "Les emails ne sont pas envoyés"
1. Vérifiez la configuration SMTP dans `.env`
2. Vérifiez les logs du bot pour les erreurs
3. Testez la connexion SMTP :
   ```bash
   bun run src/utils/test-email.ts
   ```
4. Vérifiez que le port SMTP n'est pas bloqué par votre pare-feu

#### "Le rôle n'est pas attribué"
1. Vérifiez que `verifiedRoleId` est correct dans `config.ts`
2. Vérifiez que le bot a la permission "Gérer les rôles"
3. Le rôle du bot doit être **au-dessus** du rôle "✅ Vérifié"

#### "Les logs ne s'enregistrent pas"
1. Vérifiez que `logChannelId` est correct
2. Vérifiez que le bot a la permission d'écrire dans ce canal
3. Vérifiez les logs du bot pour les erreurs

#### "Réinitialiser la vérification d'un utilisateur"
```bash
# Option 1: Avec la commande
/manage-verified remove @utilisateur raison:"Test"

# Option 2: Manuellement dans la database
# Supprimer l'entrée dans verification_<guildId>.verifiedUsers.<userId>
```

---

## 📞 Support

Pour toute question ou problème :
1. Consultez d'abord ce guide
2. Vérifiez les logs du bot
3. Contactez l'équipe de développement
4. Ouvrez une issue sur GitHub (si applicable)

---

## 📝 Changelog

### Version 1.0.0 (2024)
- ✅ Système de vérification par email
- ✅ Codes de vérification avec expiration
- ✅ Anti-spam (cooldown + limite quotidienne)
- ✅ Commandes administratives complètes
- ✅ Logs automatiques
- ✅ Support SMTP multiple
- ✅ Validation de domaine
- ✅ Interface utilisateur complète (modals + embeds)

---

**Développé avec ❤️ pour le BUT Informatique - Université de Lille**
