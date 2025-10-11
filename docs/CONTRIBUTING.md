# Contributing Guide

Thank you for considering contributing to this Discord bot project! This guide will help you get started.

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh) v1.0.0 or higher
- Git
- VS Code (recommended) with TypeScript extension
- Basic knowledge of TypeScript and Discord.js

### Setup Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone <your-fork-url>
   cd HotaruReborn
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   cp src/config.example.ts src/config.ts
   # Edit .env and src/config.ts with your settings
   ```

4. **Run in development mode**
   ```bash
   bun run dev
   ```

## 📝 Development Guidelines

### Code Style

#### TypeScript
- Use strict TypeScript with no implicit any
- Add explicit return types for functions
- Use type guards for Discord interactions
- Prefer interfaces over type aliases for object shapes

**Example:**
```typescript
// ✅ Good
async function handleCommand(client: DiscordBot, interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;
    // ...
}

// ❌ Bad
async function handleCommand(client, interaction) {
    // ...
}
```

#### Naming Conventions
- **Files**: `kebab-case.ts` (e.g., `slashcommand-ping.ts`)
- **Classes**: `PascalCase` (e.g., `DiscordBot`)
- **Functions**: `camelCase` (e.g., `handleCommand`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)
- **Interfaces**: `PascalCase` (e.g., `CommandOptions`)

#### Imports
- Always include `.js` extension in imports (even for `.ts` files)
- Use type-only imports when possible
- Group imports: external → internal → types

**Example:**
```typescript
// External dependencies
import { Client, Interaction } from 'discord.js';

// Internal modules
import { CommandsHandler } from './handler/CommandsHandler.js';
import { config } from '../config.js';

// Types
import type { DiscordBot } from './DiscordBot.js';
import type { CommandData } from '../types/commands.js';
```

### Project Structure

```
src/
├── client/           # Bot client and core systems
├── commands/         # Command implementations
├── components/       # Interactive components
├── events/           # Discord event handlers
├── structure/        # Base classes and interfaces
├── types/            # Type definitions
└── utils/            # Utility functions
```

## 🎯 Adding New Features

### Creating a New Command

1. **Choose the appropriate directory:**
   - `commands/Developer/` - Owner/developer only commands
   - `commands/Information/` - Info and help commands
   - `commands/Utility/` - General utility commands
   - `commands/Other/` - Testing or misc commands

2. **Create the command file:**

**Slash Command Example:**
```typescript
// src/commands/Utility/slashcommand-example.ts
import { ApplicationCommandType } from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { ApplicationCommand } from '../../structure/ApplicationCommand.js';

export default new ApplicationCommand({
    command: {
        name: 'example',
        description: 'An example command',
        type: ApplicationCommandType.ChatInput,
        options: []
    },
    options: {
        cooldown: 5000, // 5 seconds
        botDevelopers: false
    },
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        
        await interaction.reply({
            content: 'Hello from example command!',
            ephemeral: true
        });
    }
}).toJSON();
```

**Message Command Example:**
```typescript
// src/commands/Utility/messagecommand-example.ts
import type { Message } from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { MessageCommand } from '../../structure/MessageCommand.js';

export default new MessageCommand({
    command: {
        name: 'example',
        description: 'An example message command',
        aliases: ['ex']
    },
    options: {
        cooldown: 5000
    },
    run: async (client: DiscordBot, message: Message, args: string[]) => {
        await message.reply('Hello from example command!');
    }
}).toJSON();
```

### Creating a New Component

**Button Example:**
```typescript
// src/components/Button/my-button.ts
import type { DiscordBot } from '../../client/DiscordBot.js';
import { Component } from '../../structure/Component.js';

export default new Component({
    customId: 'my-button-id',
    type: 'button',
    options: {
        public: false // Only command author can use
    },
    run: async (client: DiscordBot, interaction) => {
        if (!interaction.isButton()) return;

        await interaction.reply({
            content: 'Button clicked!',
            ephemeral: true
        });
    }
}).toJSON();
```

### Creating a New Event

```typescript
// src/events/Client/myEvent.ts
import { Event } from '../../structure/Event.js';
import { info } from '../../utils/Console.js';

export default new Event({
    event: 'guildCreate',
    once: false,
    run: async (client, guild) => {
        info(`Joined new guild: ${guild.name}`);
    }
}).toJSON();
```

## 🧪 Testing

### Type Checking
```bash
bun run typecheck
```

### Manual Testing
1. Run bot in development mode: `bun run dev`
2. Test your changes in a Discord server
3. Check `terminal.log` for errors
4. Use `/reload` to reload commands without restarting

### Testing Checklist
- [ ] Code compiles without TypeScript errors
- [ ] No runtime errors
- [ ] Command responds as expected
- [ ] Error handling works correctly
- [ ] Permissions are enforced
- [ ] Cooldowns work properly

## 📤 Submitting Changes

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make your changes**
   - Follow code style guidelines
   - Add comments for complex logic
   - Update documentation if needed

3. **Test thoroughly**
   ```bash
   bun run typecheck
   bun run dev
   ```

4. **Commit with clear messages**
   ```bash
   git add .
   git commit -m "feat: add new example command"
   ```

   Use conventional commits:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation
   - `style:` - Formatting
   - `refactor:` - Code restructuring
   - `test:` - Tests
   - `chore:` - Maintenance

5. **Push and create PR**
   ```bash
   git push origin feature/my-new-feature
   ```

### PR Guidelines

**Title:** Use conventional commit format
```
feat: add user info command
fix: resolve cooldown bug
docs: update installation guide
```

**Description:** Include:
- What changes were made
- Why the changes were needed
- How to test the changes
- Related issues (if any)

**Example PR Description:**
```markdown
## Changes
- Added new `/userinfo` command
- Displays user avatar, join date, and roles

## Motivation
Requested by users to easily view member information

## Testing
1. Run `/userinfo @user`
2. Verify all information displays correctly
3. Test with users having different roles

## Related Issues
Closes #42
```

## 🐛 Reporting Bugs

### Before Reporting
1. Check existing issues
2. Test on latest version
3. Verify it's not a configuration issue

### Bug Report Template
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Run command '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- Bun version: [e.g. 1.0.0]
- Discord.js version: [e.g. 14.17.0]
- OS: [e.g. Windows 11]

**Additional context**
Any other context about the problem.
```

## 💡 Feature Requests

### Feature Request Template
```markdown
**Feature Description**
A clear description of the feature.

**Use Case**
Why this feature would be useful.

**Proposed Solution**
How you think this could be implemented.

**Alternatives Considered**
Other solutions you've thought about.
```

## 📚 Resources

### Documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Bun Documentation](https://bun.sh/docs)
- [Discord.js Guide](https://discordjs.guide/)
- [Discord API Docs](https://discord.com/developers/docs)

### Useful Tools
- [Discord Developer Portal](https://discord.com/developers/applications)
- [Discord.js Documentation](https://discord.js.org/)
- [TypeScript Playground](https://www.typescriptlang.org/play)

## 🤝 Community

### Code of Conduct
- Be respectful and inclusive
- Provide constructive feedback
- Help others when possible
- Follow GitHub's community guidelines

### Getting Help
- Check documentation first
- Search existing issues
- Ask in discussions
- Be specific about your problem

## 🎉 Recognition

Contributors will be:
- Listed in CHANGELOG.md
- Mentioned in release notes
- Given credit in documentation

Thank you for contributing! 🙏

---

**Questions?** Open a discussion or issue!
