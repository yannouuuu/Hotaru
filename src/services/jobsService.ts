/**
 * Service pour récupérer les offres d'emploi depuis l'API France Travail
 * Documentation: https://francetravail.io/data/api/offres-emploi
 */

import axios, { AxiosInstance } from 'axios';

interface FranceTravailAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface JobOffer {
  id: string;
  intitule: string;
  description: string;
  lieuTravail: {
    libelle: string;
    latitude?: number;
    longitude?: number;
    codePostal?: string;
    commune?: string;
  };
  entreprise?: {
    nom?: string;
    description?: string;
  };
  typeContrat: string;
  typeContratLibelle: string;
  natureContrat?: string;
  experienceExige?: string;
  experienceLibelle?: string;
  dateCreation: string;
  salaire?: {
    libelle?: string;
    commentaire?: string;
  };
  dureeTravailLibelle?: string;
  alternance?: boolean;
  contact?: {
    nom?: string;
    coordonnees1?: string;
    coordonnees2?: string;
    coordonnees3?: string;
  };
  agence?: {
    telephone?: string;
  };
  origineOffre: {
    urlOrigine?: string;
  };
}

interface SearchResponse {
  resultats: JobOffer[];
  filtresPossibles?: any;
}

export class JobsService {
  private apiClient: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiration: number = 0;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseURL = 'https://api.francetravail.io/partenaire';
  private readonly authURL = 'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire';

  constructor() {
    this.clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID || '';
    this.clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET || '';

    if (!this.clientId || !this.clientSecret) {
      console.warn('⚠️ Les identifiants France Travail ne sont pas configurés. Les offres d\'emploi ne seront pas disponibles.');
    }

    this.apiClient = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Authentification OAuth2 auprès de France Travail
   */
  private async authenticate(): Promise<void> {
    if (this.accessToken && Date.now() < this.tokenExpiration) {
      return; // Token encore valide
    }

    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', this.clientId);
      params.append('client_secret', this.clientSecret);
      params.append('scope', `api_offresdemploiv2 o2dsoffre application_${this.clientId}`);

      const response = await axios.post<FranceTravailAuthResponse>(
        this.authURL,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiration = Date.now() + (response.data.expires_in * 1000) - 60000; // -1 min de sécurité
      
      console.log('✅ Authentification France Travail réussie');
    } catch (error) {
      console.error('❌ Erreur lors de l\'authentification France Travail:', error);
      throw error;
    }
  }

  /**
   * Recherche des offres d'emploi pour étudiants à Lille et environs
   */
  async searchStudentJobsLille(): Promise<JobOffer[]> {
    if (!this.clientId || !this.clientSecret) {
      console.warn('⚠️ API France Travail non configurée');
      return [];
    }

    try {
      await this.authenticate();

      // Communes de la métropole lilloise
      const communes = [
        '59350', // Lille (inclut Wazemmes et Triolo)
        '59491', // Villeneuve-d'Ascq
        '59606', // Tourcoing
        '59343', // Lesquin
      ];

      const allOffers: JobOffer[] = [];
      const seenIds = new Set<string>();

      // Recherche pour chaque commune
      for (const commune of communes) {
        try {
          const response = await this.apiClient.get<SearchResponse>('/offresdemploi/v2/offres/search', {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
            },
            params: {
              commune: commune,
              distance: 5,
              range: '0-19',
            },
          });

          if (response.data.resultats) {
            // Filtrer les offres déjà vues et celles pertinentes pour étudiants
            const filteredOffers = response.data.resultats.filter((offer: JobOffer) => {
              if (seenIds.has(offer.id)) return false;
              seenIds.add(offer.id);

              // Vérifier si c'est adapté pour étudiants
              const title = offer.intitule.toLowerCase();
              const desc = offer.description?.toLowerCase() || '';
              const contract = offer.typeContratLibelle?.toLowerCase() || '';
              
              const isStudentFriendly = 
                // Mots-clés directs
                title.includes('étudiant') ||
                desc.includes('étudiant') ||
                desc.includes('job étudiant') ||
                // Temps partiel
                title.includes('temps partiel') ||
                offer.dureeTravailLibelle?.includes('Temps partiel') ||
                // Horaires flexibles
                title.includes('weekend') ||
                title.includes('soir') ||
                title.includes('soirée') ||
                desc.includes('horaires flexibles') ||
                desc.includes('flexible') ||
                // Alternance
                offer.alternance === true ||
                title.includes('alternance') ||
                // Contrats courts
                contract.includes('cdd') && desc.includes('courte durée');

              return isStudentFriendly;
            });

            allOffers.push(...filteredOffers);
          }

          // Respecter le rate limit (10 requêtes/seconde)
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error: any) {
          if (error.response?.status !== 204) { // 204 = pas de résultats
            console.error(`Erreur recherche commune ${commune}:`, error.message);
          }
        }
      }

      // Trier par date de création (plus récent d'abord)
      allOffers.sort((a, b) => 
        new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
      );

      console.log(`✅ ${allOffers.length} offres d'emploi trouvées pour étudiants à Lille`);
      return allOffers.slice(0, 20); // Limiter à 20 offres max
    } catch (error) {
      console.error('❌ Erreur lors de la recherche d\'offres:', error);
      return [];
    }
  }

  /**
   * Vérifie si l'API est configurée
   */
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }
}
