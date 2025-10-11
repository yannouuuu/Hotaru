import { OpenRouterClient, OpenRouterError } from '../OpenRouterClient.js';
import type { AiMessage, AiGenerationOptions, AiGenerationResult, AiProvider, AiProviderName } from './types.js';

export class AiProviderError extends Error {
    constructor(
        message: string,
        public readonly provider: AiProviderName,
        public readonly status?: number
    ) {
        super(message);
        this.name = 'AiProviderError';
    }
}

const DEFAULT_OPENROUTER_MODEL = 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free';
let providerInstance: AiProvider | undefined;

class OpenRouterProvider implements AiProvider {
    public readonly name: AiProviderName = 'openrouter';
    private readonly client: OpenRouterClient;

    constructor() {
        this.client = new OpenRouterClient({
            model: process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL
        });
    }

    public async generate(messages: AiMessage[], options: AiGenerationOptions): Promise<AiGenerationResult> {
        try {
            return await this.client.createChatCompletion(messages, options);
        } catch (error) {
            if (error instanceof OpenRouterError) {
                throw new AiProviderError(error.message, this.name, error.status);
            }

            const message = error instanceof Error ? error.message : String(error);
            throw new AiProviderError(`OpenRouter unexpected error: ${message}`, this.name);
        }
    }
}

export const getAiProvider = (): AiProvider => {
    if (!providerInstance) {
        providerInstance = new OpenRouterProvider();
    }

    return providerInstance;
};

export type { AiProviderName };
export const AI_PROVIDER_METADATA: Record<AiProviderName, { label: string; description: string; envKey: string; }> = {
    openrouter: {
        label: 'OpenRouter (Dolphin Mistral)',
        description: 'Requiert OPENROUTER_API_KEY. Modèle par défaut: Dolphin Mistral 24B Venice Edition.',
        envKey: 'OPENROUTER_API_KEY'
    }
};
