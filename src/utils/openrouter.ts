/**
 * Utilitaire pour interagir avec l'API OpenRouter
 * Fournit un accès à différents modèles de LLM
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

export interface OpenRouterOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Supprime les mentions dangereuses (@everyone, @here) des réponses de l'IA
 */
export function sanitizeAIResponse(text: string): string {
  return text
    .replace(/@everyone/gi, '@ everyone')
    .replace(/@here/gi, '@ here');
}

export async function sendToOpenRouter(
  messages: OpenRouterMessage[],
  options: OpenRouterOptions = {}
): Promise<string> {
  const apiKey = process.env.OPENROUTER_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_KEY n\'est pas configurée dans le fichier .env');
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://github.com/hotaru-bot',
      'X-Title': 'Hotaru Discord Bot',
    },
    body: JSON.stringify({
      model: options.model || 'x-ai/grok-4-fast:free',
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur OpenRouter: ${response.status} - ${error}`);
  }

  const data = await response.json() as OpenRouterResponse;
  const content = data.choices[0]?.message?.content || 'Aucune réponse reçue.';
  
  // Nettoyer les mentions dangereuses
  return sanitizeAIResponse(content);
}

export async function askAI(prompt: string, systemPrompt?: string): Promise<string> {
  const messages: OpenRouterMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  return sendToOpenRouter(messages);
}

