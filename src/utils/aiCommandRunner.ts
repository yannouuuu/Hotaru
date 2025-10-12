import { MessageFlags, type ChatInputCommandInteraction } from 'discord.js';
import { getAiProvider, AiProviderError, AI_PROVIDER_METADATA, type AiProviderName } from './ai/providers.js';
import type { AiMessage, AiGenerationOptions } from './ai/types.js';
import { splitIntoDiscordChunks } from './messageChunks.js';

export interface AiCommandExecutionOptions extends AiGenerationOptions {
    messages: AiMessage[];
    successPrefix?: string;
}

export interface AiCommandExecutionResult {
    chunks: string[];
    usageSummary?: string;
    providerName: AiProviderName;
    providerLabel: string;
}

const EMPTY_RESPONSE_FALLBACK = '⚠️ Réponse vide reçue.';

const formatUsage = (promptTokens?: number, completionTokens?: number, totalTokens?: number): string | undefined => {
    if (typeof promptTokens !== 'number' && typeof completionTokens !== 'number' && typeof totalTokens !== 'number') {
        return undefined;
    }

    const parts: string[] = [];

    if (typeof promptTokens === 'number') {
        parts.push(`prompt: ${promptTokens}`);
    }

    if (typeof completionTokens === 'number') {
        parts.push(`completion: ${completionTokens}`);
    }

    if (typeof totalTokens === 'number') {
        parts.push(`total: ${totalTokens}`);
    }

    return parts.length > 0 ? parts.join(' · ') : undefined;
};

export const executeAiCommand = async (
    options: AiCommandExecutionOptions
): Promise<AiCommandExecutionResult> => {
    try {
        const { messages, successPrefix, ...generationOptions } = options;
        const providerInstance = getAiProvider();

        const result = await providerInstance.generate(messages, generationOptions as AiGenerationOptions);

        const content = successPrefix
            ? `${successPrefix}\n\n${result.message}`
            : result.message;

        const chunks = splitIntoDiscordChunks(content);
        const usageSummary = formatUsage(
            result.usage?.promptTokens,
            result.usage?.completionTokens,
            result.usage?.totalTokens
        );

        return {
            chunks,
            usageSummary,
            providerName: providerInstance.name,
            providerLabel: AI_PROVIDER_METADATA[providerInstance.name].label
        };
    } catch (error) {
        if (error instanceof AiProviderError) {
            throw error;
        }

        const cause = error instanceof Error ? error.message : String(error);
        throw new AiProviderError(`Unexpected error while contacting openrouter: ${cause}`, 'openrouter');
    }
};

export const sendAiResult = async (
    interaction: ChatInputCommandInteraction,
    result: AiCommandExecutionResult,
    options: { ephemeral?: boolean } = {}
): Promise<void> => {
    const ephemeral = options.ephemeral ?? false;
    const [firstChunk, ...otherChunks] = result.chunks.length > 0
        ? result.chunks
        : [EMPTY_RESPONSE_FALLBACK];

    await interaction.editReply({
        content: firstChunk,
        allowedMentions: { parse: [] }
    });

    for (const chunk of otherChunks) {
        await interaction.followUp({
            content: chunk,
            flags: ephemeral ? MessageFlags.Ephemeral : undefined,
            allowedMentions: { parse: [] }
        });
    }
};
