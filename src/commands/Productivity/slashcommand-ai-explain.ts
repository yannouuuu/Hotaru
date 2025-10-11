import { ApplicationCommandType, ApplicationCommandOptionType, MessageFlags } from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { ApplicationCommand } from '../../structure/ApplicationCommand.js';
import { executeAiCommand, sendAiResult } from '../../utils/aiCommandRunner.js';
import { AiProviderError } from '../../utils/ai/providers.js';

const SYSTEM_PROMPT = 'Tu es un expert pédagogique chargé d\'expliquer du code à des étudiants en informatique. Fournis une explication claire, structurée et concrète en français.';

export default new ApplicationCommand({
    command: {
        name: 'ai-explain',
        description: 'Obtenir une explication pédagogique pour un bout de code.',
        type: ApplicationCommandType.ChatInput,
        options: [
            {
                name: 'code',
                description: 'Le code à expliquer (2000 caractères max).',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'contexte',
                description: 'Précisions supplémentaires (langage, objectif, contraintes).',
                type: ApplicationCommandOptionType.String,
                required: false
            }
        ]
    },
    options: {
        cooldown: 15000
    },
    run: async (_client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const code = interaction.options.getString('code', true);
        const context = interaction.options.getString('contexte')?.trim();

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const userPromptParts = [
                'Explique le code suivant en détaillant la logique, les points importants et les pistes d\'amélioration potentielles.',
                'Code :\n```\n' + code + '\n```'
            ];

            if (context) {
                userPromptParts.push(`Contexte supplémentaire : ${context}`);
            }

            const result = await executeAiCommand({
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userPromptParts.join('\n\n') }
                ],
                temperature: 0.35,
                maxTokens: 1100
            });

            await sendAiResult(interaction, result);
        } catch (error) {
            const message = error instanceof AiProviderError
                ? error.message
                : 'Une erreur inconnue est survenue lors de la génération de l\'explication.';

            await interaction.editReply({
                content: `❌ ${message}`,
                allowedMentions: { parse: [] }
            });
        }
    }
}).toJSON();
