# 🎨 Nouveau Design Email - shadcn/ui Style

## ✨ Vue d'ensemble

Les emails d'Hotaru Bot utilisent maintenant un design moderne inspiré de **shadcn/ui**, avec un thème sombre élégant et des dégradés violet/vert.

---

## 📧 Types d'Emails

### 1️⃣ Email de Vérification
**Objet** : `🔐 Code de vérification Discord - [Serveur]`

**Caractéristiques** :
- 🎨 Badge violet avec emoji 🤖
- 📋 Code de vérification en monospace
- ⚠️ Section d'avertissement claire
- 📝 Instructions pas à pas
- ⏱️ Indication de validité (15 min)

**Contenu** :
- Code à 8 caractères
- Instructions d'utilisation (`/verify-code`)
- Avertissements de sécurité
- Footer avec attribution

---

### 2️⃣ Email de Bienvenue
**Objet** : `✅ Bienvenue sur le serveur Discord - [Serveur]`

**Caractéristiques** :
- 🎨 Badge vert avec emoji ✅
- 🔓 Liste des accès débloqués
- 🚀 Prochaines étapes suggérées
- 👋 Message chaleureux

**Contenu** :
- Message de bienvenue personnalisé
- Accès disponibles (salons)
- Conseils pour débuter
- Footer avec attribution

---

## 🎨 Design System

### Palette de Couleurs

```css
:root {
  --bg: #0f172a;           /* Background principal (slate-900) */
  --card: #0b1220;         /* Card background (plus sombre) */
  --muted: #94a3b8;        /* Texte secondaire (slate-400) */
  --text: #e6eef8;         /* Texte principal (slate-50) */
  --accent: #7c3aed;       /* Violet accent (violet-600) */
  --accent-600: #6d28d9;   /* Violet foncé */
  --success: #10b981;      /* Vert succès (emerald-500) */
  --danger: #ef4444;       /* Rouge erreur */
  --radius: 12px;          /* Border radius */
  --shadow: 0 6px 18px rgba(2,6,23,0.6); /* Ombre portée */
}
```

### Typographie

- **Police principale** : Inter, system-ui, -apple-system, 'Segoe UI'
- **Police code** : ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono'
- **Tailles** :
  - H1 : 16px (header)
  - H2 : 18px (titre principal)
  - H3 : 16px (sous-titres)
  - Body : 14px
  - Footer : 12px
  - Code : 20px (18px mobile)

### Composants

#### Badge Brand
```html
<div class="brand" style="background:linear-gradient(135deg,#7c3aed,#6d28d9);">
  <span style="color:white;font-weight:600;">🤖</span>
</div>
```
- Dégradé violet pour vérification
- Dégradé vert pour bienvenue

#### Card
```css
.card {
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
  padding: 18px;
  border-radius: 12px;
  margin: 16px 0;
}
```

#### Code Display
```css
.code {
  font-family: ui-monospace, ...;
  background: linear-gradient(90deg, rgba(0,0,0,0.25), rgba(255,255,255,0.01));
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 20px;
  letter-spacing: 4px;
}
```

---

## 📱 Responsive Design

### Breakpoint Mobile (≤ 480px)
```css
@media (max-width:480px) {
  .container { padding: 18px; }
  .brand { width: 48px; height: 48px; }
  .code { font-size: 18px; }
}
```

---

## 🧪 Tests et Preview

### Preview Local (sans envoi)
```bash
npm run email:preview
# ou
bun run email:preview
```
Ouvre `email-preview.html` dans votre navigateur pour voir les deux designs côte à côte.

### Test Email Réel
```bash
npm run email:test
# ou
bun run email:test
```
Envoie un email de test à `TEST_EMAIL` (défini dans `.env` ou utilise `hotaru.github@gmail.com` par défaut).

### Variables d'environnement
Ajoutez dans `.env` :
```env
TEST_EMAIL=votre.email@exemple.com
```

---

## 📐 Structure HTML

### Table Layout (Email-Safe)
Les emails utilisent une structure `<table>` pour garantir la compatibilité avec tous les clients email :

```html
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="wrapper">
  <tr>
    <td align="center">
      <table class="container">
        <tr>
          <td>
            <!-- Contenu -->
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

### Inline Styles
Les styles critiques sont dupliqués en inline pour compatibilité :
```html
<h1 style="margin:0;font-size:16px;color:var(--text);">Hotaru Bot</h1>
```

---

## 🎯 Compatibilité Email Clients

### Testés et Supportés
- ✅ Gmail (Web, iOS, Android)
- ✅ Outlook (Web, Desktop)
- ✅ Apple Mail (macOS, iOS)
- ✅ Thunderbird
- ✅ Yahoo Mail
- ✅ ProtonMail

### Notes Techniques
- **CSS Variables** : Fonctionnent sur clients modernes, fallback via inline styles
- **Flexbox** : Supporté par la plupart, fallback en `display:block` automatique
- **Dégradés** : Fonctionnent partout sauf très vieux clients (couleur solide en fallback)

---

## 🔧 Personnalisation

### Modifier les Couleurs
Éditez les variables CSS dans `src/utils/EmailService.ts` :

```typescript
// Ligne ~110 pour email de vérification
--accent: #7c3aed;  // Changer la couleur d'accent

// Ligne ~260 pour email de bienvenue
--success: #10b981; // Changer la couleur de succès
```

### Modifier le Contenu
Les templates sont dans `EmailService.ts` :
- `generateVerificationEmailHTML()` - Email de vérification
- `generateWelcomeEmailHTML()` - Email de bienvenue

### Ajouter un Nouveau Template
```typescript
private generateNewTemplateHTML(params: any): string {
    return `
    <!doctype html>
    <html lang="fr">
    <head>
      <!-- Copier les styles existants -->
    </head>
    <body>
      <!-- Votre contenu -->
    </body>
    </html>
    `;
}
```

---

## 📚 Ressources

### Inspiration Design
- [shadcn/ui](https://ui.shadcn.com/) - Design system
- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors) - Palette
- [Inter Font](https://fonts.google.com/specimen/Inter) - Typographie

### Email HTML Best Practices
- [Email on Acid](https://www.emailonacid.com/blog/)
- [Litmus](https://www.litmus.com/blog/)
- [Can I Email](https://www.caniemail.com/) - Support CSS

---

## ✨ Features

### ✅ Ce qui est inclus
- 🎨 Design moderne et élégant
- 🌙 Thème sombre (moins fatiguant pour les yeux)
- 📱 Responsive (mobile-friendly)
- ♿ Accessible (contraste élevé)
- 📧 Compatible tous clients email
- 🔐 Code bien visible et copiable
- 📋 Instructions claires
- ⚠️ Avertissements mis en évidence
- 👤 Attribution (footer)

### 🚀 Avantages
- **Professionnalisme** : Design moderne et soigné
- **Lisibilité** : Contraste élevé, code clair
- **Branding** : Cohérent avec Discord (violet/vert)
- **UX** : Instructions claires, pas de confusion
- **Sécurité** : Avertissements visibles

---

## 🐛 Troubleshooting

### L'email n'arrive pas
1. Vérifiez la configuration SMTP dans `.env`
2. Testez avec `bun run src/utils/test-email.ts`
3. Vérifiez les spams

### Le design ne s'affiche pas correctement
1. Certains clients bloquent les CSS externes → **Tout est inline, OK**
2. Les variables CSS peuvent ne pas fonctionner → **Fallback en inline style**
3. Les dégradés peuvent ne pas s'afficher → **Couleur solide en fallback**

### Le code n'est pas copiable
Sur certains clients mobiles, le code peut ne pas être sélectionnable. C'est normal, l'utilisateur doit le taper manuellement (sécurité).

---

## 📝 Changelog

### v2.0.0 - Design shadcn/ui (8 octobre 2025)
- ✨ Nouveau design dark moderne
- 🎨 Dégradés violet et vert
- 📱 Responsive amélioré
- 🔧 Templates séparés (vérification + bienvenue)
- 📧 Compatibilité email optimisée
- 🧪 Scripts de test ajoutés
- 📄 Preview HTML standalone

### v1.0.0 - Design Initial
- Design basique bleu/blanc
- Email de vérification uniquement

---

**Créé par Yann Renard** - [github.com/yannouuuu](https://github.com/yannouuuu)  
**Design inspiré de** [shadcn/ui](https://ui.shadcn.com/)  
**© 2025 Hotaru Bot**
