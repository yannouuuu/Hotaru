import { Client, Collection, Partials, type ActivitiesOptions } from 'discord.js';
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
    public statusMessages: ActivitiesOptions[] = [
        { name: 'Status 1', type: 4 },
        { name: 'Status 2', type: 4 },
        { name: 'Status 3', type: 4 }
    ];

    public commands_handler: CommandsHandler;
    public components_handler: ComponentsHandler;
    public events_handler: EventsHandler;
    public database: QuickYAML;
    public jobsManager: JobsManager;
    public reminderService: ReminderService;
    public scheduleManager: ScheduleManager;
    public professorRankingManager: ProfessorRankingManager;

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

        new CommandsListener(this);
        new ComponentsListener(this);
    }

    public startStatusRotation = (): void => {
        let index = 0;
        setInterval(() => {
            if (this.scheduleManager?.hasPresenceMode()) {
                return;
            }
            if (this.user) {
                this.user.setPresence({ activities: [this.statusMessages[index]] });
                index = (index + 1) % this.statusMessages.length;
            }
        }, 4000);
    };

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
