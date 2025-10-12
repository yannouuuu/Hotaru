import { ApplicationCommandType, ApplicationCommandOptionType } from 'discord.js';
import type { DiscordBot } from '../../client/DiscordBot.js';
import { ApplicationCommand } from '../../structure/ApplicationCommand.js';
import { executeAiCommand, sendAiResult } from '../../utils/aiCommandRunner.js';
import { AiProviderError } from '../../utils/ai/providers.js';

const SYSTEM_PROMPT = 'Tu es un assistant chargé de résumer des contenus techniques et produits. Fournis des synthèses structurées et orientées action en français.';

const STYLE_CHOICES = [
    { name: 'Synopsis court (5 phrases)', value: 'short' },
    { name: 'Bullet points actionnables', value: 'bullets' },
    { name: 'Résumé détaillé', value: 'detailed' }
] as const;

type SummaryStyleValue = typeof STYLE_CHOICES[number]['value'];

const STYLE_DESCRIPTIONS: Record<SummaryStyleValue, string> = {
    short: 'Rédige un résumé en 5 phrases maximum.',
    bullets: 'Fournis 5 à 7 bullet points orientés action.',
    detailed: 'Propose un résumé détaillé avec contexte, risques et prochaines étapes.'
};

export default new ApplicationCommand({
    command: {
        name: 'summarize',
        description: 'Résumer un article ou contenu volumineux.',
        type: ApplicationCommandType.ChatInput,
        options: [
            {
                name: 'texte',
                description: 'Le contenu à résumer (documentation, article, notes de réunion, etc.).',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'style',
                description: 'Format souhaité pour le résumé.',
                type: ApplicationCommandOptionType.String,
                required: false,
                choices: STYLE_CHOICES.map(({ name, value }) => ({ name, value }))
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
        cooldown: 18000
    },
    run: async (_client: DiscordBot, interaction) => {
        if (!interaction.isChatInputCommand()) return;

    const text = interaction.options.getString('texte', true);
    const style = interaction.options.getString('style') as SummaryStyleValue | null;
    const resolvedStyle = style ?? 'short';
    const isPrivate = interaction.options.getBoolean('prive') ?? false;

    await interaction.deferReply({ ephemeral: isPrivate });

        try {
            const instructions = STYLE_DESCRIPTIONS[resolvedStyle];
            const userPrompt = [
                instructions,
                'Conserve les éléments chiffrés importants et cite les décisions clés.',
                'Texte à résumer :\n"""\n' + text + '\n"""'
            ].join('\n\n');

            const result = await executeAiCommand({
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.4,
                maxTokens: 1000,
                successPrefix: resolvedStyle === 'bullets' ? '**Résumé en bullet points**' : '**Résumé**'
            });

            await sendAiResult(interaction, result, { ephemeral: isPrivate });
        } catch (error) {
            const message = error instanceof AiProviderError
                ? error.message
                : 'Une erreur inconnue est survenue pendant le résumé.';

            await interaction.editReply({
                content: `❌ ${message}`,
                allowedMentions: { parse: [] }
            });
        }
    }
}).toJSON();
