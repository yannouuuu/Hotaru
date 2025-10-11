import type { AiMessage, AiGenerationOptions, AiGenerationResult, AiUsage } from './ai/types.js';

export interface OpenRouterTool {
    type: string;
    function?: {
        name: string;
        description?: string;
        parameters?: unknown;
    };
}

interface OpenRouterChoice {
    index: number;
    message: {
        role: AiMessage['role'];
        content: string;
    };
    finish_reason?: string;
}

interface OpenRouterUsage {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
}

interface OpenRouterCompletionResponse {
    id: string;
    choices: OpenRouterChoice[];
    usage?: OpenRouterUsage;
}

export class OpenRouterError extends Error {
    constructor(message: string, public readonly status?: number) {
        super(message);
        this.name = 'OpenRouterError';
    }
}

export class OpenRouterClient {
    public static readonly DEFAULT_MODEL = 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free';
    private readonly apiKey: string;
    private readonly model: string;
    private readonly apiUrl: string;
    private readonly maxRateLimitRetries = 3;
    private readonly baseRetryDelayMs = 1200;

    constructor(params?: {
        apiKey?: string;
        model?: string;
        apiUrl?: string;
    }) {
        const envApiKey = process.env.OPENROUTER_API_KEY;
        this.apiKey = params?.apiKey ?? envApiKey ?? '';
        this.model = params?.model ?? OpenRouterClient.DEFAULT_MODEL;
        this.apiUrl = params?.apiUrl ?? 'https://openrouter.ai/api/v1/chat/completions';

        if (!this.apiKey) {
            throw new OpenRouterError('Missing OpenRouter API key. Set OPENROUTER_API_KEY in your environment.');
        }
    }

    public async createChatCompletion(
        messages: AiMessage[],
        options: AiGenerationOptions & { tools?: OpenRouterTool[] } = {}
    ): Promise<AiGenerationResult> {
        if (!Array.isArray(messages) || messages.length === 0) {
            throw new OpenRouterError('At least one message is required to query OpenRouter.');
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        };

        const referer = process.env.OPENROUTER_APP_URL;
        const title = process.env.OPENROUTER_APP_TITLE;

        if (referer) {
            headers['HTTP-Referer'] = referer;
        }

        if (title) {
            headers['X-Title'] = title;
        }

        const body = {
            model: this.model,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 1024,
            top_p: options.topP ?? 0.95,
            presence_penalty: options.presencePenalty ?? 0,
            frequency_penalty: options.frequencyPenalty ?? 0,
            stop: options.stop,
            tools: options.tools,
            store: options.store ?? false,
            stream: false
        };

        const init = {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        };

        for (let attempt = 0; attempt < this.maxRateLimitRetries; attempt++) {
            const response = await fetch(this.apiUrl, init);

            if (response.ok) {
                const data = await response.json() as OpenRouterCompletionResponse;
                const choice = data.choices?.[0];

                if (!choice?.message?.content) {
                    throw new OpenRouterError('OpenRouter response did not include a completion message.');
                }

                return {
                    message: choice.message.content.trim(),
                    usage: this.mapUsage(data.usage),
                    finishReason: choice.finish_reason
                };
            }

            const rawErrorText = await response.text();
            const parsedMessage = this.extractErrorMessage(rawErrorText);
            const statusMessage = parsedMessage || rawErrorText || response.statusText;

            if (response.status === 404 && this.model !== OpenRouterClient.DEFAULT_MODEL) {
                const guidance = `Le modèle "${this.model}" n'est pas accessible avec votre politique de données actuelle. ` +
                    `Choisissez un modèle compatible (ex: ${OpenRouterClient.DEFAULT_MODEL}) ` +
                    `ou ajustez vos paramètres : https://openrouter.ai/settings/privacy`;
                throw new OpenRouterError(`OpenRouter request failed (404): ${guidance}`, response.status);
            }

            if (response.status === 429) {
                const retryAfterHeader = response.headers.get('retry-after');
                const retryAfterSeconds = this.parseRetryAfter(retryAfterHeader);
                const waitMs = retryAfterSeconds !== undefined
                    ? retryAfterSeconds * 1000
                    : this.computeBackoffDelay(attempt);
                const waitLabel = retryAfterSeconds !== undefined
                    ? `${retryAfterSeconds} seconde(s)`
                    : `${Math.round(waitMs / 1000)} seconde(s)`;
                const rateMessage = parsedMessage ?? 'Quota de requêtes OpenRouter atteint.';

                if (attempt < this.maxRateLimitRetries - 1) {
                    await this.delay(waitMs);
                    continue;
                }

                throw new OpenRouterError(
                    `OpenRouter request failed (429): ${rateMessage} Attendez ${waitLabel} avant de réessayer.`,
                    response.status
                );
            }

            throw new OpenRouterError(`OpenRouter request failed (${response.status}): ${statusMessage}`, response.status);
        }

        throw new OpenRouterError('OpenRouter request failed after multiple retry attempts.');
    }

    private mapUsage(usage?: OpenRouterUsage): AiUsage | undefined {
        if (!usage) {
            return undefined;
        }

        return {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens
        };
    }

    private extractErrorMessage(rawText: string): string | undefined {
        if (!rawText) {
            return undefined;
        }

        try {
            const parsed = JSON.parse(rawText) as { error?: { message?: string } };
            return parsed.error?.message ?? undefined;
        } catch {
            return undefined;
        }
    }

    private parseRetryAfter(retryAfter: string | null): number | undefined {
        if (!retryAfter) {
            return undefined;
        }

        const numeric = Number(retryAfter);
        if (!Number.isNaN(numeric)) {
            return numeric;
        }

        const date = Date.parse(retryAfter);
        if (!Number.isNaN(date)) {
            const diffMs = date - Date.now();
            if (diffMs > 0) {
                return Math.ceil(diffMs / 1000);
            }
        }

        return undefined;
    }

    private computeBackoffDelay(attempt: number): number {
        const jitter = Math.floor(Math.random() * 300);
        return this.baseRetryDelayMs * Math.pow(2, attempt) + jitter;
    }

    private async delay(ms: number): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, ms));
    }
}
