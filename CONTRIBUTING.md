# 🤝 Contribuer à Hotaru

Merci de votre intérêt pour contribuer à Hotaru !

## 📋 Prérequis

- [Bun](https://bun.sh/) installé
- Node de développement Discord configuré
- Git configuré

## 🔧 Configuration du développement

1. **Fork le projet**

2. **Cloner votre fork**
```bash
git clone https://github.com/votre-username/Hotaru.git
cd Hotaru
```

3. **Installer les dépendances**
```bash
bun install
```

4. **Configurer l'environnement**
```bash
cp env.example .env
# Remplir avec vos tokens de test
```

5. **Lancer en mode développement**
```bash
bun run dev
```

## 📝 Guide de contribution

### Structure du projet

```
src/
├── commands/      # Commandes slash par catégorie
├── events/        # Événements Discord
├── handlers/      # Gestionnaires d'interactions
├── loaders/       # Chargeurs de commandes/événements
├── types/         # Définitions TypeScript
└── utils/         # Utilitaires (DB, logs, etc.)
```

### Ajouter une nouvelle commande

1. Créez un fichier dans `src/commands/[catégorie]/`
2. Suivez le modèle:

```typescript
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../../types/index.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ma-commande')
    .setDescription('Description')
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    // Votre code ici
  },
};

export default command;
```

3. Le bot chargera automatiquement la commande au redémarrage

### Ajouter un nouvel événement

1. Créez un fichier dans `src/events/`
2. Suivez le modèle:

```typescript
import { Events } from 'discord.js';

export default {
  name: Events.NomEvent,
  async execute(...args) {
    // Votre code ici
  },
};
```

## ✅ Standards de code

- **TypeScript strict** activé
- **Pas de `any`** sauf si absolument nécessaire
- **Import types** avec `import type`
- **Gestion des erreurs** dans tous les try/catch
- **Messages éphémères** pour les commandes privées
- **Logs** pour les actions importantes

## 🧪 Tests

Avant de soumettre une PR:
1. Testez avec `/cleanup` puis `/setup`
2. Vérifiez toutes les fonctionnalités affectées
3. Pas d'erreurs de linter: `bun check` (si configuré)

## 📤 Soumettre une Pull Request

1. Créez une branche pour votre fonctionnalité
```bash
git checkout -b feature/ma-nouvelle-feature
```

2. Committez vos changements
```bash
git add .
git commit -m "feat: description de la fonctionnalité"
```

3. Pushez vers votre fork
```bash
git push origin feature/ma-nouvelle-feature
```

4. Ouvrez une Pull Request sur GitHub

## 💡 Idées de contribution

- Nouvelles commandes utiles
- Amélioration des messages
- Optimisations de performance
- Documentation
- Correction de bugs
- Tests automatisés

## 📧 Contact

Pour toute question, ouvrez une issue sur GitHub.

Merci de contribuer à Hotaru ! 🎉

