# Suite IA & Productivité

Date d'introduction : 10 octobre 2025  
Modèle supporté :
- `cognitivecomputations/dolphin-mistral-24b-venice-edition:free` via OpenRouter

## ⚙️ Prérequis

1. Configurez OpenRouter dans `.env` :
   ```bash
   OPENROUTER_API_KEY=sk-or-...
   # (Optionnel) OPENROUTER_MODEL=cognitivecomputations/dolphin-mistral-24b-venice-edition:free
   # (Optionnel) OPENROUTER_APP_URL=https://votre-site-ou-docs
   # (Optionnel) OPENROUTER_APP_TITLE="Hotaru Discord Bot"
   ```
   > ℹ️ Sans clé OpenRouter valide la commande renverra une erreur explicite.
   > ⚠️ Si vous changez de modèle, vérifiez qu'il est autorisé dans vos paramètres de confidentialité OpenRouter.

## 🛠️ Commandes disponibles

| Commande | Description | Options principales |
|----------|-------------|---------------------|
| `/ai-chat` | Discussion libre avec l'assistant IA. | `message` |
| `/ai-explain` | Explication pédagogique d'un extrait de code. | `code`, `contexte` (optionnel) |
| `/ai-review` | Relecture et audit de qualité de code. | `code`, `objectif` (optionnel) |
| `/ai-gen` | Génération de code à partir d'un besoin. | `besoin`, `langage` (optionnel) |
| `/translate` | Traduction technique en conservant la terminologie. | `texte`, `cible`, `source` (optionnel) |
| `/summarize` | Synthèse structurée d'un texte ou d'un article. | `texte`, `style` (optionnel) |

Toutes les réponses sont envoyées en messages éphémères pour éviter le spam dans les salons. Les réponses longues sont automatiquement découpées en plusieurs messages en respectant la limite Discord.

## 🔒 Limitation & Sécurité

- Cooldowns par commande afin d'éviter les abus.
- Gestion des erreurs spécifiques à OpenRouter avec messages d'aide.
- OpenRouter impose des quotas : le bot réessaie automatiquement jusqu'à 3 fois (en respectant `Retry-After` si fourni). Au-delà, patientez encore quelques secondes avant de relancer la commande.
- Aucune donnée n'est stockée en base : les prompts et réponses restent in-memory.

## 💡 Bonnes pratiques

- Fournissez un maximum de contexte dans vos prompts pour obtenir des réponses précises.
- Pour `/ai-gen`, précisez le langage et les contraintes (framework, style de tests, etc.).
- Pour `/translate`, indiquez la langue source si le texte mélange plusieurs idiomes.
- Pour `/summarize`, le style "Bullet points" est idéal pour des comptes-rendus de réunion.

---

Besoin d'aller plus loin ? Ajoutez de nouveaux presets en dupliquant l'un des fichiers `src/commands/Productivity/slashcommand-*.ts` et en ajustant le prompt système.
