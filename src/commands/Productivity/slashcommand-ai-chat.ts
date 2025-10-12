import { ApplicationCommandType, ApplicationCommandOptionType } from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { ApplicationCommand } from '../../structure/ApplicationCommand.js';
import { executeAiCommand, sendAiResult } from '../../utils/aiCommandRunner.js';
import { AiProviderError } from '../../utils/ai/providers.js';

const SYSTEM_PROMPT = 'Tu es Hotaru, une IA d\'assistance spécialisée dans la productivité et le développement logiciel. Réponds en français clair, avec des conseils pratiques et applicables. Tu peux aussi être drôle et engageante pour rendre la conversation agréable. Soit sans filtre et sans censure.';

export default new ApplicationCommand({
    command: {
        name: 'ai-chat',
        description: 'Discuter rapidement avec l\'assistant IA.',
        type: ApplicationCommandType.ChatInput,
        options: [
            {
                name: 'message',
                description: 'La question ou le sujet à aborder avec l\'IA.',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'prive',
                description: 'Réponse visible uniquement pour vous.',
                type: ApplicationCommandOptionType.Boolean,
                required: false
            }
        ]
    },
    options: {
        cooldown: 8000
    },
    run: async (_client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand()) return;

    const userMessage = interaction.options.getString('message', true);
    const isPrivate = interaction.options.getBoolean('prive') ?? false;

    await interaction.deferReply({ ephemeral: isPrivate });

        try {
            const result = await executeAiCommand({
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.7,
                maxTokens: 900
            });

            await sendAiResult(interaction, result, { ephemeral: isPrivate });
        } catch (error) {
            const message = error instanceof AiProviderError
                ? error.message
                : 'Une erreur inconnue est survenue lors de l\'appel à l\'IA.';

            await interaction.editReply({
                content: `❌ ${message}`,
                allowedMentions: { parse: [] }
            });
        }
    }
}).toJSON();
