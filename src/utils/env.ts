type EnvSource = Record<string, string | undefined>;
const defaultEnv: EnvSource = typeof process !== 'undefined' ? process.env : {};
export const readEnv = (key: string, env: EnvSource = defaultEnv): string | undefined => env[key]?.trim() || undefined;
export const readEnvList = (
    key: string,
    env: EnvSource = defaultEnv,
    delimiter = ',',
    options?: { allowEmpty?: boolean; transform?: (value: string) => string }
): string[] | undefined => {
    const raw = readEnv(key, env);
    if (!raw) return undefined;
    const values = raw
        .split(delimiter)
        .map((value) => options?.transform ? options.transform(value.trim()) : value.trim())
        .filter((value) => (options?.allowEmpty ? true : value.length > 0));
    return values.length > 0 ? values : undefined;
};
export const readEnvBoolean = (
    key: string,
    env: EnvSource = defaultEnv,
    defaultValue = false
): boolean => {
    const raw = readEnv(key, env);
    if (!raw) return defaultValue;
    const normalized = raw.toLowerCase();
    if (['1', 'true', 'yes', 'oui', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'non', 'off'].includes(normalized)) return false;
    return defaultValue;
};
export const readEnvNumber = (
    key: string,
    env: EnvSource = defaultEnv,
    options?: { fallback?: number; parser?: (value: string) => number }
): number | undefined => {
    const raw = readEnv(key, env);
    if (!raw) return options?.fallback;
    const parser = options?.parser ?? Number;
    const parsed = parser(raw);
    return Number.isFinite(parsed) ? parsed : options?.fallback;
};
