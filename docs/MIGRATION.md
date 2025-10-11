# Migration Guide - JavaScript to TypeScript

This document explains the changes made during the migration from JavaScript to TypeScript and how to work with the new codebase.

## 🔄 Major Changes

### 1. TypeScript Migration

All `.js` files have been converted to `.ts` with full type safety:

- **Before**: `const client = require('./client/DiscordBot');`
- **After**: `import { DiscordBot } from './client/DiscordBot.js';`

### 2. ES Modules

The project now uses ES modules instead of CommonJS:

- **Before**: `module.exports = ...` and `require(...)`
- **After**: `export default ...` and `import ... from ...`

Note: Import statements must include the `.js` extension even for `.ts` files (this is a requirement for ES modules).

### 3. Bun Runtime

The project now runs on Bun instead of Node.js:

- **Before**: `node .` or `npm start`
- **After**: `bun start` or `bun run dev`

### 4. Configuration Changes

#### Environment Variables

The `.env` file structure has been simplified:

```env
# Required
CLIENT_TOKEN=your_token
OWNER_ID=your_id
DEVELOPER_IDS=id1,id2

# Optional  
BOT_PREFIX=!
DEV_GUILD_ID=guild_id
```

#### Config File

`src/config.js` → `src/config.ts`

- Now uses environment variables for sensitive data
- Type-safe configuration with interfaces
- Example config provided in `src/config.example.ts`

### 5. Command Structure Changes

#### Application Commands

**Before (JS)**:
```javascript
const ApplicationCommand = require('../../structure/ApplicationCommand');

module.exports = new ApplicationCommand({
    command: {
        name: 'ping',
        description: 'Pong!',
        type: 1,
        options: []
    },
    run: async (client, interaction) => {
        // ...
    }
}).toJSON();
```

**After (TS)**:
```typescript
import { ApplicationCommandType } from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { ApplicationCommand } from '../../structure/ApplicationCommand.js';

export default new ApplicationCommand({
    command: {
        name: 'ping',
        description: 'Pong!',
        type: ApplicationCommandType.ChatInput,
        options: []
    },
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        // ...
    }
}).toJSON();
```

#### Key Differences:

1. **Imports**: Use ES6 `import` instead of `require`
2. **Exports**: Use `export default` instead of `module.exports`
3. **Types**: Explicit types for parameters
4. **Constants**: Use Discord.js enums instead of magic numbers
5. **Type Guards**: Add type guards for interactions

### 6. Handler Changes

All handlers now use async/await and dynamic imports:

**Before**:
```javascript
const module = require('../../commands/' + directory + '/' + file);
```

**After**:
```typescript
const module = await import(`../../commands/${directory}/${file}`);
const commandData = module.default || module;
```

### 7. Removed Dependencies

- **`colors`**: Replaced with native ANSI color codes in Bun
- **`dotenv`**: Not needed as Bun loads `.env` automatically

### 8. Package.json Changes

**Scripts**:
- `start`: `node .` → `bun run src/index.ts`
- `dev`: NEW - Auto-reload development mode
- `typecheck`: NEW - TypeScript type checking
- `build`: NEW - Build for production

**Dependencies**:
- Removed: `colors`, `dotenv`
- Added: `@types/node`, `bun-types`, `typescript`

## 📝 Breaking Changes

### 1. File Extensions

All command, component, and event files must now be `.ts`:
- `slashcommand-ping.js` → `slashcommand-ping.ts`
- `example-button.js` → `example-button.ts`

### 2. Async/Await Requirement

All `run` functions must now explicitly return `Promise<void>` or `void`. The `Awaitable<>` type is no longer used.

### 3. Type Assertions

You must now use type guards:

```typescript
// Required type checking
if (!interaction.isChatInputCommand()) return;
if (!interaction.isButton()) return;
if (!message.guild) return;
```

### 4. Database Types

The database now requires proper type handling:

```typescript
// Type assertion needed for database values
const prefix = client.database.ensure('prefix-' + guildId, config.commands.prefix);
```

## 🚀 Migration Checklist for Custom Code

If you have custom commands or components:

- [ ] Rename all `.js` files to `.ts`
- [ ] Convert `require()` to `import`
- [ ] Convert `module.exports` to `export default`
- [ ] Add type annotations to function parameters
- [ ] Replace magic numbers with Discord.js enums
- [ ] Add type guards for interactions
- [ ] Update imports to include `.js` extension
- [ ] Test with `bun run dev`
- [ ] Run `bun run typecheck` to verify types

## 🔧 Development Workflow

### Before (JS)
```bash
npm install
node .
```

### After (TS)
```bash
bun install
bun run dev  # Development with auto-reload
# or
bun start    # Production
```

### Type Checking
```bash
bun run typecheck
```

## ⚠️ Common Issues & Solutions

### Issue: Import not found
**Error**: `Cannot find module './file.js'`
**Solution**: Make sure to include `.js` extension in imports, even for `.ts` files

### Issue: Type errors
**Error**: `Type 'X' is not assignable to type 'Y'`
**Solution**: Add proper type guards and assertions

### Issue: Database type errors
**Error**: `Type 'any' is not assignable`
**Solution**: Add `@ts-ignore` or proper type casting

### Issue: Interaction type errors
**Error**: `Property 'options' does not exist`
**Solution**: Add type guard: `if (!interaction.isChatInputCommand()) return;`

## 📚 New Features

### 1. Hot Reload
Development mode now auto-reloads on file changes:
```bash
bun run dev
```

### 2. Type Safety
Full TypeScript support with auto-completion in VS Code

### 3. Better Performance
Bun provides faster startup and better performance than Node.js

### 4. Improved Logging
Enhanced console logging with timestamps and colors

## 🎯 Next Steps

1. Update your `.env` file
2. Copy `src/config.example.ts` to `src/config.ts`
3. Customize `src/config.ts` for your bot
4. Run `bun install`
5. Test with `bun run dev`
6. Deploy with `bun start`

## 📖 Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Bun Documentation](https://bun.sh/docs)
- [Discord.js Guide](https://discordjs.guide/)
- [Discord.js TypeScript](https://discordjs.guide/additional-info/typescript.html)

## ❓ FAQ

**Q: Can I still use Node.js?**  
A: Yes, but you'll need to adjust scripts in `package.json` and may lose some performance benefits.

**Q: Do I need to rebuild after changes?**  
A: No, Bun runs TypeScript directly. Use `bun run dev` for auto-reload.

**Q: Are my old commands compatible?**  
A: You'll need to convert them to TypeScript format. See examples in `src/commands/`.

**Q: How do I add new dependencies?**  
A: Use `bun add package-name` instead of `npm install`.

---

**Need help?** Check the examples in the repository or open an issue!
