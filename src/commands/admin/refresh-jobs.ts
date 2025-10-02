import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits 
} from 'discord.js';
import type { Command } from '../../types/index.ts';
import { JobsManager } from '../../utils/jobsManager.ts';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('refresh-jobs')
    .setDescription('Force la mise à jour des offres d\'emploi dans le canal #jobs')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const jobsManager = new JobsManager(interaction.client);
      
      if (!jobsManager['jobsService'].isConfigured()) {
        await interaction.editReply({
          content: '❌ L\'API France Travail n\'est pas configurée.\n\n' +
                   'Ajoutez ces variables dans votre fichier `.env` :\n' +
                   '```env\n' +
                   'FRANCE_TRAVAIL_CLIENT_ID=votre_client_id\n' +
                   'FRANCE_TRAVAIL_CLIENT_SECRET=votre_client_secret\n' +
                   'CHANNEL_JOBS_ID=id_du_canal_jobs\n' +
                   '```\n' +
                   'Pour obtenir vos identifiants, inscrivez-vous sur https://francetravail.io/',
        });
        return;
      }

      await interaction.editReply('🔄 Recherche de nouvelles offres d\'emploi en cours...');
      
      await jobsManager.postNewJobs();
      
      await interaction.editReply('✅ Mise à jour des offres d\'emploi terminée !');
    } catch (error) {
      console.error('Erreur lors du refresh des jobs:', error);
      await interaction.editReply('❌ Une erreur est survenue lors de la mise à jour des offres.');
    }
  },
};

export default command;
