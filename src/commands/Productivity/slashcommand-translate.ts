import { ApplicationCommandType, ApplicationCommandOptionType } from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { ApplicationCommand } from '../../structure/ApplicationCommand.js';
import { executeAiCommand, sendAiResult } from '../../utils/aiCommandRunner.js';
import { AiProviderError } from '../../utils/ai/providers.js';

const SYSTEM_PROMPT = 'Tu es un traducteur technique senior. Préserve le sens précis, la terminologie métier et la mise en forme Markdown. Clarifie les abréviations si nécessaire.';

const TARGET_LANGUAGE_CHOICES = [
    { name: 'Français', value: 'French' },
    { name: 'Anglais', value: 'English' },
    { name: 'Ukrainien', value: 'Ukrainian' },
    { name: 'Espagnol', value: 'Spanish' },
    { name: 'Allemand', value: 'German' },
    { name: 'Italien', value: 'Italian' },
    { name: 'Japonais', value: 'Japanese' },
    { name: 'Bulgare', value: 'Bulgarian' }
] as const;

type TargetLanguageValue = typeof TARGET_LANGUAGE_CHOICES[number]['value'];

const TARGET_LABEL = new Map<TargetLanguageValue, string>(
    TARGET_LANGUAGE_CHOICES.map(choice => [choice.value, choice.name])
);

export default new ApplicationCommand({
    command: {
        name: 'translate',
        description: 'Traduire un texte technique en conservant le sens.',
        type: ApplicationCommandType.ChatInput,
        options: [
            {
                name: 'texte',
                description: 'Le texte (documentation, message, etc.) à traduire.',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'cible',
                description: 'Langue cible de la traduction.',
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: TARGET_LANGUAGE_CHOICES.map(({ name, value }) => ({ name, value }))
            },
            {
                name: 'source',
                description: 'Langue source (détectée automatiquement sinon).',
                type: ApplicationCommandOptionType.String,
                required: false
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
        cooldown: 12000
    },
    run: async (_client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand()) return;

    const text = interaction.options.getString('texte', true);
    const target = interaction.options.getString('cible', true) as TargetLanguageValue;
    const source = interaction.options.getString('source')?.trim();
    const isPrivate = interaction.options.getBoolean('prive') ?? false;

    await interaction.deferReply({ ephemeral: isPrivate });

        try {
            const targetLabel = TARGET_LABEL.get(target) ?? target;
            const detectedSource = source ? `Langue source : ${source}.` : 'Détecte automatiquement la langue source.';

            const userPrompt = [
                `Traduire en ${targetLabel}.`,
                detectedSource,
                'Préserve la terminologie technique et le format Markdown.',
                'Texte à traduire :\n"""\n' + text + '\n"""'
            ].join('\n\n');

            const result = await executeAiCommand({
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.25,
                maxTokens: 900,
                successPrefix: `**Traduction (${targetLabel})**`
            });

            await sendAiResult(interaction, result, { ephemeral: isPrivate });
        } catch (error) {
            const message = error instanceof AiProviderError
                ? error.message
                : 'Une erreur inconnue est survenue pendant la traduction.';

            await interaction.editReply({
                content: `❌ ${message}`,
                allowedMentions: { parse: [] }
            });
        }
    }
}).toJSON();
