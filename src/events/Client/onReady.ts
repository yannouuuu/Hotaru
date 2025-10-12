import { success } from '../../utils/Console.js';
import { Event } from '../../structure/Event.js';

export default new Event({
    event: 'clientReady',
    once: true,
    run: (__client__, client) => {
        if (client.user) {
            const elapsed = ((Date.now() - __client__.login_timestamp) / 1000).toFixed(2);
            success(`Logged in as ${client.user.displayName}, took ${elapsed}s.`);
        }

        if (__client__.jobsManager) {
            __client__.jobsManager.start();
        }

        if (__client__.reminderService) {
            __client__.reminderService.start();
        }

        if (__client__.scheduleManager) {
            __client__.scheduleManager.start();
        }

        if (__client__.professorRankingManager) {
            __client__.professorRankingManager.start();
        }
    }
}).toJSON();
