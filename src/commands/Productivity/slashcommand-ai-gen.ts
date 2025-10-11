import { ApplicationCommandType, ApplicationCommandOptionType, MessageFlags } from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { ApplicationCommand } from '../../structure/ApplicationCommand.js';
import { executeAiCommand, sendAiResult } from '../../utils/aiCommandRunner.js';
import { AiProviderError } from '../../utils/ai/providers.js';

const SYSTEM_PROMPT = 'Tu es un générateur de code fiable et pragmatique. Fourni du code prêt à l\'emploi, bien structuré et commenté lorsque c\'est pertinent. Réponds en français, mais garde le code dans la langue appropriée.';

export default new ApplicationCommand({
    command: {
        name: 'ai-gen',
        description: 'Générer du code à partir d\'un besoin fonctionnel.',
        type: ApplicationCommandType.ChatInput,
        options: [
            {
                name: 'besoin',
                description: 'Décris précisément le code à générer.',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'langage',
                description: 'Langage de programmation souhaité.',
                type: ApplicationCommandOptionType.String,
                required: false,
                choices: [
                    { name: 'Java', value: 'Java' },
                    { name: 'Markdown', value: 'Markdown' },
                    { name: 'SQL', value: 'SQL' },
                    { name: 'Bash', value: 'Bash' },
                    { name: 'TypeScript', value: 'TypeScript' },
                    { name: 'JavaScript', value: 'JavaScript' },
                    { name: 'Python', value: 'Python' },
                    { name: 'Go', value: 'Go' },
                    { name: 'Rust', value: 'Rust' },
                    { name: 'Markdown Pandoc', value: 'Markdown Pandoc' },
                    { name: 'AsciiDoc', value: 'AsciiDoc' },
                    { name: 'Swift', value: 'Swift' },
                    { name: 'Kotlin', value: 'Kotlin' },
                    { name: 'C', value: 'C' },
                ]
            },
        ]
    },
    options: {
        cooldown: 20000
    },
    run: async (_client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const need = interaction.options.getString('besoin', true);
        const language = interaction.options.getString('langage') ?? 'Langage approprié';

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const userPrompt = [
                `Langage ciblé : ${language}.`,
                'Génère le code demandé avec une courte explication des décisions importantes.',
                `Besoin détaillé : ${need}`
            ].join('\n\n');

            const result = await executeAiCommand({
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.5,
                maxTokens: 1200
            });

            await sendAiResult(interaction, result);
        } catch (error) {
            const message = error instanceof AiProviderError
                ? error.message
                : 'Une erreur inconnue est survenue pendant la génération.';

            await interaction.editReply({
                content: `❌ ${message}`,
                allowedMentions: { parse: [] }
            });
        }
    }
}).toJSON();
