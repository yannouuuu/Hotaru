# Hotaru Technical Reference

_Revision date: 2025-10-12_

This document consolidates all technical details required to understand, operate, and extend the Hotaru Discord bot. It is intended for engineers and maintainers who need an authoritative description of the system architecture, runtime assumptions, data flows, and integration points.

---

## 1. Runtime & Tooling Stack

- **Runtime:** [Bun](https://bun.sh) >= 1.1 executes the bot and package scripts (see `package.json`). Node.js 18+ is still required for native discord.js dependencies.
- **Language:** TypeScript (ESM, strict configuration). All runtime imports must end with `.js` extensions even when the source file is `.ts`.
- **Discord API:** discord.js v14 with partial intents and caching. Custom wrapper classes in `src/structure` bind Bot logic to discord.js primitives.
- **Linting & Formatting:** ESLint flat config (`eslint.config.js`) with `@typescript-eslint` and project references. `bun run lint` enforces the baseline. Type safety is verified with `bun run typecheck`.
- **Build/Execution Scripts:**
  - `bun run dev` – Hot reload via Bun's watch mode.
  - `bun start` – Production start (no file watching).
  - `bun run build` – tsc emit build (if needed for distribution).
  - `bun run lint` / `bun run lint:fix` – Static analysis.
  - `bun run typecheck` – TypeScript validation.

## 2. High-Level Architecture

Hotaru follows a handler-driven architecture to load modular features at runtime:

1. **DiscordBot (`src/client/DiscordBot.ts`)** – Central orchestrator extending `discord.js` `Client`. Initializes handlers, database, collections, schedulers, verification and jobs managers.
2. **Handler Layer (`src/client/handler`)** – Three handler classes auto-discover modules:
   - `CommandsHandler` – Loads application and message commands from `src/commands/**`. Registers slash commands (guild or global) and populates collections for runtime dispatch.
   - `ComponentsHandler` – Loads interactive components (buttons, modals, select menus, autocomplete) from `src/components/**`.
   - `EventsHandler` – Loads event listeners defined in `src/events/**`.
3. **Listener Layer** – `CommandsListener` and `ComponentsListener` listen to Discord events and delegate to the appropriate module entries, applying shared option guards.
4. **Structure Layer (`src/structure`)** – Provides typed wrappers (`ApplicationCommand`, `MessageCommand`, `Component`, `AutocompleteComponent`, `Event`) that enforce the project conventions (cooldowns, permission flags, metadata, serialization to JSON).
5. **Utility Layer (`src/utils`)** – Cross-cutting services: logging (`Console.ts`), server setup automation, verification flows, AI orchestration, reminders, agendas, jobs feed, email and SMTP helpers, environment parsing (`env.ts`).

The bot bootstraps from `src/index.ts`, extends `BigInt.prototype.toJSON` for safe logging, clears `terminal.log`, instantiates `DiscordBot`, and attaches top-level process error handlers.

## 3. Command Pipeline

1. Commands are declared as default exports of structure instances (`new ApplicationCommand({...}).toJSON()` or `new MessageCommand({...}).toJSON()`). Each file lives under `src/commands/<Category>/` and follows naming conventions (`slashcommand-<name>.ts`, `messagecommand-<name>.ts`).
2. `CommandsHandler` loads modules, categorises by type marker (`__type__`). Slash commands register to the Discord API using credentials in `config.ts`. Message commands map into prefix command collections.
3. `CommandOptions` utilities enforce runtime guards:
   - Ownership/Developer/Guild Owner restrictions.
   - Cooldown tracking via in-memory maps keyed by user ID.
   - Optional NSFW channel validation (message commands).
4. Responses use ephemeral flags for sensitive interactions and reuse shared messages from `config.ts`.
5. Developer-only hot reload (`/reload`, `!reload`) triggers handler reload pipelines, re-registering application commands in the configured development guild.

## 4. Components & Events

- **Components:** Buttons, select menus, modals, and autocomplete handlers reside in `src/components/<Type>/`. Each exports a `Component` or `AutocompleteComponent`. The handler enforces `options.public` (private interactions) and resolves the correct handler by `customId`.
- **Events:** Discord events live in `src/events/Client/`. Event definitions use the `Event` structure, specifying `once` (run once) and typed parameters.

## 5. Persistent Storage

- **Database:** `quick-yaml.db` stores data in `database.yml`. `DiscordBot` instantiates the database using the path defined in `config.ts`. Key namespaces:
  - `setup_{guildId}` – Server setup artefacts (roles, channels, categories).
  - `verification_{guildId}` – Email verification state (codes, usage, attempts, verified users).
  - `prefix-{guildId}` – Custom message-command prefixes.
- **Access Patterns:** Use `client.database.get`, `set`, `has`, `ensure`. The YAML file is expected to be committed for baseline configuration but not for secrets.

## 6. Configuration & Environment

- **Static Config (`src/config.ts`):** Type-enforced settings for owner/developers, command toggles, default prefix, message strings, development guild ID, and feature flags.
- **Environment Variables:** `.env` (copy from `.env.example`). All scripts assume `process.env` is configured before runtime. `src/utils/env.ts` now provides helpers:
  - `readEnv`, `readEnvList`, `readEnvBoolean`, `readEnvNumber` – Uniform parsing with trimming and fallback behaviour.
- **Email SMTP:** `buildSmtpConfig`, `createSmtpTransporter`, `ensureTransporter` are located in `src/utils/email/`. Scripts (`EmailService`, `test-email.ts`) depend on `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`.

## 7. Email Verification System

- **Core Class:** `VerificationManager` orchestrates the end-to-end flow: code generation, storage, throttling, and validation.
- **Service:** `EmailService` (singleton) sends verification and welcome emails using nodemailer and the SMTP helpers. HTML and plaintext templates live in `email/verificationTemplates.ts`.
- **Commands & Components:**
  - `/verify` (user flow) and `/verify-code` (code submission).
  - `/manage-verified` for administrators (grant/revoke roles, resend codes, inspect state).
  - Buttons/modals under `src/components/Button/verification*` and `src/components/Modal/verification*` drive the interaction UX.
- **Database:** Verification entries stored under `verification_{guildId}` with TTL enforcement (15 minutes default).
- **Auxiliary Scripts:** `src/utils/test-email.ts` validates SMTP credentials; `src/utils/init-verification-db.ts` primes persistence structures.

## 8. Automated Server Setup

- **SetupManager:** Creates roles, categories, channels, and persists IDs. It ensures idempotent operations by reusing existing resources when possible.
- **SetupMessages:** Publishes post-setup panels (buttons, select menus) for role assignment and onboarding.
- **Commands:** `/setup` orchestrates the provisioning workflow; `/cleanup` removes all created resources after multi-step confirmation.
- **Supporting Components:** Buttons (e.g., `setup-confirm`, `setup-cancel`) handle step confirmations.

## 9. Professor Ranking System

- **Manager:** `ProfessorRankingManager` handles voting, ranking snapshots, archives, and weekly panels.
- **Commands:**
  - `/prof` (admin) – Manage roster, reset, panel deployment, archive channel.
  - `/prof-vote` – Weekly student voting with weighted choices and duplicate prevention.
  - `/ranking` – View leaderboards (weekly, monthly, annual, history).
- **Components:** Buttons for ranking panels (`professor-ranking` namespace), select menus for viewing archives.

## 10. Productivity Suite

Productivity commands rely on various utilities:

- **Agenda & Schedule:**
  - `AgendaManager` (YAML-backed event tracking) with `/agenda` actions.
  - `ScheduleManager` integrates calendars and generates timetables via `/schedule`.
- **Reminder System:**
  - `ReminderService`, `ReminderScheduler`, `ReminderStore` manage reminder creation, persistence, and timed execution.
  - `/remind` to create reminders; `/reminders` to list/clear.
- **AI Commands:** `src/utils/aiCommandRunner.ts` and `OpenRouterClient` manage requests to OpenRouter models.
  - `/ai-chat`, `/ai-explain`, `/ai-gen`, `/ai-review`, `/summarize`, `/translate` share consistent context building, fallback prompts, and safety checks.
- **Jobs Feed:** `FranceTravailClient` + `JobsManager` query France Travail APIs using OAuth2 and custom filters. `/jobs` fetches or schedules postings for guilds configured via `/setup`.

## 11. Support & Ticketing

- **TicketManager:** Creates per-user support channels with staff role gating. `/close-ticket` finalises tickets and cleans up resources.
- **Components:** Buttons and modals under `src/components/Button/ticket*` handle creation and categorisation.

## 12. Logging & Monitoring

- **Console Utilities:** `src/utils/Console.ts` prints colour-coded messages to stdout and appends entries to `terminal.log`. Wraps `console.info/warn/error` with timestamped formatting.
- **Process Hooks:** `src/index.ts` listens to `unhandledRejection` and `uncaughtException`, logging via `console.error`.
- **Dev Scripts:** `bun run src/utils/test-email.ts`, `bun run src/utils/test-jobs.ts`, `bun run src/utils/test-jobs.ts` provide manual diagnostics.

## 13. File & Module Conventions

- **Naming:**
  - Commands: `slashcommand-<name>.ts`, `messagecommand-<name>.ts`.
  - Components: `<feature>.ts` under type-specific folders.
  - Events: `<EventName>.ts` within `events/Client`.
  - Utilities: PascalCase for classes, descriptive names for scripts.
- **Exports:** Always `export default <StructureInstance>.toJSON()` for loadable modules.
- **Type Imports:** Use `import type` to prevent runtime overhead. `Awaitable<T>` denotes optional async functions.

## 14. Development Workflow

1. Clone repository, install dependencies via `bun install`.
2. Copy `.env.example` to `.env` and populate secrets.
3. Configure `src/config.ts` for owner, developer IDs, messages, and development guild.
4. Run `bun run dev` while iterating. Use `/reload` to hot reload command/components without restarts.
5. Execute `bun run lint` and `bun run typecheck` before commits.
6. For email verification, run `bun run src/utils/test-email.ts` to validate SMTP credentials.
7. For jobs feed, set France Travail credentials (`FRANCE_TRAVAIL_*` variables) and run `bun run src/utils/test-jobs.ts` to confirm filters.

## 15. Deployment Considerations

- **Environment:** Provide `.env` with Discord token, SMTP info, France Travail credentials, AI model API keys (OpenRouter), optional analytics.
- **Persistence:** Ensure `database.yml` is writable by the runtime. For container deployments, mount persistent storage.
- **Scaling:** Bot is single-instance oriented. Horizontal scaling requires sharding and shared datastore (not currently implemented).
- **Monitoring:** Tail `terminal.log` or integrate with external logging by replacing `Console.ts` appenders.

## 16. Residual Risks & Future Enhancements

- **YAML Storage:** Susceptible to concurrency issues in multi-instance setups; consider migrating to external DB for scale.
- **Email Deliverability:** SMTP failures degrade verification experience; integrate retries/backoff mechanisms.
- **AI Rate Limits:** OpenRouter usage should implement caching/backoff to avoid hitting quotas.
- **Testing:** Automated integration tests are limited; manual scripts should be expanded into CI workflows.
- **Localization:** Commands and messages are primarily French; adding i18n would improve adaptability.

---

For further context, refer to the inline documentation within `src/config.example.ts`, command files under `src/commands`, and the various strategy documents in `docs/` that detail individual features (setup, verification, jobs feed, etc.).
