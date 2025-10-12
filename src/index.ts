import fs from 'fs';
import { DiscordBot } from './client/DiscordBot.js';

// Add BigInt serialization support for Discord.js
// This is necessary because Discord uses BigInt for IDs and permissions
(BigInt.prototype as any).toJSON = function() {
    return this.toString();
};

// Clear terminal log
try {
    fs.writeFileSync('./terminal.log', '', 'utf-8');
} catch {
    // Ignore write failures during startup
}

const client = new DiscordBot();

export default client;

void client.connect();

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});
