# Discord Bot - TypeScript & Bun# <samp>DiscordJS-V14-Bot-Template</samp> v3



A modern, fully-typed Discord bot built with **Discord.js v14**, **TypeScript**, and powered by **Bun** runtime.A Discord bot commands, components and events handler based on **discord.js v14** and fully written in JavaScript.



## ✨ FeaturesDid you like the project? Click on the star button (⭐️) right above your screen, thank you!



- 🚀 **Blazing Fast** - Powered by Bun for ultra-fast performance## Features

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
- `/components` - Test buttons and select menus
- `/show-modal` - Test modal interaction
- `/autocomplete` - Test autocomplete feature
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
