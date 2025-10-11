export type AiRole = 'system' | 'user' | 'assistant';

export interface AiMessage {
    role: AiRole;
    content: string;
}

export interface AiGenerationOptions {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
    stop?: string | string[];
    store?: boolean;
}

export interface AiUsage {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
}

export interface AiGenerationResult {
    message: string;
    usage?: AiUsage;
    finishReason?: string;
}

export type AiProviderName = 'openrouter';

export interface AiProvider {
    readonly name: AiProviderName;
    generate(messages: AiMessage[], options: AiGenerationOptions): Promise<AiGenerationResult>;
}
