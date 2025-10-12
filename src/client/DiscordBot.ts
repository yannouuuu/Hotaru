import { Client, Collection, Partials, ActivityType, type ActivitiesOptions } from 'discord.js';
import { CommandsHandler } from './handler/CommandsHandler.js';
import { warn, error, success } from '../utils/Console.js';
import { config } from '../config.js';
import { CommandsListener } from './handler/CommandsListener.js';
import { ComponentsHandler } from './handler/ComponentsHandler.js';
import { ComponentsListener } from './handler/ComponentsListener.js';
import { EventsHandler } from './handler/EventsHandler.js';
// @ts-ignore - quick-yaml.db has incorrect type exports
import { QuickYAML } from 'quick-yaml.db';
import type { ApplicationCommandData } from '../structure/ApplicationCommand.js';
import type { MessageCommandData } from '../structure/MessageCommand.js';
import type { ComponentData } from '../structure/Component.js';
import type { AutocompleteComponentData } from '../structure/AutocompleteComponent.js';
import { JobsManager } from '../utils/JobsManager.js';
import { ReminderService } from '../utils/reminders/ReminderService.js';
import { ScheduleManager } from '../utils/ScheduleManager.js';
import { ProfessorRankingManager } from '../utils/ProfessorRankingManager.js';
import { AgendaManager } from '../utils/AgendaManager.js';

export class DiscordBot extends Client {
    public collection = {
        application_commands: new Collection<string, ApplicationCommandData>(),
        message_commands: new Collection<string, MessageCommandData>(),
        message_commands_aliases: new Collection<string, string>(),
        components: {
            buttons: new Collection<string, ComponentData>(),
            selects: new Collection<string, ComponentData>(),
            modals: new Collection<string, ComponentData>(),
            autocomplete: new Collection<string, AutocompleteComponentData>()
        }
    };

    public rest_application_commands_array: any[] = [];
    public login_attempts = 0;
    public login_timestamp = 0;
    public statusMessages: ActivitiesOptions[] = [];

    public commands_handler: CommandsHandler;
    public components_handler: ComponentsHandler;
    public events_handler: EventsHandler;
    public database: QuickYAML;
    public jobsManager: JobsManager;
    public reminderService: ReminderService;
    public scheduleManager: ScheduleManager;
    public professorRankingManager: ProfessorRankingManager;
    public agendaManager: AgendaManager;

    constructor() {
        super({
            intents: 3276799,
            partials: [
                Partials.Channel,
                Partials.GuildMember,
                Partials.Message,
                Partials.Reaction,
                Partials.User
            ],
            presence: {
                activities: [{
                    name: 'Initializing...',
                    type: 4,
                    state: 'Starting up'
                }]
            }
        });

        this.commands_handler = new CommandsHandler(this);
        this.components_handler = new ComponentsHandler(this);
        this.events_handler = new EventsHandler(this);
    this.database = new QuickYAML(config.database.path);
    this.jobsManager = new JobsManager(this);
    this.reminderService = new ReminderService(this);
    this.scheduleManager = new ScheduleManager(this);
    this.professorRankingManager = new ProfessorRankingManager(this);
    this.agendaManager = new AgendaManager(this);

        new CommandsListener(this);
        new ComponentsListener(this);
    }

    public startStatusRotation = (): void => {
        let index = 0;
        this.refreshIdleStatuses();
        setInterval(() => {
            if (this.scheduleManager?.hasPresenceMode()) {
                return;
            }
            if (this.user) {
                if (!this.statusMessages.length) {
                    this.refreshIdleStatuses();
                }

                const payload = this.statusMessages[index];
                if (!payload) {
                    index = 0;
                    return;
                }

                this.user.setPresence({
                    activities: [payload],
                    status: 'online'
                });
                index = (index + 1) % this.statusMessages.length;
                if (index === 0) {
                    this.refreshIdleStatuses();
                }
            }
        }, 4000);
    };

    private refreshIdleStatuses(): void {
        const statuses = this.buildIdleStatuses();
        if (statuses.length === 0) {
            statuses.push({
                name: 'Hotaru',
                type: ActivityType.Custom,
                state: 'Besoin d\'un coup de main ? /help'
            });
        }
        this.statusMessages = statuses;
    }

    private buildIdleStatuses(): ActivitiesOptions[] {
        const guildCount = this.guilds.cache.size;
        const memberCount = this.guilds.cache.reduce((total, guild) => total + (guild.memberCount ?? 0), 0);
        const applicationCommands = this.collection.application_commands.size;
        const prefixCommands = this.collection.message_commands.size;
        const totalCommands = applicationCommands + prefixCommands;

        const campusStatus = guildCount <= 1
            ? 'sur un campus connecté'
            : `sur ${guildCount} campus connectés`;

        const studentStatus = memberCount <= 10
            ? 'vos projets étudiants'
            : `${memberCount} étudiants accompagnés`;

        const commandStatus = totalCommands <= 1
            ? "l'atelier Hotaru"
            : `${totalCommands} commandes Hotaru`;

        return [
            {
                name: 'Hotaru',
                type: ActivityType.Custom,
                state: 'Besoin d\'un coup de main ? /help'
            },
            {
                name: campusStatus,
                type: ActivityType.Watching
            },
            {
                name: studentStatus,
                type: ActivityType.Listening
            },
            {
                name: commandStatus,
                type: ActivityType.Playing
            },
            {
                name: '/setup votre serveur',
                type: ActivityType.Competing
            },
            {
                name: '/ai-chat avec le campus',
                type: ActivityType.Playing
            }
        ];
    }

    public connect = async (): Promise<void> => {
        warn(`Attempting to connect to the Discord bot... (${this.login_attempts + 1})`);

        this.login_timestamp = Date.now();

        try {
            const token = process.env.CLIENT_TOKEN;
            
            if (!token) {
                throw new Error('CLIENT_TOKEN is not defined in environment variables');
            }

            await this.login(token);
            await this.commands_handler.load();
            await this.components_handler.load();
            await this.events_handler.load();
            this.startStatusRotation();

            warn('Attempting to register application commands... (this might take a while!)');
            await this.commands_handler.registerApplicationCommands(config.development);
            success('Successfully registered application commands. For specific guild? ' + (config.development.enabled ? 'Yes' : 'No'));
        } catch (err) {
            error('Failed to connect to the Discord bot, retrying...');
            error(String(err));
            this.login_attempts++;
            setTimeout(() => this.connect(), 5000);
        }
    };
}
