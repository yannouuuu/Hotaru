/**
 * Gestionnaire pour poster les offres d'emploi dans Discord
 */

import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { JobsService } from '../services/jobsService.ts';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface JobOffer {
  id: string;
  intitule: string;
  description: string;
  lieuTravail: {
    libelle: string;
    codePostal?: string;
    commune?: string;
  };
  entreprise?: {
    nom?: string;
  };
  typeContrat: string;
  typeContratLibelle: string;
  dateCreation: string;
  salaire?: {
    libelle?: string;
  };
  dureeTravailLibelle?: string;
  alternance?: boolean;
  origineOffre: {
    urlOrigine?: string;
  };
}

interface PostedJobsCache {
  postedIds: string[];
  lastUpdate: string;
}

export class JobsManager {
  private client: Client;
  private jobsService: JobsService;
  private cacheFilePath: string;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(client: Client) {
    this.client = client;
    this.jobsService = new JobsService();
    
    // Chemin du fichier de cache
    const dataDir = join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    this.cacheFilePath = join(dataDir, 'posted-jobs.json');
  }

  /**
   * Charge les IDs des offres déjà postées
   */
  private loadPostedJobs(): Set<string> {
    try {
      if (existsSync(this.cacheFilePath)) {
        const data = readFileSync(this.cacheFilePath, 'utf-8');
        const cache: PostedJobsCache = JSON.parse(data);
        return new Set(cache.postedIds);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du cache des jobs:', error);
    }
    return new Set();
  }

  /**
   * Sauvegarde les IDs des offres postées
   */
  private savePostedJobs(postedIds: Set<string>): void {
    try {
      const cache: PostedJobsCache = {
        postedIds: Array.from(postedIds),
        lastUpdate: new Date().toISOString(),
      };
      writeFileSync(this.cacheFilePath, JSON.stringify(cache, null, 2));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du cache des jobs:', error);
    }
  }

  /**
   * Crée un embed pour une offre d'emploi
   */
  private createJobEmbed(job: JobOffer): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`💼 ${job.intitule}`)
      .setTimestamp(new Date(job.dateCreation));

    // Description (limitée à 300 caractères)
    if (job.description) {
      let description = job.description
        .replace(/<[^>]*>/g, '') // Supprimer les balises HTML
        .replace(/\n{3,}/g, '\n\n') // Limiter les sauts de ligne
        .trim();
      
      if (description.length > 300) {
        description = description.substring(0, 297) + '...';
      }
      embed.setDescription(description);
    }

    // Entreprise
    if (job.entreprise?.nom) {
      embed.addFields({ 
        name: '🏢 Entreprise', 
        value: job.entreprise.nom, 
        inline: true 
      });
    }

    // Localisation
    embed.addFields({ 
      name: '📍 Lieu', 
      value: job.lieuTravail.libelle, 
      inline: true 
    });

    // Type de contrat
    embed.addFields({ 
      name: '📝 Contrat', 
      value: job.typeContratLibelle, 
      inline: true 
    });

    // Durée de travail
    if (job.dureeTravailLibelle) {
      embed.addFields({ 
        name: '⏰ Durée', 
        value: job.dureeTravailLibelle, 
        inline: true 
      });
    }

    // Salaire
    if (job.salaire?.libelle) {
      embed.addFields({ 
        name: '💰 Salaire', 
        value: job.salaire.libelle, 
        inline: true 
      });
    }

    // Alternance
    if (job.alternance) {
      embed.addFields({ 
        name: '🎓 Type', 
        value: 'Alternance', 
        inline: true 
      });
    }

    // Lien vers l'offre
    if (job.origineOffre?.urlOrigine) {
      embed.setURL(job.origineOffre.urlOrigine);
      embed.setFooter({ 
        text: 'Cliquez sur le titre pour postuler • France Travail' 
      });
    } else {
      embed.setFooter({ 
        text: `ID: ${job.id} • France Travail` 
      });
    }

    return embed;
  }

  /**
   * Poste les nouvelles offres dans le canal jobs
   */
  async postNewJobs(): Promise<void> {
    const channelId = process.env.CHANNEL_JOBS_ID;
    
    if (!channelId) {
      console.log('⚠️ CHANNEL_JOBS_ID non configuré dans .env');
      return;
    }

    if (!this.jobsService.isConfigured()) {
      console.log('⚠️ API France Travail non configurée (manque CLIENT_ID ou CLIENT_SECRET)');
      return;
    }

    try {
      const channel = await this.client.channels.fetch(channelId);
      
      if (!channel || !(channel instanceof TextChannel)) {
        console.error('❌ Canal jobs introuvable ou invalide');
        return;
      }

      console.log('🔍 Recherche de nouvelles offres d\'emploi...');
      const jobs = await this.jobsService.searchStudentJobsLille();
      
      if (jobs.length === 0) {
        console.log('ℹ️ Aucune offre d\'emploi trouvée');
        return;
      }

      const postedIds = this.loadPostedJobs();
      const newJobs = jobs.filter(job => !postedIds.has(job.id));

      if (newJobs.length === 0) {
        console.log('ℹ️ Aucune nouvelle offre à poster');
        return;
      }

      console.log(`📤 Envoi de ${newJobs.length} nouvelle(s) offre(s)...`);

      for (const job of newJobs) {
        try {
          const embed = this.createJobEmbed(job);
          await channel.send({ embeds: [embed] });
          postedIds.add(job.id);
          
          // Attendre un peu entre chaque message pour éviter le rate limit
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Erreur lors de l'envoi de l'offre ${job.id}:`, error);
        }
      }

      // Sauvegarder les IDs postés (garder seulement les 1000 derniers)
      if (postedIds.size > 1000) {
        const idsArray = Array.from(postedIds);
        postedIds.clear();
        idsArray.slice(-1000).forEach(id => postedIds.add(id));
      }
      this.savePostedJobs(postedIds);

      console.log(`✅ ${newJobs.length} offre(s) postée(s) dans #jobs`);
    } catch (error) {
      console.error('❌ Erreur lors de la publication des offres:', error);
    }
  }

  /**
   * Initialise le système de mise à jour automatique
   * @param intervalHours - Intervalle en heures entre chaque vérification
   */
  startAutoUpdate(intervalHours: number = 6): void {
    if (this.updateInterval) {
      console.log('⚠️ Le système de mise à jour des jobs est déjà démarré');
      return;
    }

    if (!this.jobsService.isConfigured()) {
      console.log('⚠️ API France Travail non configurée. Mise à jour automatique désactivée.');
      return;
    }

    console.log(`🚀 Démarrage du système de mise à jour des jobs (toutes les ${intervalHours}h)`);

    // Première exécution après 1 minute
    setTimeout(() => {
      this.postNewJobs();
    }, 60000);

    // Puis exécution régulière
    const intervalMs = intervalHours * 60 * 60 * 1000;
    this.updateInterval = setInterval(() => {
      this.postNewJobs();
    }, intervalMs);
  }

  /**
   * Arrête le système de mise à jour automatique
   */
  stopAutoUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('⏸️ Système de mise à jour des jobs arrêté');
    }
  }
}
