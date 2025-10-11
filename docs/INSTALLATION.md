# Installation Guide

This guide will walk you through setting up the Discord bot on your system.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Bun** (v1.0.0 or higher)
   ```bash
   # On Windows (PowerShell)
   powershell -c "irm bun.sh/install.ps1 | iex"
   
   # On macOS/Linux
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Git** (for cloning the repository)
   - Download from [git-scm.com](https://git-scm.com/)

3. **Discord Bot Application**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Click "New Application"
   - Go to "Bot" section and click "Add Bot"
   - Enable the following Privileged Gateway Intents:
     - Presence Intent
     - Server Members Intent
     - Message Content Intent
   - Copy your bot token (you'll need this later)

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd HotaruReborn
```

### 2. Install Dependencies

```bash
bun install
```

This will install:
- `discord.js` - Discord API wrapper
- `quick-yaml.db` - YAML database
- `@types/node` - Node.js type definitions
- `bun-types` - Bun runtime type definitions

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# On Windows
copy .env.example .env

# On macOS/Linux
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required: Your Discord bot token
CLIENT_TOKEN=your_bot_token_here

# Required: Your Discord user ID (right-click yourself in Discord and click "Copy User ID")
OWNER_ID=your_user_id_here

# Optional: Other developer IDs (comma-separated)
DEVELOPER_IDS=123456789,987654321

# Optional: Bot command prefix (default: !)
BOT_PREFIX=!

# Optional: Guild ID for testing (enables faster command registration)
DEV_GUILD_ID=your_test_server_id
```

### 4. Configure the Bot

Copy the example configuration:

```bash
# On Windows
copy src\config.example.ts src\config.ts

# On macOS/Linux
cp src/config.example.ts src/config.ts
```

Edit `src/config.ts` to customize:

```typescript
export const config: Config = {
    database: {
        path: './database.yml'  // Database file location
    },
    development: {
        enabled: false,  // Set to true for testing in a specific server
        guildId: process.env.DEV_GUILD_ID || ''
    },
    commands: {
        prefix: process.env.BOT_PREFIX || '!',
        message_commands: true,  // Enable/disable message commands
        application_commands: {
            chat_input: true,     // Slash commands
            user_context: true,   // User context menus
            message_context: true // Message context menus
        }
    },
    users: {
        ownerId: process.env.OWNER_ID || '',
        developers: process.env.DEVELOPER_IDS?.split(',') || []
    },
    messages: {
        // Customize error messages here
        NOT_BOT_OWNER: 'You must be the bot owner to use this command!',
        // ... other messages
    }
};
```

### 5. Invite Your Bot

Generate an invite link with the proper permissions:

1. Go to your application in the [Discord Developer Portal](https://discord.com/developers/applications)
2. Go to "OAuth2" → "URL Generator"
3. Select scopes:
   - `bot`
   - `applications.commands`
4. Select bot permissions (minimum recommended):
   - Read Messages/View Channels
   - Send Messages
   - Send Messages in Threads
   - Embed Links
   - Attach Files
   - Read Message History
   - Use Slash Commands
5. Copy the generated URL and open it in your browser
6. Select a server and authorize the bot

### 6. Run the Bot

Development mode (with auto-reload):
```bash
bun run dev
```

Production mode:
```bash
bun start
```

### 7. Verify Installation

Once the bot is running, you should see:
```
[Time] [Info] Loaded new command: ...
[Time] [OK] Successfully loaded X application commands and Y message commands.
[Time] [OK] Successfully loaded Z components.
[Time] [OK] Successfully loaded N events.
[Time] [OK] Successfully registered application commands.
[Time] [OK] Logged in as YourBotName, took Xs.
```

Test the bot:
- In Discord, type `/ping` - You should get a response with the bot's latency
- Type `!ping` - Same as above for message commands
- Try `/help` to see all available commands

## Troubleshooting

### Bot doesn't respond to commands

1. **Check bot token**: Make sure `CLIENT_TOKEN` in `.env` is correct
2. **Check intents**: Ensure Message Content Intent is enabled in Discord Developer Portal
3. **Check permissions**: Bot needs proper permissions in the server
4. **Check prefix**: If using message commands, verify the prefix in config

### Commands don't appear as slash commands

1. Wait a few minutes - Global commands can take up to 1 hour to register
2. Enable development mode in `config.ts` and set `DEV_GUILD_ID` for instant registration
3. Use `/reload` command to re-register commands
4. Check bot has `applications.commands` scope

### TypeScript errors

Run type checking:
```bash
bun run typecheck
```

If you see errors about missing modules, reinstall dependencies:
```bash
rm -rf node_modules bun.lockb
bun install
```

### Permission errors

Ensure your `OWNER_ID` in `.env` matches your Discord user ID:
1. Enable Developer Mode in Discord (Settings → Advanced → Developer Mode)
2. Right-click your username and select "Copy User ID"
3. Paste this ID in `.env`

## Next Steps

- Read [README.md](README.md) for full documentation
- Customize bot status in `src/client/DiscordBot.ts`
- Add your own commands in `src/commands/`
- Modify event handlers in `src/events/`
- Create custom components in `src/components/`

## Getting Help

- Check the [Discord.js Guide](https://discordjs.guide/)
- Read [Discord.js Documentation](https://discord.js.org/)
- Visit [Bun Documentation](https://bun.sh/docs)

## Development Tips

### Hot Reload

When using `bun run dev`, the bot automatically restarts when you save changes to TypeScript files.

### Command Registration

- **Global commands**: Take up to 1 hour to update
- **Guild commands**: Update instantly (use development mode)

### Database

The bot uses YAML for data storage. The database file is created automatically at `./database.yml`.

### Adding Commands

1. Create a new `.ts` file in `src/commands/[Category]/`
2. Use the appropriate command structure (see README.md examples)
3. Restart the bot or use `/reload`

### Debugging

Enable development mode and check `terminal.log` for detailed logs.

---

**Need more help?** Open an issue on GitHub!
