import { ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextChannel } from 'discord.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Charger la configuration des messages
const loadPanelConfig = (): any => {
  const configPath = join(process.cwd(), 'data', 'panel-config.json');
  if (existsSync(configPath)) {
    return JSON.parse(readFileSync(configPath, 'utf-8'));
  }
  return {};
};

// Rafraîchir le message de support
const refreshSupport = async (interaction: ButtonInteraction) => {
  const config = loadPanelConfig();
  const supportConfig = config.support;
  
  if (!supportConfig?.channelId) {
    await interaction.reply({ content: '❌ Configuration introuvable.', ephemeral: true });
    return;
  }

  try {
    const channel = await interaction.client.channels.fetch(supportConfig.channelId) as TextChannel;
    
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('🎟️ Support - Système de tickets')
      .setDescription(
        '**Besoin d\'aide ou d\'assistance ?**\n\n' +
        'Cliquez sur le bouton ci-dessous pour ouvrir un ticket.\n' +
        'Un salon privé sera créé où vous pourrez discuter avec l\'équipe de support (délégués, support, admins).\n\n' +
        `⚠️ **Pour les questions sur les devoirs, utilisez le salon d\'entraide**`
      )
      .setFooter({ text: 'Un membre du support vous répondra dès que possible' })
      .setTimestamp();

    const button = new ButtonBuilder()
      .setCustomId('create_ticket')
      .setLabel('Ouvrir un ticket')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🎟️');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    // Supprimer l'ancien message et créer un nouveau
    if (supportConfig.messageId) {
      try {
        const oldMessage = await channel.messages.fetch(supportConfig.messageId);
        await oldMessage.delete();
      } catch (error) {
        console.log('Message précédent introuvable, création d\'un nouveau');
      }
    }

    const newMessage = await channel.send({ embeds: [embed], components: [row] });
    
    // Mettre à jour la config
    config.support.messageId = newMessage.id;
    writeFileSync(join(process.cwd(), 'data', 'panel-config.json'), JSON.stringify(config, null, 2));

    await interaction.reply({ content: '✅ Message de support rafraîchi !', ephemeral: true });
  } catch (error) {
    console.error('Erreur:', error);
    await interaction.reply({ content: '❌ Erreur lors du rafraîchissement.', ephemeral: true });
  }
};

// Rafraîchir le message des liens
const refreshLinks = async (interaction: ButtonInteraction) => {
  const config = loadPanelConfig();
  const linksConfig = config.links;
  
  if (!linksConfig?.channelId) {
    await interaction.reply({ content: '❌ Configuration introuvable.', ephemeral: true });
    return;
  }

  try {
    const channel = await interaction.client.channels.fetch(linksConfig.channelId) as TextChannel;
    
    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('🔗 Liens Utiles - Université de Lille')
      .setDescription(
        '**Tous les liens importants pour votre parcours au BUT Informatique**\n\n' +
        'Utilisez le menu ci-dessous pour accéder rapidement aux différentes sections.'
      )
      .setFooter({ text: '💡 Ajoutez ces liens à vos favoris !' })
      .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('links_menu')
      .setPlaceholder('📚 Sélectionnez une catégorie')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('📅 Emploi du temps & Notes')
          .setDescription('EDT et bulletin de notes')
          .setValue('edt_notes')
          .setEmoji('📅'),
        new StringSelectMenuOptionBuilder()
          .setLabel('📧 Communication')
          .setDescription('Zimbra, Moodle, ENT')
          .setValue('communication')
          .setEmoji('📧'),
        new StringSelectMenuOptionBuilder()
          .setLabel('🎯 Vie étudiante')
          .setDescription('Sport, aide, tutorat')
          .setValue('vie_etudiante')
          .setEmoji('🎯'),
        new StringSelectMenuOptionBuilder()
          .setLabel('📞 Contacts')
          .setDescription('Contacts du département')
          .setValue('contacts')
          .setEmoji('📞'),
        new StringSelectMenuOptionBuilder()
          .setLabel('🔗 Tous les liens')
          .setDescription('Afficher tous les liens en une fois')
          .setValue('all_links')
          .setEmoji('🔗')
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    // Supprimer et recréer
    if (linksConfig.messageId) {
      try {
        const oldMessage = await channel.messages.fetch(linksConfig.messageId);
        await oldMessage.delete();
      } catch (error) {
        console.log('Message précédent introuvable');
      }
    }

    const newMessage = await channel.send({ embeds: [embed], components: [row] });
    
    config.links.messageId = newMessage.id;
    writeFileSync(join(process.cwd(), 'data', 'panel-config.json'), JSON.stringify(config, null, 2));

    await interaction.reply({ content: '✅ Message des liens rafraîchi !', ephemeral: true });
  } catch (error) {
    console.error('Erreur:', error);
    await interaction.reply({ content: '❌ Erreur lors du rafraîchissement.', ephemeral: true });
  }
};

// Rafraîchir le message de vérification
const refreshVerify = async (interaction: ButtonInteraction) => {
  const config = loadPanelConfig();
  const verifyConfig = config.verify;
  
  if (!verifyConfig?.channelId) {
    await interaction.reply({ content: '❌ Configuration introuvable.', ephemeral: true });
    return;
  }

  try {
    const channel = await interaction.client.channels.fetch(verifyConfig.channelId) as TextChannel;
    const roleVerifiedId = process.env.ROLE_VERIFIED_ID;
    
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('✅ Vérification')
      .setDescription(
        '**Pour accéder au serveur, vous devez vérifier que vous êtes bien étudiant à l\'Université de Lille.**\n\n' +
        '📧 Utilisez la commande `/verify` avec votre email universitaire (@univ-lille.fr)\n\n' +
        (roleVerifiedId ? `Une fois vérifié, vous obtiendrez le rôle <@&${roleVerifiedId}> et aurez accès à tous les salons !` : 'Une fois vérifié, vous aurez accès à tous les salons !')
      );

    // Supprimer et recréer
    if (verifyConfig.messageId) {
      try {
        const oldMessage = await channel.messages.fetch(verifyConfig.messageId);
        await oldMessage.delete();
      } catch (error) {
        console.log('Message précédent introuvable');
      }
    }

    const newMessage = await channel.send({ embeds: [embed] });
    
    config.verify.messageId = newMessage.id;
    writeFileSync(join(process.cwd(), 'data', 'panel-config.json'), JSON.stringify(config, null, 2));

    await interaction.reply({ content: '✅ Message de vérification rafraîchi !', ephemeral: true });
  } catch (error) {
    console.error('Erreur:', error);
    await interaction.reply({ content: '❌ Erreur lors du rafraîchissement.', ephemeral: true });
  }
};

// Rafraîchir le message des rôles
const refreshRoles = async (interaction: ButtonInteraction) => {
  const config = loadPanelConfig();
  const rolesConfig = config.roles;
  
  if (!rolesConfig?.channelId) {
    await interaction.reply({ content: '❌ Configuration introuvable.', ephemeral: true });
    return;
  }

  try {
    const channel = await interaction.client.channels.fetch(rolesConfig.channelId) as TextChannel;
    
    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('🎭 Sélection des rôles')
      .setDescription(
        '**Choisissez vos rôles en cliquant sur les boutons ci-dessous :**\n\n' +
        '📋 **Délégué** - Si vous êtes délégué de votre groupe\n' +
        '_(Vous obtiendrez des permissions de modération)_'
      )
      .setFooter({ text: 'Cliquez pour ajouter ou retirer un rôle' })
      .setTimestamp();

    const button = new ButtonBuilder()
      .setCustomId('toggle_delegue')
      .setLabel('Délégué')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📋');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    // Supprimer et recréer
    if (rolesConfig.messageId) {
      try {
        const oldMessage = await channel.messages.fetch(rolesConfig.messageId);
        await oldMessage.delete();
      } catch (error) {
        console.log('Message précédent introuvable');
      }
    }

    const newMessage = await channel.send({ embeds: [embed], components: [row] });
    
    config.roles.messageId = newMessage.id;
    writeFileSync(join(process.cwd(), 'data', 'panel-config.json'), JSON.stringify(config, null, 2));

    await interaction.reply({ content: '✅ Message des rôles rafraîchi !', ephemeral: true });
  } catch (error) {
    console.error('Erreur:', error);
    await interaction.reply({ content: '❌ Erreur lors du rafraîchissement.', ephemeral: true });
  }
};

// Git pull
const handleGitPull = async (interaction: ButtonInteraction) => {
  await interaction.deferReply({ ephemeral: true });

  try {
    const { stdout, stderr } = await execAsync('git pull');
    
    const embed = new EmbedBuilder()
      .setColor(0x00b894)
      .setTitle('🔄 Git Pull')
      .setDescription('**Résultat de la commande `git pull` :**')
      .addFields(
        { name: 'Sortie', value: `\`\`\`\n${stdout || 'Aucune sortie'}\n\`\`\``, inline: false }
      )
      .setTimestamp();

    if (stderr) {
      embed.addFields({ name: 'Erreurs', value: `\`\`\`\n${stderr}\n\`\`\``, inline: false });
    }

    await interaction.editReply({ embeds: [embed] });
    
    if (stdout.includes('Already up to date')) {
      await interaction.followUp({ 
        content: '✅ Le code est déjà à jour. Aucun redémarrage nécessaire.', 
        ephemeral: true 
      });
    } else {
      await interaction.followUp({ 
        content: '✅ Code mis à jour ! Pensez à redémarrer le bot pour appliquer les changements.', 
        ephemeral: true 
      });
    }
  } catch (error) {
    console.error('Erreur git pull:', error);
    await interaction.editReply({ 
      content: `❌ Erreur lors du git pull.\n\`\`\`\n${error}\n\`\`\``,
    });
  }
};

// Handler principal
export const handlePanelActions = async (interaction: ButtonInteraction): Promise<void> => {
  const { customId } = interaction;

  // Vérifier que l'utilisateur est admin
  const member = interaction.guild?.members.cache.get(interaction.user.id);
  const isAdmin = member?.permissions.has('Administrator') || 
                  member?.roles.cache.has(process.env.ROLE_ADMIN_ID || '');

  if (!isAdmin) {
    await interaction.reply({ 
      content: '❌ Vous devez être administrateur pour utiliser ce panel.', 
      ephemeral: true 
    });
    return;
  }

  switch (customId) {
    case 'refresh_support':
      await refreshSupport(interaction);
      break;
    case 'refresh_links':
      await refreshLinks(interaction);
      break;
    case 'refresh_verify':
      await refreshVerify(interaction);
      break;
    case 'refresh_roles':
      await refreshRoles(interaction);
      break;
    case 'git_pull':
      await handleGitPull(interaction);
      break;
    default:
      await interaction.reply({ content: '❌ Action inconnue', ephemeral: true });
  }
};

