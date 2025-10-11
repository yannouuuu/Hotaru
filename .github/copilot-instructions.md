# Hotaru Discord Bot - AI Assistant Guidelines

## Project Overview
TypeScript Discord bot (v14) running on Bun runtime with a handler-based architecture for commands, components, and events. Features a complete university server setup system with email verification and YAML-based persistence.

## Architecture Essentials

### Handler System (Core Pattern)
The bot uses a three-handler architecture that auto-loads modules:
- **CommandsHandler** (`src/client/handler/CommandsHandler.ts`): Loads all commands from `src/commands/*/` subdirectories and registers them with Discord API
- **ComponentsHandler** (`src/client/handler/ComponentsHandler.ts`): Loads buttons, modals, select menus, and autocomplete from `src/components/*/`
- **EventsHandler** (`src/client/handler/EventsHandler.ts`): Loads Discord.js event listeners from `src/events/*/`

Each handler has a corresponding Listener class that processes user interactions.

### Command Type System
Commands use a type marker pattern (`__type__` property) to distinguish at runtime:
- `__type__: 1` = Application commands (slash commands, context menus)
- `__type__: 2` = Message commands (prefix-based)
- `__type__: 3` = Components (buttons, modals, select menus)

**CRITICAL**: All commands/components MUST export default with `.toJSON()` call:
```typescript
export default new ApplicationCommand({...}).toJSON();
```

### Structure Classes
Located in `src/structure/`, these wrap Discord.js types:
- `ApplicationCommand`: Slash commands and context menus
- `MessageCommand`: Prefix commands with aliases support
- `Component`: Buttons, modals, select menus (type-discriminated)
- `AutocompleteComponent`: Autocomplete handlers

Options support: cooldown, botOwner, guildOwner, botDevelopers, nsfw (message commands only).

## Database & State Management

### YAML Database (quick-yaml.db)
All persistent data lives in `database.yml` (path configurable in `config.ts`). Key patterns:
- `setup_{guildId}`: Server configuration from `/setup` command (roles, channels, categories)
- `verification_{guildId}`: Email verification data (codes, verified users, attempts)
- `prefix-{guildId}`: Custom command prefixes per guild

Access via `client.database.get()`, `.set()`, `.has()`. Database is instantiated in `DiscordBot` constructor.

### Configuration
Use `src/config.ts` (copy from `config.example.ts`). TypeScript-based config with interfaces for type safety. Key sections:
- `users`: Owner and developer IDs for permission checks
- `commands`: Enable/disable command types, set default prefix
- `messages`: Configurable error messages
- `development`: Dev guild ID for testing slash commands

## Development Workflow

### Running the Bot
- **Development**: `bun dev` (enables hot reload via `--watch`)
- **Production**: `bun start`
- **Type checking**: `bun run typecheck` (uses tsc --noEmit)

### Creating New Commands
1. Create file in `src/commands/{Category}/` with naming convention:
   - `slashcommand-{name}.ts` for application commands
   - `messagecommand-{name}.ts` for prefix commands
2. Import and instantiate appropriate structure class
3. Export default with `.toJSON()` - handler auto-loads on startup

### Creating Components
1. Create file in `src/components/{Button|Modal|SelectMenu}/`
2. Use `customId` matching the ID used in Discord builders
3. Set `type` property: 'button', 'modal', or 'select'
4. Use `options.public: false` to restrict to command author only

### Hot Reload
Use `/reload` command (bot owner only) to reload commands/components without restarting. Avoid for config or handler changes.

## Key Features & Integration Points

### Email Verification System
Complex multi-stage system in `src/utils/VerificationManager.ts`:
- Requires nodemailer + SMTP config in `.env` (see `.env.example`)
- Database structure: codes (6-char, 15min expiry), verified users, attempts tracking
- Integrates with server setup via role IDs (`verifiedRoleId`, `studentRoleId`)
- Commands: `/verify` (request code), `/verify-code` (submit code), `/manage-verified` (admin)

Test email: `bun run src/utils/test-email-design.ts`

### Server Setup System
Automated Discord server configuration (`/setup` command):
- Creates 8 roles, 6 categories, ~27 channels with French university theme
- `SetupManager` (`src/utils/SetupManager.ts`) handles idempotent channel reuse
- `SetupMessages` sends interactive panels (buttons/select menus)
- Database stores all IDs for cross-feature access
- Cleanup command: `/cleanup` with confirmation flow

### Collections Structure
`client.collection` object stores loaded modules:
```typescript
{
  application_commands: Collection<name, ApplicationCommandData>,
  message_commands: Collection<name, MessageCommandData>,
  message_commands_aliases: Collection<alias, commandName>,
  components: {
    buttons: Collection<customId, ComponentData>,
    selects: Collection<customId, ComponentData>,
    modals: Collection<customId, ComponentData>,
    autocomplete: Collection<customId, AutocompleteComponentData>
  }
}
```

## TypeScript Patterns

### Module Resolution
- **ESM only** (type: "module" in package.json)
- All imports must include `.js` extension even for `.ts` files (Bun handles this)
- Use `moduleResolution: "bundler"` in tsconfig.json

### Type Imports
Use `import type` for types to avoid runtime imports:
```typescript
import type { DiscordBot } from '../client/DiscordBot.js';
```

### Async Patterns
Run functions are `Awaitable<T>` (can be sync or async). Use `async` for Discord API interactions.

## Common Pitfalls

1. **Forgetting `.toJSON()`**: Commands won't load without it
2. **Missing `.js` extensions**: ESM imports fail without file extension
3. **Component type mismatch**: Always check interaction type (`isButton()`, `isChatInputCommand()`, etc.)
4. **BigInt serialization**: Already patched in `src/index.ts` for Discord IDs
5. **Database path resolution**: Uses relative paths from project root (`./database.yml`)
6. **SMTP not configured**: Email verification silently fails if env vars missing

## Testing Strategy

No formal test suite. Manual testing via:
- Developer commands (`/eval`, `/reload`) for iteration
- Separate dev guild (set `development.guildId` in config.ts)
- Email preview: `bun run email:preview` opens HTML in browser

## File Naming Conventions

- Commands: `{type}command-{name}.ts` (e.g., `slashcommand-ping.ts`, `messagecommand-help.ts`)
- Components: `{name}.ts` in type-specific folder (e.g., `Button/create-ticket.ts`)
- Events: `{eventName}.ts` in category folder (e.g., `Client/ready.ts`)
- Utils: PascalCase for classes (`VerificationManager.ts`), kebab-case for scripts (`test-email.ts`)
