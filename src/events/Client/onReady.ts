import { success, error } from '../../utils/Console.js';
import { Event } from '../../structure/Event.js';
import { SetupManager } from '../../utils/SetupManager.js';

const PROMO_CHECK_INTERVAL_MS = 60_000;

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

        if (__client__.agendaManager) {
            __client__.agendaManager.start();
        }

        // Déblocage progressif des salons des groupes de promo
        setInterval(() => {
            SetupManager.checkProgress(__client__).catch((err) => {
                error(`Erreur lors du check progressif promo: ${err}`);
            });
        }, PROMO_CHECK_INTERVAL_MS);
    }
}).toJSON();
