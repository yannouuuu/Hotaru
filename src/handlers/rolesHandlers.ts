import { ButtonInteraction } from 'discord.js';

export const handleRoleToggle = async (interaction: ButtonInteraction): Promise<void> => {
  await interaction.deferReply({ ephemeral: true });

  const { customId } = interaction;
  const member = interaction.guild?.members.cache.get(interaction.user.id);

  if (!member) {
    await interaction.editReply({ content: '❌ Erreur: membre introuvable.' });
    return;
  }

  try {
    if (customId === 'toggle_delegue') {
      const delegueRoleId = process.env.ROLE_DELEGUE_ID;
      
      if (!delegueRoleId) {
        await interaction.editReply({ 
          content: '❌ Le rôle délégué n\'est pas configuré. Vérifiez votre .env' 
        });
        return;
      }

      // Vérifier si le membre a déjà le rôle
      const hasRole = member.roles.cache.has(delegueRoleId);

      if (hasRole) {
        // Retirer le rôle
        await member.roles.remove(delegueRoleId);
        await interaction.editReply({ 
          content: '✅ Le rôle **📋 Délégué** vous a été retiré.' 
        });
      } else {
        // Ajouter le rôle
        await member.roles.add(delegueRoleId);
        await interaction.editReply({ 
          content: '✅ Le rôle **📋 Délégué** vous a été attribué !\n\nVous avez maintenant accès aux permissions de modération.' 
        });
      }
    } else if (customId === 'toggle_jobs') {
      const jobsRoleId = process.env.ROLE_JOBS_ID;
      
      if (!jobsRoleId) {
        await interaction.editReply({ 
          content: '❌ Le rôle Jobs n\'est pas configuré. Vérifiez votre .env' 
        });
        return;
      }

      // Vérifier si le membre a déjà le rôle
      const hasRole = member.roles.cache.has(jobsRoleId);

      if (hasRole) {
        await member.roles.remove(jobsRoleId);
        await interaction.editReply({ 
          content: '✅ Le rôle **💼 Jobs** vous a été retiré.\n\nVous n\'avez plus accès au salon des offres d\'emploi.' 
        });
      } else {
        await member.roles.add(jobsRoleId);
        await interaction.editReply({ 
          content: '✅ Le rôle **💼 Jobs** vous a été attribué !\n\nVous avez maintenant accès au salon #jobs avec les offres d\'emploi étudiants de la région lilloise.' 
        });
      }
    }
  } catch (error) {
    console.error('Erreur lors de la gestion du rôle:', error);
    await interaction.editReply({ 
      content: '❌ Une erreur est survenue lors de la gestion du rôle.' 
    });
  }
};

