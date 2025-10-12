# Changelog

All notable changes to this project will be documented in this file.

## [2.3.0] - 2025-10-12

### 🏆 Nouveauté - Classement des professeurs

Système complet de votes hebdomadaires avec classements mensuels/annuels et archivage automatique.

### Added
- 🎓 **Nouvelles commandes Communauté :**
  - `/prof-vote` pour voter (points pondérés 3/2/1)
  - `/ranking` (weekly/monthly/annual/history/voters)
- 🛠️ **Commandes Admin `/prof` :** ajout, retrait, reset, configuration du salon d'archives, listing
- � **Panneau interactif** : embed permanent avec boutons (vote, classements mensuels/annuels, historique, top votants)
- �📦 **ProfessorRankingManager** : persistance YAML, historiques hebdomadaires, classement votants
- 📄 Documentation dédiée : `docs/PROFESSOR_RANKING.md`

### Changed
- ⚙️ Initialisation du `ProfessorRankingManager` dans le cycle de vie du bot (démarrage automatique)
- 🔔 Archivage hebdomadaire automatique avec publication optionnelle dans un salon configuré

---

## [2.2.0] - 2025-10-11

### ⏰ Nouveauté - Gestionnaire de rappels personnels

Ajout d'un système complet de rappels personnels pour chaque membre du serveur.

### Added
- ✨ **Nouvelles commandes Utility :**
  - `/remind` pour planifier un rappel (DM ou salon, répété ou non)
  - `/reminders` pour lister tous les rappels actifs de l'utilisateur
- 🧠 **ReminderService** : module modulaire (Store/Scheduler/Service) avec persistance YAML et répétitions (quotidien / hebdo / mensuel)
- 📬 Livraisons automatiques en DM ou dans le salon d'origine avec fallback intelligent
- ⚙️ Option d'environnement (`REMINDERS_MAX_PER_USER`)

### Changed
- 📚 Documentation mise à jour pour couvrir la configuration des rappels
- 🛠️ Instanciation du `ReminderService` dans le cycle de vie du bot (démarrage automatique sur `clientReady`)

---

## [2.1.0] - 2025-10-07

### 🎯 Major Feature - Automatic Server Setup System

Complete implementation of automatic Discord server configuration system for BUT Informatique.

### Added
- ✨ **New Commands:**
  - `/setup` - Automatically configures a complete Discord server (8 roles, 6 categories, 27 channels)
  - `/cleanup` - Completely removes all setup elements with double confirmation (IRREVERSIBLE)

- 🛠️ **New Utilities:**
  - `SetupManager` class - Manages role/channel/category creation and database operations
  - `SetupMessages` class - Handles all interactive messages with embeds and components
  - Complete TypeScript types in `src/types/setup.d.ts`

- 🔘 **New Interactive Components (10 total):**
  - **Cleanup buttons (3):** `cleanup_confirm_first`, `cleanup_execute`, `cleanup_cancel`
  - **Role buttons (2):** `role_delegue`, `role_jobs` - Toggle roles with visual confirmation
  - **Support button (1):** `create_ticket` - Creates private support tickets automatically
  - **Admin panel buttons (3):** `panel_refresh`, `panel_stats`, `panel_config`
  - **Select menu (1):** `useful_links_menu` - Dropdown for useful links

- 🎮 **Interactive Messages (5):**
  - Verification system with instructions
  - Self-assignable role system (Délégué, Jobs)
  - Useful links dropdown menu (Notion, EDT, Moodle, etc.)
  - Support ticket creation system
  - Admin control panel with refresh/stats/config buttons

- 📁 **Server Structure Created:**
  - 8 roles with custom permissions and colors
  - 6 organized categories (System, Discussions, Voice, Courses, Support, Moderation)
  - 27 channels (text, voice, forum, announcements)
  - Automatic permission configuration for all elements

- 💾 **Database Integration:**
  - Automatic saving of all IDs in `database.yml`
  - Easy retrieval of setup data
  - Complete cleanup support

- ⚙️ **Configuration:**
  - Auto-generated `.env` configuration after setup
  - All role/category/channel IDs exported
  - `SetupConfig` interface added to main config

- 📚 **Documentation:**
  - Complete setup guide (`SETUP_GUIDE.md` - 456 lines)
  - Feature overview (`SETUP_FEATURES.md` - 201 lines)
  - Detailed recap (`SETUP_RECAP.md` - 378 lines)

### Technical Details
- 📊 **Statistics:**
  - 18 files created/modified
  - ~2,500 lines of TypeScript code
  - ~650 lines of documentation
  - 10 interactive components
  - Full type safety with strict TypeScript

- 🛡️ **Security:**
  - Administrator permission checks
  - Double confirmation for destructive actions
  - Rate limiting with delays between creations
  - Comprehensive error handling
  - Validation at every step

- 🎨 **Code Quality:**
  - Clean, readable, and maintainable code
  - Fully typed with TypeScript strict mode
  - Modular architecture (classes, utilities, types)
  - JSDoc documentation
  - DRY and SOLID principles applied
  - Async/await throughout

### Changed
- 🔧 Updated `src/config.ts` with `SetupConfig` interface
- 📝 Enhanced main configuration with setup options

### Use Cases
- 🎓 Initial server deployment for new Discord servers
- 🧪 Testing and development (setup → test → cleanup → repeat)
- 🔄 Server migration with complete structure recreation

### Notes
- ⚠️ `/cleanup` is IRREVERSIBLE - designed for testing and complete resets
- ✅ All TypeScript types verified - zero compilation errors
- 🚀 Ready for production use
- 📖 Complete documentation available in `docs/` folder

---

## [2.0.0] - 2025-10-07

### 🎉 Major Rewrite - TypeScript & Bun

This is a complete rewrite of the Discord bot from JavaScript to TypeScript, with Bun as the runtime.

### Added
- ✨ Full TypeScript support with strict type checking
- 🚀 Bun runtime integration for improved performance
- 📝 Comprehensive documentation (README, INSTALLATION, MIGRATION guides)
- 🔄 Hot reload support in development mode
- 🎨 Modern project structure
- 🔧 Environment-based configuration
- 📦 ES Modules support
- 🛡️ Improved type safety for all commands and handlers
- 🎯 Type guards for Discord interactions
- 📊 Better error handling and logging
- 🔐 Environment variable validation

### Changed
- 🔨 Migrated from CommonJS (`require`) to ES Modules (`import/export`)
- 🔄 Converted all `.js` files to `.ts`
- 📦 Updated package.json for Bun and TypeScript
- 🎨 Modernized code syntax (async/await, template literals)
- 🏗️ Restructured project with clearer organization
- 🔧 Configuration now uses environment variables
- 📝 Improved console logging with colors
- 🎯 Command structures now use Discord.js enums instead of magic numbers

### Removed
- ❌ Removed `colors` package (replaced with native ANSI codes)
- ❌ Removed `dotenv` package (Bun loads .env automatically)
- ❌ Removed all original branding and references
- ❌ Cleaned up unnecessary dependencies

### Fixed
- 🐛 Fixed type inconsistencies
- 🔧 Improved error handling in handlers
- 🎯 Better null/undefined checks
- 🔒 More secure configuration handling

### Technical Details

**Breaking Changes:**
- All commands must be converted to TypeScript
- Import statements must include `.js` extension
- `Awaitable<>` type replaced with explicit `Promise<void> | void`
- Type guards required for interaction handling

**Dependencies:**
- `discord.js`: ^14.17.0
- `quick-yaml.db`: ^1.2.2
- `@types/node`: ^20.11.0
- `bun-types`: ^1.0.0
- `typescript`: ^5.0.0

**Scripts:**
- `start`: Run the bot in production
- `dev`: Run with auto-reload
- `build`: Build the project
- `typecheck`: Check TypeScript types

### Migration Notes

For users migrating from the JavaScript version:
1. See MIGRATION.md for detailed upgrade instructions
2. All `.js` files have been converted to `.ts`
3. Configuration moved to environment variables
4. Commands now require type guards

### Contributors
- Complete TypeScript conversion and modernization
- Bun runtime integration
- Comprehensive documentation
- Code cleanup and optimization

---

## [1.0.0] - Previous Version

### Features
- Basic Discord.js v14 bot structure
- Command handler for message and application commands
- Component handler for buttons, modals, and select menus
- Event handler
- YAML database support
- Developer and utility commands

---

**Legend:**
- ✨ New feature
- 🔨 Changed
- 🐛 Bug fix
- ❌ Removed
- 🔧 Improved
- 📝 Documentation
