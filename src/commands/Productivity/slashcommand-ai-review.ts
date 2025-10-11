import { ApplicationCommandType, ApplicationCommandOptionType, MessageFlags } from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { ApplicationCommand } from '../../structure/ApplicationCommand.js';
import { executeAiCommand, sendAiResult } from '../../utils/aiCommandRunner.js';
import { AiProviderError } from '../../utils/ai/providers.js';

const SYSTEM_PROMPT = 'Tu es un reviewer de code senior. Ton rôle est d\'identifier les bugs potentiels, anti-patterns, améliorations de performance et opportunités de refactorisation. Fournis des recommandations actionnables en français.';

export default new ApplicationCommand({
    command: {
        name: 'ai-review',
        description: 'Faire relire un code par l\'IA avec des retours détaillés.',
        type: ApplicationCommandType.ChatInput,
        options: [
            {
                name: 'code',
                description: 'Le code à analyser (2000 caractères max).',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'objectif',
                description: 'Objectif ou contexte du code (facultatif).',
                type: ApplicationCommandOptionType.String,
                required: false
            }
        ]
    },
    options: {
        cooldown: 20000
    },
    run: async (_client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const code = interaction.options.getString('code', true);
        const objectif = interaction.options.getString('objectif')?.trim();

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const promptSections = [
                'Analyse ce code et fournis un retour structuré : points forts, problèmes détectés, améliorations recommandées.',
                'Code :\n```\n' + code + '\n```'
            ];

            if (objectif) {
                promptSections.push(`Objectif déclaré : ${objectif}`);
            }

            const result = await executeAiCommand({
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: promptSections.join('\n\n') }
                ],
                temperature: 0.3,
                maxTokens: 1200
            });

            await sendAiResult(interaction, result);
        } catch (error) {
            const message = error instanceof AiProviderError
                ? error.message
                : 'Une erreur inconnue est survenue pendant la relecture.';

            await interaction.editReply({
                content: `❌ ${message}`,
                allowedMentions: { parse: [] }
            });
        }
    }
}).toJSON();
