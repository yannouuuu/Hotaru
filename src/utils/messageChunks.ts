const DISCORD_MESSAGE_LIMIT = 2000;
const DEFAULT_SAFE_MARGIN = 100;

/**
 * Split a long string into chunks that fit within Discord's message character limit.
 * Defaults to 1900 characters per chunk, leaving a margin for formatting additions.
 */
export const splitIntoDiscordChunks = (content: string, maxLength = DISCORD_MESSAGE_LIMIT - DEFAULT_SAFE_MARGIN): string[] => {
    if (!content) {
        return [''];
    }

    const normalized = content.replace(/\r\n/g, '\n');
    if (normalized.length <= maxLength) {
        return [normalized];
    }

    const chunks: string[] = [];
    let buffer = '';

    for (const paragraph of normalized.split(/\n{2,}/)) {
        const paragraphWithSpacing = buffer ? `\n\n${paragraph}` : paragraph;

        if ((buffer + paragraphWithSpacing).length <= maxLength) {
            buffer += paragraphWithSpacing;
            continue;
        }

        if (buffer) {
            chunks.push(buffer);
            buffer = paragraph;
        }

        while (buffer.length > maxLength) {
            chunks.push(buffer.slice(0, maxLength));
            buffer = buffer.slice(maxLength);
        }
    }

    if (buffer) {
        chunks.push(buffer);
    }

    return chunks;
};
