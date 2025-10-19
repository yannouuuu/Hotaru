<img alt="Hotaru: A Discord bot for student servers" src="assets/header.png" width="100%" />

Hotaru is a production-grade Discord assistant tailored for university communities. It automates server bootstrapping, email-based verification, AI-assisted workflows, reminders, jobs feeds, and ticketing while staying fully typed with modern **Discord.js v14**, **TypeScript**, and the **Bun** runtime.

## Table of Contents
- [Overview](#overview)
- [Key Highlights](#key-highlights)
- [Quick Deploy](#quick-deploy)
- [Architecture](#architecture)
- [Core Systems](#core-systems)
- [Getting Started](#getting-started)
- [Configuration Model](#configuration-model)
- [Development Workflow](#development-workflow)
- [Command Reference](#command-reference)
- [Troubleshooting & Support](#troubleshooting--support)
- [Project Resources](#project-resources)

## Overview
Hotaru centralises everything needed to run a student Discord server: automated setup, role management, university email verification, AI productivity boosters, reminders, and integrations such as France Travail job postings. The bot runs on Bun for fast cold starts, uses a YAML datastore for portability, and embraces handler-based loading so new commands, components, or events can be shipped with zero boilerplate.

## Key Highlights
- Complete server provisioning in minutes: `/setup` creates roles, channels, panels, and exports `.env` guidance.
- Secure email verification pipeline with SMTP delivery, manual overrides, and admin tooling.
- AI suite (chat, explanations, code generation, review, translation, summaries) powered by `aiCommandRunner`.
- Productivity stack with collaborative agenda, reminders, Hyperplanning synchronisation, and jobs feed automation.
- Clean architecture: commands/components/events are auto-registered via dedicated handlers with shared structure classes.
- Fully typed TypeScript, Bun-native tooling, and lint/typecheck tasks to keep the codebase reliable.

## Quick Deploy

### Deploy to Heroku in 2 minutes

```bash
heroku create your-bot-name
heroku buildpacks:set https://github.com/xHyroM/heroku-buildpack-bun.git
heroku config:set CLIENT_TOKEN=your_discord_bot_token
heroku config:set OWNER_ID=your_discord_user_id
git push heroku main
heroku ps:scale worker=1
```

See [CONTRIBUTING.md](CONTRIBUTING.md#-deployment) for detailed deployment instructions including environment variables, SMTP setup, and troubleshooting.

## Architecture
Hotaru follows a modular handler system that discovers features at runtime:

- **Handlers** (`src/client/handler`)
  - `CommandsHandler` loads every file under `src/commands/**`, registers slash + message commands, and keeps collections in sync.
  - `ComponentsHandler` wires buttons, select menus, modals, and autocomplete from `src/components/**`.
  - `EventsHandler` subscribes to Discord gateway events defined in `src/events/**`.
- **Structure classes** (`src/structure/`) wrap Discord.js primitives to enforce typing, metadata, cooldowns, and permission toggles.
- **Collections** (`client.collection`) expose live registries for commands, aliases, and UI components so listeners can resolve interactions quickly.
- **Database**: `quick-yaml.db` persists to `database.yml`, providing simple `.get() / .set() / .has()` access patterns throughout the bot.
- **Utilities** (`src/utils/`) concentrate domain logic—Setup orchestration, Verification workflow, Reminders, Agenda, AI providers, Jobs feed, Ticket manager, etc.—keeping handlers lean.

## Core Systems

### Setup Automation
- `/setup` provisions eight roles, categories, ≈27 channels, and interactive panels with idempotent reuse via `SetupManager`.
- `/cleanup` tears down the full setup, purging channels, roles, and database entries.
- Generated summaries help populate environment variables for downstream services.

### Email Verification
- `VerificationManager` stores verification state, rate limits attempts, and issues time-bound codes.
- SMTP delivery is handled by `EmailService` with Bun-based Nodemailer configuration.
- `/manage-verified` gives administrators statistics, search, manual verification, and removal flows.

### AI Productivity Suite
- `aiCommandRunner` standardises calls to providers (via `OpenRouterClient`) with consistent error handling.
- Dedicated commands provide chat, code explanation, code generation, code review, translation, and summarisation, all with optional ephemeral delivery.

### Agenda & Reminders
- `/agenda` maintains collaborative task tracking with status transitions.
- `/remind` and `/reminders` rely on `ReminderService` for one-off or recurring reminders and include interactive cancellation buttons.
- Hyperplanning integration: `/edt` pulls ICS feeds, updates bot presence, channels, or events using `ScheduleManager`.

### Jobs Feed Automation
- `JobsManager` fetches France Travail offers, deduplicates listings, and publishes updates in configured channels.
- `/jobs refresh` supports manual refreshes, while `/jobs statut` surfaces operational metrics and last-run timestamps.

### Support & Ticketing
- `TicketManager` tracks ticket lifecycle, handles permission overwrites, and logs closures to moderation channels.
- `/close-ticket` closes and archives support threads with optional reasons and audit embeds.

### Additional Integrations
- `AgendaManager`, `SetupMessages`, and `VerificationMessages` generate user-facing embeds and follow-up flows.
- Quartz-based cron emulation via Bun’s scheduler keeps reminders, jobs, and schedules synchronised.

## Getting Started

1. **Install prerequisites**
    - Bun ≥ 1.1
    - Discord application with a bot token (requires privileged intents for members and presences)
    - SMTP account for university email verification
2. **Clone the repository**
    ```bash
    git clone https://github.com/your-org/Hotaru.git
    cd Hotaru
    ```
3. **Install dependencies**
    ```bash
    bun install
    ```
4. **Configure environment**
    - Copy `src/config.example.ts` to `src/config.ts` if not already present, adjust owner/developer IDs, default prefix, and database path.
    - Create `.env` from `.env.example` with `DISCORD_TOKEN`, `DEV_GUILD_ID`, SMTP credentials, and OpenRouter keys for AI.
5. **Bootstrap data**
    - Ensure `database.yml` exists (empty file is enough on first launch). The YAML store will be hydrated automatically.
6. **Run the bot**
    ```bash
    bun dev
    ```
    Hot reload is enabled; the terminal will show login status and handler registration logs.
7. **Register slash commands**
    - In development, `/reload` re-registers commands in the dev guild. In production, start the bot once to push global commands (may take up to one hour to propagate).

## Configuration Model

- **`src/config.ts`**
  - `database.path`: YAML database location (default `./database.yml`).
  - `commands.prefix`: Default message command prefix (`!` if `.env` does not override `BOT_PREFIX`).
  - `users.ownerId` / `users.developers`: Used by permission guards (`botOwner`, `botDevelopers`).
  - `development.guildId`: Guild where slash commands are registered immediately when `development.enabled = true`.
  - `setup.autoSetup`: Optional auto-run of setup on first boot when enabled.
- **Environment variables**
  - `DISCORD_TOKEN` (required) – bot authentication.
  - `DEV_GUILD_ID`, `BOT_PREFIX`, `OWNER_ID`, `DEVELOPER_IDS` (comma-separated), SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, etc.), AI credentials (`OPENROUTER_API_KEY`).
- **Database keys**
  - `setup_{guildId}` – Persisted setup metadata (roles, categories, messages).
  - `verification_{guildId}` – Verification records (codes, attempts, verified users).
  - `prefix-{guildId}` – Custom message command prefixes.
  - `reminders_{guildId}` and jobs/agenda namespaces – Domain-specific state for reminders, agendas, and job listings.

## Development Workflow

- `bun dev` – Run the bot with hot reload (`--watch`).
- `bun start` – Production mode without watch, ideal for PM2 or systemd.
- `bun run typecheck` – Static type analysis via `tsc --noEmit`.
- `bun run lint` – ESLint flat config enforcing consistency and best practices.
- `bun run email:preview` – Preview transactional emails in the browser (uses Nodemailer test harness).
- `bun run src/utils/test-email-design.ts` – Generate sample verification emails for visual QA.
- `bun run src/utils/test-jobs.ts` – Simulate France Travail API calls for local testing.
- `/reload` – Owner/developer slash command to reload commands and schedules without restarting the process.

When altering commands or components, rely on the handler auto-loader—export a default `.toJSON()` instance and the rest is handled. Shared utilities (`aiCommandRunner`, `ScheduleManager`, `ReminderService`, etc.) are the preferred place for new domain logic.

## Command Reference

Default message prefix: `!` (override with `BOT_PREFIX` or `!setprefix`). Slash commands are registered globally unless development mode targets a test guild.

<details>
<summary>Catalogue complet des commandes</summary>

#### Admin

| Commande | Type | Description | Restrictions principales |
| --- | --- | --- | --- |
| `/setup` | Slash | Configure automatiquement un serveur BUT Informatique (rôles, salons, panneaux). | Réservé aux administrateurs, cooldown 60 s. |
| `/cleanup` | Slash | Supprime toute la configuration générée (rôles, salons, base de données). | Réservé aux administrateurs, action irréversible, cooldown 30 s. |
| `/prof` | Slash | Gère le classement des professeurs (ajout, archivage, reset, panneau, etc.). | Permissions administrateur, sous-commandes multiples. |

#### Community

| Commande | Type | Description | Restrictions principales |
| --- | --- | --- | --- |
| `/prof-vote` | Slash | Vote hebdomadaire pour les professeurs préférés avec pondération. | Disponible en guilde, cooldown 5 s. |
| `/ranking` | Slash | Affiche les classements (hebdomadaire, mensuel, annuel, archives). | Disponible en guilde uniquement. |

#### Developer

| Commande | Type | Description | Restrictions principales |
| --- | --- | --- | --- |
| `/eval` | Slash | Exécute du JavaScript arbitraire et renvoie le résultat. | Réservé au propriétaire du bot. |
| `/reload` | Slash | Recharge commandes, composants et plannings. | Réservé aux développeurs déclarés. |
| `!eval` | Message | Évalue une expression JavaScript et retourne la sortie en fichier. | Réservé au propriétaire du bot. |
| `!reload` | Message | Recharge commandes et agendas depuis le chat. | Réservé aux développeurs déclarés. |

#### Information

| Commande | Type | Description | Restrictions principales |
| --- | --- | --- | --- |
| `/help` | Slash | Liste les commandes applicatives accessibles. | Réponse éphémère, cooldown 10 s. |
| `!help` | Message | Liste les commandes message disponibles avec le préfixe actuel. | Cooldown 10 s. |

#### Productivity

| Commande | Type | Description | Restrictions principales |
| --- | --- | --- | --- |
| `/agenda` | Slash | Gère l'agenda collaboratif (ajout, suppression, statut, export ICS). | Rôles configurables, multiprojets. |
| `/ai-chat` | Slash | Discussion rapide avec l'assistant IA Hotaru. | Option de réponse privée, cooldown 8 s. |
| `/ai-explain` | Slash | Explication pédagogique d'un code source. | Option contexte + réponse privée, cooldown 15 s. |
| `/ai-gen` | Slash | Génération de code selon un besoin fonctionnel. | Supporte choix de langage, cooldown 20 s. |
| `/ai-review` | Slash | Relecture de code par IA avec recommandations. | Option objectif, cooldown 20 s. |
| `/summarize` | Slash | Résumé structuré d'un texte ou d'un article. | Plusieurs styles disponibles, cooldown 18 s. |
| `/translate` | Slash | Traduction technique multi-langue conservant la mise en forme. | Choix de langue cible, cooldown 12 s. |
| `/edt` | Slash | Synchronise un emploi du temps Hyperplanning (ICS). | Réservé aux administrateurs, options de mode et cible. |

#### Support

| Commande | Type | Description | Restrictions principales |
| --- | --- | --- | --- |
| `/close-ticket` | Slash | Ferme un ticket de support et journalise la clôture. | Nécessite propriétaire du ticket ou rôle support/admin. |

#### Utility

| Commande | Type | Description | Restrictions principales |
| --- | --- | --- | --- |
| `/jobs` | Slash | Rafraîchit ou affiche le statut des offres France Travail. | Permission `ManageGuild` requise. |
| `/ping` | Slash | Diagnostic rapide de latence bot ↔ Discord. | Cooldown 5 s. |
| `/remind` | Slash | Crée un rappel personnel (éventuellement récurrent). | Disponible en guilde, cooldown 5 s. |
| `/reminders` | Slash | Liste et gère les rappels actifs/complets/annulés. | Réponses en messages privés éphémères. |
| `!ping` | Message | Retourne le ping WebSocket du bot. | Cooldown 5 s. |
| `!setprefix` | Message | Met à jour le préfixe spécifique à la guilde. | Accessible après configuration, longueur max 5 caractères. |

#### Verification

| Commande | Type | Description | Restrictions principales |
| --- | --- | --- | --- |
| `/manage-verified` | Slash | Outils d'administration pour les utilisateurs vérifiés (stats, recherche, manuel). | Administrateurs uniquement, réponses éphémères. |

</details>

## Troubleshooting & Support
- **Slash commands absent**: exécutez `/reload` dans la guilde de développement ou redémarrez le bot pour pousser les commandes globales.
- **Emails non envoyés**: vérifiez les variables SMTP, ports TLS, et testez `bun run src/utils/test-email.ts` pour valider les identifiants.
- **Rappels ou agenda inactifs**: assurez-vous que le processus reste en ligne (Bun scheduler en mémoire) ou basculez sur un orchestrateur (PM2, Docker).
- **Jobs feed silencieux**: contrôlez `/jobs statut` pour vérifier les identifiants France Travail, le salon cible et la dernière erreur remontée.
- **Permissions Discord**: les commandes administratives nécessitent les flags adéquats (Administrator, ManageGuild, ManageChannels selon les cas).

## Project Resources
- `docs/TECHNICAL_REFERENCE.md` – Documentation approfondie de l'architecture et des flux métier.
- `docs/SETUP_GUIDE.md` – Walkthrough complet du setup automatique et panneaux interactifs.
- `VERIFICATION_GUIDE.md` – Procédure de configuration et de suivi de la vérification email.
- `MANAGEMENT_COMMANDS_QUICKREF.md` – Aide-mémoire pour les commandes d'administration.
- `AUTO_ROLES_IMPROVEMENT.md`, `TIMETABLE_SYNC.md`, `JOBS_FEED.md` – Notes de conception pour les évolutions majeures.
- `docs/CHANGELOG.md` – Historique des mises à jour et migrations.

Pour contribuer, merci de consulter `docs/CONTRIBUTING.md` avant d'ouvrir une pull request.

- 📘 **Fully Typed** - Complete TypeScript implementation with strict type checking- Updated to the latest version of [discord.js v14.x](https://github.com/discordjs/discord.js/releases).

- 🎯 **Multiple Command Types** - Support for slash commands, message commands, context menus- Supports all possible type of commands.

- 🧩 **Component Handling** - Built-in handlers for buttons, select menus, modals, and autocomplete    - Message commands.

- 🔄 **Hot Reload** - Developer commands for reloading commands on the fly    - Application commands:

- 💾 **Database Support** - Integrated YAML database for persistent storage        - Chat Input

- ⚡ **Event System** - Flexible event handling system        - User context

- 🛡️ **Permission System** - Role-based command restrictions (bot owner, developers, guild owner)        - Message context

- ⏱️ **Cooldown Management** - Built-in cooldown system for commands- Handles components.

- 📝 **Clean Architecture** - Well-organized, maintainable codebase    - Buttons

    - Select menus

## 📋 Requirements    - Modals

    - Autocomplete

- [Bun](https://bun.sh) v1.0.0 or higher- Easy and simple to use.

- Node.js v18.0.0 or higher (for Discord.js compatibility)- Advanced command options.

- Discord Bot Token ([Create one here](https://discord.com/developers/applications))- Simple Database included (YAML).



## 🚀 Quick Start## Commands, Components, and Events structure:

### Message commands:

### 1. Clone the repository

[`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype).<br>

```bash`Awaitable` means the function might be **async**.

git clone <your-repository-url>

cd HotaruReborn```ts

```new MessageCommand({

    command: {

### 2. Install dependencies        name: string, // The command name

        description?: string, // The command description (optional)

```bash        aliases?: string[], // The command aliases (optional)

bun install        permissions?: PermissionResolvable[], // The command permissions (optional)

```    },

    options?: Partial<{

### 3. Configure environment variables        cooldown: number, // The command cooldown, in milliseconds

        botOwner: boolean, // Bot owner can only run it? (true = yes, false = no)

Copy the example environment file and fill in your bot token:        guildOwner: boolean, // Guild owner can only run it? (true = yes, false = no)

        botDevelopers: boolean, // Bot developers can only run it? (true = yes, false = no)

```bash        nsfw: boolean // The command contains NSFW content? (true = yes, false = no)

cp .env.example .env    }>,

```    run: Awaitable<(client: DiscordBot, message: Message, args: string[]) => void> // The main function to execute the command

});

Edit `.env` and add your configuration:```



```env### Application commands (Chat input, User context, Message context):

CLIENT_TOKEN=your_discord_bot_token_here

OWNER_ID=your_discord_user_id[`APIApplicationCommand`](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-structure), [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype).<br>

DEVELOPER_IDS=your_id,another_id`Awaitable` means the function might be **async**.

BOT_PREFIX=!

DEV_GUILD_ID=your_test_guild_id```ts

```new ApplicationCommand({

    command: APIApplicationCommand,

### 4. Configure the bot    options?: Partial<{

        cooldown: number, // The command cooldown, in milliseconds

Edit `src/config.ts` to customize:        botOwner: boolean, // Bot owner can only run it? (true = yes, false = no)

- Command prefix        guildOwner: boolean, // Guild owner can only run it? (true = yes, false = no)

- Development mode settings        botDevelopers: boolean, // Bot developers can only run it? (true = yes, false = no)

- User permissions    }>,

- Custom messages    run: Awaitable<(client: DiscordBot, interaction: Interaction) => void> // The main function to execute the command

});

### 5. Run the bot```



Development mode (with auto-reload):### Components:

```bash#### Autocomplete:

bun run dev

````Awaitable` means the function might be **async**.



Production mode:```ts

```bashnew AutocompleteComponent({

bun start    commandName: string,

```    run: Awaitable<(client: DiscordBot, interaction: AutocompleteInteraction) => void> // The main function to execute the command

});

## 📁 Project Structure```



```#### Buttons, Select Menus, and Modals:

HotaruReborn/

├── src/[`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype).<br>

│   ├── client/              # Discord client and core functionality`Awaitable` means the function might be **async**.

│   │   ├── DiscordBot.ts    # Main bot client

│   │   └── handler/         # Command, component, and event handlers```ts

│   ├── commands/            # Bot commandsnew Component({

│   │   ├── Developer/       # Owner/developer-only commands    customId: string,

│   │   ├── Information/     # Info commands (help, etc.)    type: 'modal' | 'select' | 'button',

│   │   ├── Utility/         # Utility commands (ping, setprefix)    options?: Partial<{

│   │   └── Other/           # Testing and example commands        public: boolean // Other users can use the main interaction author button/select? (true = yes, false = no)

│   ├── components/          # Interactive components    }>

│   │   ├── Button/          # Button handlers    run: Awaitable<(client: DiscordBot, interaction: Interaction) => void> // The main function to execute the command

│   │   ├── Modal/           # Modal handlers});

│   │   ├── SelectMenu/      # Select menu handlers```

│   │   └── autocomplete/    # Autocomplete handlers

│   ├── events/              # Discord event listeners### Events:

│   │   └── Client/          # Client events (ready, etc.)

│   ├── structure/           # Base classes and types`Awaitable` means the function might be **async**.<br>

│   ├── utils/               # Utility functions`K` is a type parameter, extends `keyof ClientEvents`.

│   ├── config.ts            # Bot configuration

│   └── index.ts             # Entry point```ts

├── .env                     # Environment variables (not in git)new Event({

├── .env.example             # Example environment file    event: K,

├── tsconfig.json            # TypeScript configuration    once?: boolean, // The event can only happen once? (true = yes, false = no)

├── package.json             # Dependencies and scripts    run: Awaitable<(client: DiscordBot, ...args: ClientEvents[K]) => void>

└── README.md                # This file});

``````



## 🎯 Creating Commands## Dependencies

- **colors** → latest

### Slash Command Example- **discord.js** → 14.13.0 or newer

- **dotenv** → latest

```typescript- **quick-yaml.db** → latest

import { ApplicationCommandType } from 'discord.js';

import type { DiscordBot } from '../../client/DiscordBot.js';> [!NOTE]

import { ApplicationCommand } from '../../structure/ApplicationCommand.js';> **Node.js v16.11.0** or newer is required to run **discord.js**.



export default new ApplicationCommand({## Setup

    command: {1. Install a code editor ([Visual Studio Code](https://code.visualstudio.com/Download) for an example).

        name: 'example',2. Download this project as a **.zip** file: [Download](https://github.com/TFAGaming/DiscordJS-V14-Bot-Template/archive/refs/heads/main.zip)

        description: 'An example command',3. Extract the **.zip** file into a normal folder.

        type: ApplicationCommandType.ChatInput,4. Open your code editor, click on **Open Folder**, and select the new created folder.

        options: []5. Rename the following files:

    },

    options: {- `src/example.config.js` → `src/config.js`: Used for handler configuration.

        cooldown: 5000, // 5 seconds cooldown- `.env.example` → `.env`: Used for secrets, like the Discord bot token.

        botDevelopers: false- `example.database.yml` → `database.yml`: Used as a main file for the database.

    },- `example.terminal.log` → `terminal.log`: Used as a clone of terminal (to save previous terminal messages).

    run: async (client: DiscordBot, interaction) => {

        if (!interaction.isChatInputCommand()) return;6. Fill all the required values in **config.js** and **.env**.

        

        await interaction.reply({> [!CAUTION]

            content: 'Hello from slash command!',> Please remember not to share your Discord bot token! This will give access to attackers to do anything they want with your bot, so please keep the token in a safe place, which is the **.env** file.

            ephemeral: true

        });7. Initialize a new project: `npm init` (To skip every step, do `npm init -y`).

    }8. Install all [required dependencies](#dependencies): `npm install colors discord.js dotenv quick-yaml.db`

}).toJSON();

```9. Run the command `node .` or `npm run start` to start the bot.

10. Enjoy! The bot should be online.

### Message Command Example

## Contributing

```typescriptFeel free to fork the repository and submit a new pull request if you wish to contribute to this project.

import type { Message } from 'discord.js';

import type { DiscordBot } from '../../client/DiscordBot.js';Before you submit a pull request, ensure you tested it and have no issues. Also, keep the same coding style, which means don't use many unnecessary spaces or tabs.

import { MessageCommand } from '../../structure/MessageCommand.js';

Thank you to all the people who contributed to **DiscordJS-V14-Bot-Template**!

export default new MessageCommand({

    command: {<img src="https://contrib.rocks/image?repo=TFAGaming/DiscordJS-V14-Bot-Template">

        name: 'example',

        description: 'An example message command',## Support

        aliases: ['ex']Join our Discord server if you have any questions to ask, or if you have a problem with this project, you can go to the [issues section](https://github.com/TFAGaming/DiscordJS-V14-Bot-Template/issues) and submit a new issue.

    },

    options: {<a href="https://discord.gg/E6VFACWu5V">

        cooldown: 5000,  <img src="https://discord.com/api/guilds/918611797194465280/widget.png?style=banner3">

        nsfw: false</a>

    },

    run: async (client: DiscordBot, message: Message, args: string[]) => {## License

        await message.reply('Hello from message command!');[**GPL-3.0**](./LICENSE), General Public License v3
    }
}).toJSON();
```

## 🧩 Creating Components

### Button Example

```typescript
import type { DiscordBot } from '../../client/DiscordBot.js';
import { Component } from '../../structure/Component.js';

export default new Component({
    customId: 'my-button-id',
    type: 'button',
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isButton()) return;

        await interaction.reply({
            content: 'Button clicked!',
            ephemeral: true
        });
    }
}).toJSON();
```

## 🎪 Creating Events

```typescript
import { Event } from '../../structure/Event.js';
import { success } from '../../utils/Console.js';

export default new Event({
    event: 'ready',
    once: true,
    run: (__client__, client) => {
        if (client.user) {
            success(`Bot is ready as ${client.user.displayName}`);
        }
    }
}).toJSON();
```

## ⚙️ Configuration Options

### Command Options

- `cooldown`: Cooldown time in milliseconds
- `botOwner`: Only bot owner can use (boolean)
- `botDevelopers`: Only developers can use (boolean)
- `guildOwner`: Only guild owner can use (boolean)
- `nsfw`: Requires NSFW channel (boolean, message commands only)

### Development Mode

Set `development.enabled` to `true` in `config.ts` to register commands to a specific guild for faster testing:

```typescript
development: {
    enabled: true,
    guildId: 'your_test_guild_id'
}
```

## 📦 Available Scripts

```bash
# Start the bot in production
bun start

# Start with auto-reload (development)
bun run dev

# Build the project
bun run build

# Type-check without building
bun run typecheck
```

## 🔧 Commands List

### Developer Commands
- `/eval` - Execute JavaScript code (Owner only)
- `/reload` - Reload all commands (Developers only)
- `!eval` - Message command version
- `!reload` - Message command version

### Utility Commands
- `/ping` - Check bot latency
- `!ping` - Message command version
- `!setprefix` - Change the bot prefix for the server

### Information Commands
- `/help` - List all slash commands
- `!help` - List all message commands

### Testing Commands
- `User Information` - User context menu
- `Message Information` - Message context menu

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you need help or have questions:
- Check the [Discord.js Guide](https://discordjs.guide/)
- Read the [Discord.js Documentation](https://discord.js.org/)
- Visit the [Bun Documentation](https://bun.sh/docs)

## 🎉 Acknowledgments

Built with:
- [Discord.js](https://discord.js.org/) - Discord API wrapper
- [Bun](https://bun.sh/) - Fast JavaScript runtime
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [quick-yaml.db](https://www.npmjs.com/package/quick-yaml.db) - YAML database

---

**Made with ❤️ and TypeScript**

<img alt="Hotaru: A Discord bot for student servers" src="assets/footer.png" width="100%" />
