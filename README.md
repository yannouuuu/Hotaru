<img alt="Hotaru: A Discord bot for student servers" src="assets/header.png" width="100%" />

Hotaru is a production-grade Discord assistant tailored for university communities. It automates server bootstrapping, email-based verification, AI-assisted workflows, reminders, jobs feeds, and ticketing while staying fully typed with modern **Discord.js v14**, **TypeScript**, and the **Bun** runtime.

## Table of Contents
- [Overview](#overview)
- [Key Highlights](#key-highlights)
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
- Quartz-based cron emulation via Bun's scheduler keeps reminders, jobs, and schedules synchronised.

## Getting Started

1. **Install prerequisites**
    - Bun ≥ 1.1
    - Discord application with a bot token (requires privileged intents for members and presences)
    - SMTP account for university email verification
2. **Clone the repository**
    ```bash
    git clone https://github.com/yannouuuu/Hotaru.git
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
<summary>Complete command catalog</summary>

#### Admin

| Command | Type | Description | Main Restrictions |
| --- | --- | --- | --- |
| `/setup` | Slash | Automatically configures a Computer Science BUT server (roles, channels, panels). | Admin only, 60s cooldown. |
| `/cleanup` | Slash | Removes all generated configuration (roles, channels, database). | Admin only, irreversible action, 30s cooldown. |
| `/prof` | Slash | Manages professor rankings (add, archive, reset, panel, etc.). | Admin permissions, multiple subcommands. |

#### Community

| Command | Type | Description | Main Restrictions |
| --- | --- | --- | --- |
| `/prof-vote` | Slash | Weekly vote for favorite professors with weighting. | Available in guild, 5s cooldown. |
| `/ranking` | Slash | Displays rankings (weekly, monthly, yearly, archives). | Guild only. |

#### Developer

| Command | Type | Description | Main Restrictions |
| --- | --- | --- | --- |
| `/eval` | Slash | Executes arbitrary JavaScript and returns the result. | Bot owner only. |
| `/reload` | Slash | Reloads commands, components and schedules. | Declared developers only. |
| `!eval` | Message | Evaluates a JavaScript expression and returns output in file. | Bot owner only. |
| `!reload` | Message | Reloads commands and agendas from chat. | Declared developers only. |

#### Information

| Command | Type | Description | Main Restrictions |
| --- | --- | --- | --- |
| `/help` | Slash | Lists accessible application commands. | Ephemeral response, 10s cooldown. |
| `!help` | Message | Lists available message commands with current prefix. | 10s cooldown. |

#### Productivity

| Command | Type | Description | Main Restrictions |
| --- | --- | --- | --- |
| `/agenda` | Slash | Manages collaborative agenda (add, delete, status, ICS export). | Configurable roles, multi-projects. |
| `/ai-chat` | Slash | Quick chat with Hotaru AI assistant. | Private response option, 8s cooldown. |
| `/ai-explain` | Slash | Educational explanation of source code. | Context option + private response, 15s cooldown. |
| `/ai-gen` | Slash | Code generation based on functional need. | Language choice support, 20s cooldown. |
| `/ai-review` | Slash | AI code review with recommendations. | Objective option, 20s cooldown. |
| `/summarize` | Slash | Structured summary of text or article. | Multiple styles available, 18s cooldown. |
| `/translate` | Slash | Technical multi-language translation preserving formatting. | Target language choice, 12s cooldown. |
| `/edt` | Slash | Synchronizes Hyperplanning schedule (ICS). | Admin only, mode and target options. |

#### Support

| Command | Type | Description | Main Restrictions |
| --- | --- | --- | --- |
| `/close-ticket` | Slash | Closes a support ticket and logs the closure. | Ticket owner or support/admin role required. |

#### Utility

| Command | Type | Description | Main Restrictions |
| --- | --- | --- | --- |
| `/jobs` | Slash | Refreshes or displays France Travail offers status. | ManageGuild permission required. |
| `/ping` | Slash | Quick diagnostic of bot ↔ Discord latency. | 5s cooldown. |
| `/remind` | Slash | Creates a personal reminder (possibly recurring). | Available in guild, 5s cooldown. |
| `/reminders` | Slash | Lists and manages active/complete/cancelled reminders. | Ephemeral private messages. |
| `!ping` | Message | Returns the bot's WebSocket ping. | 5s cooldown. |
| `!setprefix` | Message | Updates the guild-specific prefix. | Accessible after configuration, max 5 characters. |

#### Verification

| Command | Type | Description | Main Restrictions |
| --- | --- | --- | --- |
| `/manage-verified` | Slash | Admin tools for verified users (stats, search, manual). | Admins only, ephemeral responses. |

</details>

## Troubleshooting & Support
- **Missing slash commands**: run `/reload` in the development guild or restart the bot to push global commands.
- **Emails not sent**: check SMTP variables, TLS ports, and test `bun run src/utils/test-email.ts` to validate credentials.
- **Inactive reminders or agenda**: ensure the process stays online (Bun scheduler in memory) or switch to an orchestrator (PM2, Docker).
- **Silent jobs feed**: check `/jobs statut` to verify France Travail credentials, target channel and last reported error.
- **Discord permissions**: administrative commands require appropriate flags (Administrator, ManageGuild, ManageChannels as applicable).

## Project Resources
- `docs/TECHNICAL_REFERENCE.md` – In-depth documentation of architecture and business flows.
- `docs/SETUP_GUIDE.md` – Complete walkthrough of automatic setup and interactive panels.
- `VERIFICATION_GUIDE.md` – Email verification configuration and monitoring procedure.
- `MANAGEMENT_COMMANDS_QUICKREF.md` – Quick reference for administration commands.
- `AUTO_ROLES_IMPROVEMENT.md`, `TIMETABLE_SYNC.md`, `JOBS_FEED.md` – Design notes for major evolutions.
- `docs/CHANGELOG.md` – Update history and migrations.

For contributions, please consult `docs/CONTRIBUTING.md` before opening a pull request.

## 📋 Requirements

- [Bun](https://bun.sh) v1.0.0 or higher
- Node.js v18.0.0 or higher (for Discord.js compatibility)
- Discord Bot Token ([Create one here](https://discord.com/developers/applications))

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yannouuuu/Hotaru.git
cd Hotaru
```

### 2. Install dependencies

```bash
bun install
```

### 3. Configure environment variables

Copy the example environment file and fill in your bot token:

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
CLIENT_TOKEN=your_discord_bot_token_here
OWNER_ID=your_discord_user_id
DEVELOPER_IDS=your_id,another_id
BOT_PREFIX=!
DEV_GUILD_ID=your_test_guild_id
```

### 4. Configure the bot

Edit `src/config.ts` to customize:
- Command prefix
- Development mode settings
- User permissions
- Custom messages

### 5. Run the bot

Development mode (with auto-reload):

```bash
bun run dev
```

Production mode:

```bash
bun start
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