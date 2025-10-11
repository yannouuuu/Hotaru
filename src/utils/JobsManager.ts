import { Colors, EmbedBuilder, time, TimestampStyles, type GuildTextBasedChannel, type Snowflake } from 'discord.js';
import type { DiscordBot } from '../client/DiscordBot.js';

interface FranceTravailAuthResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope?: string;
}

interface FranceTravailOffer {
    id: string;
    intitule: string;
    description?: string;
    dateCreation?: string;
    dateActualisation?: string;
    entreprise?: {
        nom?: string;
    };
    lieuTravail?: {
        libelle?: string;
        latitude?: number;
        longitude?: number;
        codePostal?: string;
        commune?: string;
    };
    typeContrat?: string;
    natureContrat?: string;
    dureeTravailLibelle?: string;
    experience?: {
        libelle?: string;
    };
    formations?: Array<{
        domaineLibelle?: string;
        niveauLibelle?: string;
    }>;
    salaire?: {
        libelle?: string;
    };
    urlRecruteur?: string;
    origineOffre?: {
        urlOrigine?: string;
    };
    qualificationCode?: string;
}

interface FranceTravailSearchResponse {
    resultats: number;
    offres: FranceTravailOffer[];
}

export interface JobsSearchOptions {
    keywords?: string[];
    departments?: string[];
    contractTypes?: string[];
    experienceLevels?: string[];
    limit?: number;
    minPublishedHours?: number;
}

interface JobsFeedStore {
    knownOfferIds: string[];
    lastFetchAt: number | null;
    lastPublishAt: number | null;
    lastError?: string;
}

export interface JobsRefreshResult {
    guildId: Snowflake;
    fetched: number;
    published: number;
    skipped: number;
    channelId?: Snowflake;
    error?: string;
}

export interface JobsManagerStatus {
    guildId: Snowflake;
    isConfigured: boolean;
    hasCredentials: boolean;
    channelId?: Snowflake;
    lastFetchAt: number | null;
    lastPublishAt: number | null;
    knownOffers: number;
    lastError?: string;
    updateIntervalMs: number;
    searchOptions: JobsSearchOptions;
}

const DEFAULT_SCOPE = 'api_offresdemploiv2 o2dsoffre';
const DEFAULT_SEARCH_LIMIT = 5;
const MAX_STORED_OFFERS = 200;

const formatDateForFranceTravail = (date: Date): string =>
    date.toISOString().replace(/\.\d{3}Z$/, 'Z');

export class FranceTravailClient {
    private token: string | null = null;
    private tokenExpiry = 0;

    constructor(
        private readonly clientId: string,
        private readonly clientSecret: string,
        private readonly scope: string = DEFAULT_SCOPE,
        private readonly authBaseUrl: string = 'https://entreprise.francetravail.fr',
        private readonly apiBaseUrl: string = 'https://api.francetravail.io'
    ) {}

    private async fetchAccessToken(): Promise<void> {
        const url = `${this.authBaseUrl}/connexion/oauth2/access_token?realm=/partenaire`;
        const payload = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: this.clientId,
            client_secret: this.clientSecret,
            scope: this.scope
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: payload.toString()
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`France Travail auth failed: ${response.status} ${text}`);
        }

        const data = await response.json() as FranceTravailAuthResponse;
        if (!data.access_token) {
            throw new Error('France Travail auth failed: missing access_token');
        }

        this.token = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60_000; // renew 1 min early
    }

    private async ensureToken(): Promise<string> {
        if (!this.token || Date.now() >= this.tokenExpiry) {
            await this.fetchAccessToken();
        }

        return this.token as string;
    }

    public async searchOffers(options: JobsSearchOptions): Promise<FranceTravailOffer[]> {
        const token = await this.ensureToken();
        const searchParams = new URLSearchParams();

        const limit = options.limit ?? DEFAULT_SEARCH_LIMIT;
        searchParams.set('range', `0-${Math.max(0, limit - 1)}`);

        if (options.keywords?.length) {
            searchParams.set('motsCles', options.keywords.join(' '));
        }

        if (options.departments?.length) {
            searchParams.set('departement', options.departments.join(','));
        }

        if (options.contractTypes?.length) {
            searchParams.set('typeContrat', options.contractTypes.join(','));
        }

        if (options.experienceLevels?.length) {
            searchParams.set('experience', options.experienceLevels.join(','));
        }

        if (typeof options.minPublishedHours === 'number') {
            const now = new Date();
            const minDate = new Date(now.getTime() - options.minPublishedHours * 3_600_000);
            searchParams.set('minCreationDate', formatDateForFranceTravail(minDate));
            searchParams.set('maxCreationDate', formatDateForFranceTravail(now));
        }

        const url = `${this.apiBaseUrl}/partenaire/offresdemploi/v2/offres/search?${searchParams.toString()}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (response.status === 204) {
            return [];
        }

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`France Travail search failed: ${response.status} ${text}`);
        }

        const data = await response.json() as FranceTravailSearchResponse;
        return Array.isArray(data.offres) ? data.offres : [];
    }
}

export class JobsManager {
    private franceTravailClient: FranceTravailClient | null = null;
    private searchOptions: JobsSearchOptions;
    private updateInterval: number;
    private timer: ReturnType<typeof setInterval> | null = null;
    private started = false;

    constructor(private readonly client: DiscordBot) {
        this.searchOptions = {
            keywords: process.env.FRANCE_TRAVAIL_KEYWORDS?.split(',').map((k) => k.trim()).filter(Boolean) ?? ['informatique', 'développeur'],
            departments: process.env.FRANCE_TRAVAIL_DEPARTMENTS?.split(',').map((d) => d.trim()).filter(Boolean) ?? ['59'],
            contractTypes: process.env.FRANCE_TRAVAIL_CONTRACTS?.split(',').map((c) => c.trim()).filter(Boolean) ?? ['CDI', 'CDD', 'MIS'],
            experienceLevels: process.env.FRANCE_TRAVAIL_EXPERIENCE?.split(',').map((e) => e.trim()).filter(Boolean) ?? undefined,
            limit: Number.parseInt(process.env.FRANCE_TRAVAIL_LIMIT || '', 10) || DEFAULT_SEARCH_LIMIT,
            minPublishedHours: (() => {
                const value = process.env.FRANCE_TRAVAIL_MIN_HOURS ? Number(process.env.FRANCE_TRAVAIL_MIN_HOURS) : NaN;
                return Number.isFinite(value) ? value : undefined;
            })()
        };

        const intervalMinutes = Number.parseInt(process.env.FRANCE_TRAVAIL_UPDATE_INTERVAL || '', 10);
        this.updateInterval = Number.isFinite(intervalMinutes) && intervalMinutes > 0 ? intervalMinutes * 60_000 : 60 * 60_000;

        const clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID;
        const clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;
        const scope = process.env.FRANCE_TRAVAIL_SCOPE || DEFAULT_SCOPE;

        if (clientId && clientSecret) {
            this.franceTravailClient = new FranceTravailClient(clientId, clientSecret, scope);
        } else {
            console.warn('⚠️ France Travail credentials are missing. Jobs manager will stay idle.');
        }
    }

    public start(): void {
        if (this.started) return;
        this.started = true;

        if (!this.franceTravailClient) {
            console.warn('⚠️ JobsManager cannot start without France Travail credentials.');
            return;
        }

        void this.refreshAllGuilds('startup');
        this.timer = setInterval(() => {
            void this.refreshAllGuilds('scheduled');
        }, this.updateInterval);
    }

    public stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.started = false;
    }

    public async refreshAllGuilds(reason: 'startup' | 'scheduled' | 'manual'): Promise<JobsRefreshResult[]> {
        const guilds = this.client.guilds.cache.map((guild) => guild.id as Snowflake);
        const results: JobsRefreshResult[] = [];

        for (const guildId of guilds) {
            try {
                const result = await this.refreshGuild(guildId, { reason });
                results.push(result);
            } catch (error) {
                console.error(`❌ Failed to refresh jobs for guild ${guildId}:`, error);
                results.push({
                    guildId,
                    fetched: 0,
                    published: 0,
                    skipped: 0,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }

        return results;
    }

    public async refreshGuild(guildId: Snowflake, context: { reason: 'startup' | 'scheduled' | 'manual' }): Promise<JobsRefreshResult> {
        if (!this.franceTravailClient) {
            return { guildId, fetched: 0, published: 0, skipped: 0, error: 'Missing France Travail credentials' };
        }

        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) {
            return { guildId, fetched: 0, published: 0, skipped: 0, error: 'Guild not found in cache' };
        }

        const setupData = this.client.database.get(`setup_${guildId}`) as { channels?: { jobs?: string } } | undefined;
        const channelId = setupData?.channels?.jobs as Snowflake | undefined;

        if (!channelId) {
            return { guildId, fetched: 0, published: 0, skipped: 0, error: 'Jobs channel not configured' };
        }

        let channel = guild.channels.cache.get(channelId);
        if (!channel) {
            try {
                channel = await guild.channels.fetch(channelId) ?? undefined;
            } catch (error) {
                console.error(`❌ Unable to fetch jobs channel ${channelId} for guild ${guildId}:`, error);
            }
        }

        if (!channel || !channel.isTextBased()) {
            return { guildId, fetched: 0, published: 0, skipped: 0, channelId, error: 'Jobs channel is missing or not text based' };
        }

        const store = this.ensureStore(guildId);
        let offers: FranceTravailOffer[] = [];

        try {
            offers = await this.franceTravailClient.searchOffers(this.searchOptions);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            store.lastError = message;
            store.lastFetchAt = Date.now();
            this.saveStore(guildId, store);
            return { guildId, fetched: 0, published: 0, skipped: 0, channelId, error: message };
        }

        const newOffers = offers
            .filter((offer) => !store.knownOfferIds.includes(offer.id))
            .slice(0, this.searchOptions.limit ?? DEFAULT_SEARCH_LIMIT)
            .sort((a, b) => {
                const dateA = a.dateCreation ? new Date(a.dateCreation).getTime() : 0;
                const dateB = b.dateCreation ? new Date(b.dateCreation).getTime() : 0;
                return dateA - dateB;
            });
        const skipped = offers.length - newOffers.length;

        if (newOffers.length === 0) {
            store.lastFetchAt = Date.now();
            store.lastError = undefined;
            this.saveStore(guildId, store);
            return { guildId, fetched: offers.length, published: 0, skipped, channelId };
        }

        const textChannel = channel.isThread() ? channel.parent : channel;
        if (!textChannel || !textChannel.isTextBased()) {
            return { guildId, fetched: offers.length, published: 0, skipped, channelId, error: 'Unable to resolve text channel' };
        }

        const guildTextChannel = this.ensureGuildTextChannel(textChannel);
        if (!guildTextChannel) {
            return { guildId, fetched: offers.length, published: 0, skipped, channelId, error: 'Jobs channel is not a guild text channel' };
        }

        await this.publishOffers(guildTextChannel, newOffers, context.reason);

        store.knownOfferIds = [...newOffers.map((offer) => offer.id), ...store.knownOfferIds].slice(0, MAX_STORED_OFFERS);
        store.lastFetchAt = Date.now();
        store.lastPublishAt = Date.now();
        store.lastError = undefined;
        this.saveStore(guildId, store);

        return { guildId, fetched: offers.length, published: newOffers.length, skipped, channelId };
    }

    public getStatus(guildId: Snowflake): JobsManagerStatus {
        const setupData = this.client.database.get(`setup_${guildId}`) as { channels?: { jobs?: string } } | undefined;
        const channelId = setupData?.channels?.jobs as Snowflake | undefined;
        const store = this.ensureStore(guildId);

        return {
            guildId,
            isConfigured: Boolean(channelId),
            hasCredentials: Boolean(this.franceTravailClient),
            channelId,
            lastFetchAt: store.lastFetchAt,
            lastPublishAt: store.lastPublishAt,
            knownOffers: store.knownOfferIds.length,
            lastError: store.lastError,
            updateIntervalMs: this.updateInterval,
            searchOptions: this.searchOptions
        };
    }

    private async publishOffers(channel: GuildTextBasedChannel, offers: FranceTravailOffer[], reason: string): Promise<void> {
        const embeds = offers.map((offer) => this.buildOfferEmbed(offer, reason));

        for (const chunk of this.chunkEmbeds(embeds, 10)) {
            await channel.send({ embeds: chunk });
        }
    }

    private ensureGuildTextChannel(channel: any): GuildTextBasedChannel | null {
        if (channel && typeof channel.isTextBased === 'function' && channel.isTextBased() && 'guild' in channel) {
            return channel as GuildTextBasedChannel;
        }
        return null;
    }

    private chunkEmbeds(embeds: EmbedBuilder[], size: number): EmbedBuilder[][] {
        const chunks: EmbedBuilder[][] = [];
        for (let i = 0; i < embeds.length; i += size) {
            chunks.push(embeds.slice(i, i + size));
        }
        return chunks;
    }

    private buildOfferEmbed(offer: FranceTravailOffer, reason: string): EmbedBuilder {
        const title = offer.intitule ?? 'Offre sans titre';
        const url = offer.origineOffre?.urlOrigine ?? offer.urlRecruteur ?? `https://candidat.francetravail.fr/offres/recherche/detail/${offer.id}`;
        const company = offer.entreprise?.nom ?? 'Entreprise non renseignée';
        const location = offer.lieuTravail?.libelle ?? offer.lieuTravail?.commune ?? 'Localisation non renseignée';
        const contract = offer.typeContrat ?? offer.natureContrat ?? 'Contrat non renseigné';
        const description = (offer.description ?? '').replace(/<[^>]+>/g, '');
        const trimmedDescription = description.length > 300 ? `${description.slice(0, 297)}...` : description;

        const createdAt = offer.dateCreation ? new Date(offer.dateCreation) : null;
        const updatedAt = offer.dateActualisation ? new Date(offer.dateActualisation) : null;

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setURL(url)
            .setColor(Colors.Blurple)
            .setDescription(trimmedDescription || 'Description non fournie par l\'offre')
            .addFields(
                { name: 'Entreprise', value: company, inline: true },
                { name: 'Localisation', value: location, inline: true },
                { name: 'Contrat', value: contract, inline: true }
            )
            .setFooter({ text: reason === 'manual' ? 'Actualisation manuelle' : 'Actualisation automatique' });

        if (offer.salaire?.libelle) {
            embed.addFields({ name: 'Salaire', value: offer.salaire.libelle, inline: true });
        }

        if (offer.dureeTravailLibelle) {
            embed.addFields({ name: 'Temps de travail', value: offer.dureeTravailLibelle, inline: true });
        }

        if (offer.experience?.libelle) {
            embed.addFields({ name: 'Expérience requise', value: offer.experience.libelle, inline: true });
        }

        if (offer.formations?.length) {
            const formations = offer.formations
                .map((formation) => [formation.domaineLibelle, formation.niveauLibelle].filter(Boolean).join(' - '))
                .filter(Boolean)
                .slice(0, 3);
            if (formations.length) {
                embed.addFields({ name: 'Formation', value: formations.join('\n'), inline: false });
            }
        }

        if (createdAt) {
            embed.addFields({ name: 'Publiée', value: time(createdAt, TimestampStyles.LongDateTime), inline: true });
        }

        if (updatedAt && (!createdAt || updatedAt.getTime() !== createdAt.getTime())) {
            embed.addFields({ name: 'Actualisée', value: time(updatedAt, TimestampStyles.ShortDateTime), inline: true });
        }

        embed.setTimestamp(createdAt ?? updatedAt ?? new Date());

        return embed;
    }

    private ensureStore(guildId: Snowflake): JobsFeedStore {
        const key = this.getStoreKey(guildId);
        const existing = this.client.database.get(key) as Partial<JobsFeedStore> | undefined;

        const store: JobsFeedStore = {
            knownOfferIds: existing?.knownOfferIds ?? [],
            lastFetchAt: existing?.lastFetchAt ?? null,
            lastPublishAt: existing?.lastPublishAt ?? null,
            lastError: existing?.lastError
        };

        this.client.database.set(key, store);
        return store;
    }

    private saveStore(guildId: Snowflake, store: JobsFeedStore): void {
        this.client.database.set(this.getStoreKey(guildId), store);
    }

    private getStoreKey(guildId: Snowflake): string {
        return `jobs_feed_${guildId}`;
    }
}
