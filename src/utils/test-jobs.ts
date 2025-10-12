import { FranceTravailClient } from './JobsManager.js';
import type { FranceTravailSearchOptions } from '../types/jobs.js';

async function main() {
    const clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID;
    const clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;
    const scope = (() => {
        const raw = process.env.FRANCE_TRAVAIL_SCOPE?.trim();
        if (raw && raw.length > 0) return raw;
        return clientId ? `api_offresdemploiv2 o2dsoffre application_${clientId}` : undefined;
    })();

    if (!clientId || !clientSecret) {
        console.error('Missing France Travail credentials in environment variables.');
        return;
    }

    const client = new FranceTravailClient(clientId, clientSecret, scope);

    const parseList = (value: string | undefined): string[] | undefined => {
        if (!value) return undefined;
        return value.split(',').map((item) => item.trim()).filter(Boolean);
    };

    const keywords = parseList(process.env.FRANCE_TRAVAIL_KEYWORDS) ?? ['informatique', 'développeur'];
    const departmentsRaw = parseList(process.env.FRANCE_TRAVAIL_DEPARTMENTS);
    let communes = parseList(process.env.FRANCE_TRAVAIL_COMMUNES);

    let departments = departmentsRaw ? [] as string[] : undefined;
    if (departmentsRaw) {
        const inferredCommunes: string[] = [];
        for (const entry of departmentsRaw) {
            if (/^\d{5}$/.test(entry)) {
                inferredCommunes.push(entry);
                continue;
            }
            departments!.push(entry);
        }

        if (inferredCommunes.length) {
            console.warn(`⚠️ FRANCE_TRAVAIL_DEPARTMENTS contient ${inferredCommunes.length} code(s) commune (INSEE). Ils ont été déplacés vers FRANCE_TRAVAIL_COMMUNES.`);
            communes = communes ? [...communes, ...inferredCommunes] : inferredCommunes;
        }

        if (departments && departments.length === 0) {
            departments = undefined;
        }
    }

    if (!departments) {
        departments = ['59'];
    }

    if (!communes || communes.length === 0) {
        communes = undefined;
    }
    const contracts = parseList(process.env.FRANCE_TRAVAIL_CONTRACTS) ?? ['CDI', 'CDD', 'MIS'];
    const experience = parseList(process.env.FRANCE_TRAVAIL_EXPERIENCE);
    const finalCommunes = communes;
    const limit = process.env.FRANCE_TRAVAIL_LIMIT ? Number.parseInt(process.env.FRANCE_TRAVAIL_LIMIT, 10) : 5;
    const minHours = process.env.FRANCE_TRAVAIL_MIN_HOURS ? Number.parseInt(process.env.FRANCE_TRAVAIL_MIN_HOURS, 10) : undefined;
    const radiusKm = process.env.FRANCE_TRAVAIL_RADIUS_KM ? Number.parseFloat(process.env.FRANCE_TRAVAIL_RADIUS_KM) : undefined;
    const includeAlternance = (() => {
        const raw = process.env.FRANCE_TRAVAIL_INCLUDE_ALTERNANCE;
        if (!raw) return false;
        return ['1', 'true', 'oui', 'yes'].includes(raw.trim().toLowerCase());
    })();

    const seen = new Set<string>();
    const aggregated: any[] = [];

    const attemptConfigs = [
        {
            label: 'Filtres configurés',
            config: { keywords, departments, contracts, experience, minHours, radius: radiusKm, communes: finalCommunes }
        },
        {
            label: 'Sans mots-clés',
            config: { keywords: undefined, departments, contracts, experience, minHours, radius: radiusKm, communes: finalCommunes }
        },
        {
            label: 'Rayon et durée élargis',
            config: {
                keywords: undefined,
                departments,
                contracts: undefined,
                experience: undefined,
                minHours: Math.max(minHours ?? 0, 336),
                radius: Math.max(radiusKm ?? 5, 15),
                communes: finalCommunes
            }
        },
        {
            label: 'Sans communes',
            config: {
                keywords: undefined,
                departments,
                contracts: undefined,
                experience: undefined,
                minHours: undefined,
                radius: undefined,
                communes: undefined
            }
        }
    ];

    for (const attempt of attemptConfigs) {
        seen.clear();
        aggregated.length = 0;

        const fetchForCommune = async (commune?: string) => {
            const requestOptions: FranceTravailSearchOptions = {
                keywords: attempt.config.keywords,
                departments: attempt.config.departments,
                contractTypes: attempt.config.contracts,
                experienceLevels: attempt.config.experience,
                limit,
                minPublishedHours: Number.isFinite(attempt.config.minHours ?? NaN) ? attempt.config.minHours : undefined,
                radiusKm: commune ? attempt.config.radius : undefined,
                includeAlternance,
                commune
            };

            if (commune) {
                delete requestOptions.departments;
            }

            const partial = await client.searchOffers(requestOptions);

            for (const offer of partial) {
                if (!offer?.id || seen.has(offer.id)) continue;
                seen.add(offer.id);
                aggregated.push(offer);
            }
        };

        const targetCommunes = attempt.config.communes;

        if (targetCommunes?.length) {
            for (const commune of targetCommunes) {
                await fetchForCommune(commune);
            }
        } else {
            await fetchForCommune();
        }

        const offers = aggregated
            .map((offer) => offer)
            .sort((a, b) => {
                const aDate = a.dateCreation ? new Date(a.dateCreation).getTime() : 0;
                const bDate = b.dateCreation ? new Date(b.dateCreation).getTime() : 0;
                return bDate - aDate;
            });

        console.log(`Attempt: ${attempt.label} → ${offers.length} offer(s)`);
        for (const offer of offers.slice(0, 3)) {
            console.log(`- [${offer.id}] ${offer.intitule ?? 'Sans titre'} (${offer.typeContrat ?? 'Contrat ?'})`);
        }
        if (offers.length === 0) {
            console.log('No offers for this attempt.');
        }
        console.log('----------');
    }
}

main().catch((error) => {
    console.error('Test jobs fetch failed:', error);
});
