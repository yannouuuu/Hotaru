import { ModalSubmitInteraction, EmbedBuilder } from 'discord.js';
import type { BotClient } from '../types/index.ts';
import { addVerifiedUser } from '../utils/database.ts';
import { logAction } from '../utils/logger.ts';
import { parseEmailToName } from '../utils/emailParser.ts';

export const handleVerifyModal = async (
  interaction: ModalSubmitInteraction,
  client: BotClient
): Promise<void> => {
  const email = interaction.fields.getTextInputValue('email_input').trim().toLowerCase();
  const universityDomain = process.env.UNIVERSITY_DOMAIN || 'univ-lille.fr';

  // Vérifier que l'email est valide
  const emailRegex = new RegExp(`^[a-zA-Z0-9._%+-]+@${universityDomain}$`);
  if (!emailRegex.test(email)) {
    await interaction.reply({
      content: `❌ L'email doit être au format \`prenom.nom@${universityDomain}\``,
      flags: 64,
    });
    return;
  }

  try {
    // Ajouter l'utilisateur à la base de données
    addVerifiedUser(interaction.user.id, email);

    // Attribuer les rôles
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    if (!member) {
      await interaction.reply({
        content: '❌ Erreur: Membre introuvable.',
        flags: 64,
      });
      return;
    }

    const verifiedRoleId = process.env.ROLE_VERIFIED_ID;
    const studentRoleId = process.env.ROLE_STUDENT_ID;

    const rolesToAdd: string[] = [];
    
    if (verifiedRoleId) {
      rolesToAdd.push(verifiedRoleId);
    }
    if (studentRoleId) {
      rolesToAdd.push(studentRoleId);
    }

    // Ajouter les deux rôles en une seule fois
    if (rolesToAdd.length > 0) {
      await member.roles.add(rolesToAdd);
    }

    // Extraire le nom depuis l'email et renommer l'utilisateur
    const parsedName = parseEmailToName(email);
    let nicknameUpdated = false;
    
    if (parsedName) {
      try {
        // Vérifier si le bot a les permissions nécessaires
        const botMember = await interaction.guild?.members.fetch(client.user!.id);
        if (botMember && botMember.permissions.has('ManageNicknames')) {
          // Vérifier si le bot est assez haut dans la hiérarchie
          if (botMember.roles.highest.position > member.roles.highest.position) {
            await member.setNickname(parsedName);
            nicknameUpdated = true;
          } else {
            console.log(`⚠️ Le rôle du bot est trop bas pour renommer ${member.user.tag}`);
          }
        } else {
          console.log('⚠️ Le bot n\'a pas la permission "Gérer les pseudos"');
        }
      } catch (error) {
        console.error('Erreur lors du renommage:', error);
      }
    }

    // Log l'action
    await logAction(
      client,
      'Vérification',
      interaction.user.tag,
      undefined,
      `Email: ${email}`,
      0x00b894,
      'bot'
    );

    const successEmbed = new EmbedBuilder()
      .setColor(0x00b894)
      .setTitle('✅ Vérification réussie !')
      .setDescription(
        `Bienvenue ${interaction.user} !\n\n` +
        `Ton compte a été vérifié avec succès avec l'email **${email}**.\n\n` +
        `🎓 **Rôles attribués** : Vérifié + Étudiant\n` +
        (nicknameUpdated ? `✏️ **Pseudo mis à jour** : ${parsedName}\n\n` : 
         parsedName ? `⚠️ **Pseudo suggéré** : ${parsedName} (renommage automatique impossible)\n\n` : '\n') +
        `Tu as maintenant accès à tous les salons du serveur ! 🎉\n\n` +
        `Le salon de vérification va disparaître de ta vue.`
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [successEmbed], flags: 64 });
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    await interaction.reply({
      content: '❌ Une erreur est survenue lors de la vérification.',
      flags: 64,
    });
  }
};

