import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Guild,
  GuildChannelCreateOptions,
  TextChannel,
  ForumChannel,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from 'discord.js';
import type { GuildBasedChannel, ThreadChannel } from 'discord.js';
import type { Command } from '../../types/index.ts';
import { universityData } from '../../utils/universityData.ts';

type NonThreadGuildChannel = Exclude<GuildBasedChannel, ThreadChannel>;

/**
 * Fonction utilitaire pour créer ou réutiliser un salon existant
 * @param guild Le serveur Discord
 * @param options Les options de création du salon
 * @returns Le salon créé ou réutilisé
 */
async function createOrReuseChannel(guild: Guild, options: GuildChannelCreateOptions): Promise<NonThreadGuildChannel> {
  // Recherche d'un salon existant avec le même nom (emoji inclus)
  const existingChannel = guild.channels.cache.find(
    (channel): channel is NonThreadGuildChannel => channel.name === options.name && 
    !channel.isThread() &&
    (options.parent ? channel.parentId === options.parent : true)
  );

  if (existingChannel) {
    console.log(`Réutilisation du salon existant: ${existingChannel.name}`);
    
    // Création d'un objet avec uniquement les propriétés compatibles avec edit
    const editOptions = {
      topic: options.topic,
      nsfw: options.nsfw,
      bitrate: options.bitrate,
      userLimit: options.userLimit,
      rateLimitPerUser: options.rateLimitPerUser,
      permissionOverwrites: options.permissionOverwrites
    };
    
    // Mise à jour des paramètres compatibles
    await existingChannel.edit(editOptions);
    
    // Si le salon a un parent différent, on le déplace
    if (options.parent && existingChannel.parentId !== options.parent) {
      await existingChannel.setParent(options.parent);
    }
    
    return existingChannel;
  }
  
  // Si aucun salon existant n'est trouvé, on en crée un nouveau
  return await guild.channels.create({
    name: options.name,
    type: options.type,
    topic: options.topic,
    nsfw: options.nsfw,
    bitrate: options.bitrate,
    userLimit: options.userLimit,
    parent: options.parent,
    permissionOverwrites: options.permissionOverwrites,
    position: options.position,
    rateLimitPerUser: options.rateLimitPerUser,
    rtcRegion: options.rtcRegion
  }) as NonThreadGuildChannel;
}

// Fonction pour afficher un message de log sur la réutilisation ou création de salon
function logChannelAction(channelName: string, isReused: boolean) {
  return isReused 
    ? `✅ Salon existant réutilisé: ${channelName}`
    : `➕ Nouveau salon créé: ${channelName}`;
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configurer automatiquement le serveur Discord pour le BUT Info')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const guild = interaction.guild;
      if (!guild) {
        await interaction.editReply('❌ Erreur: serveur introuvable.');
        return;
      }

      await interaction.editReply('⏳ Configuration du serveur en cours...\n\n**Étape 1/7** : Création des rôles...');

      // ========== CRÉATION DES RÔLES ==========
      const roleBot = await guild.roles.create({
        name: '🤖 Hotaru',
        color: 0x7289da,
        permissions: [],
        hoist: true, 
        mentionable: false,
      });

      try {
        await (await guild.members.fetch(interaction.client.user.id)).roles.add(roleBot);
      } catch (error) {
        console.error('Erreur lors de l\'attribution du rôle Bot au bot:', error);
      }

      const roleAdmin = await guild.roles.create({
        name: '👑 Admin',
        color: 0xe74c3c,
        permissions: [PermissionFlagsBits.Administrator],
        hoist: true,
        mentionable: true,
      });

      const roleDelegue = await guild.roles.create({
        name: '📋 Délégué',
        color: 0xf39c12,
        permissions: [
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.ModerateMembers,
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
        ],
        hoist: true,
        mentionable: true,
      });

      const roleSupport = await guild.roles.create({
        name: '🎯 Support',
        color: 0x3498db,
        permissions: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageMessages,
        ],
        hoist: true,
        mentionable: true,
      });
      
      const roleStudent = await guild.roles.create({
        name: '🎓 Étudiant',
        color: 0x9b59b6,
        permissions: [],
        hoist: true,
        mentionable: false,
      });

      const roleVerified = await guild.roles.create({
        name: '✅ Vérifié',
        color: 0x00b894,
        permissions: [],
        hoist: false,
        mentionable: false,
      });

      const roleJobs = await guild.roles.create({
        name: '💼 Jobs',
        color: 0x2ecc71,
        permissions: [],
        hoist: false,
        mentionable: false,
      });

      await interaction.editReply('⏳ Configuration du serveur en cours...\n\n**Étape 2/7** : Création des catégories...');

      // ========== CRÉATION DES CATÉGORIES ==========
      
      // 🛠️ SYSTÈME
      const categorySystem = await createOrReuseChannel(guild, {
        name: '🛠️ SYSTÈME',
        type: ChannelType.GuildCategory,
      });

      // 💬 DISCUSSIONS
      const categoryDiscussions = await createOrReuseChannel(guild, {
        name: '💬 DISCUSSIONS',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: roleVerified.id,
            allow: [PermissionFlagsBits.ViewChannel],
          },
        ],
      });

      // 🔊 SALONS VOCAUX
      const categoryVoice = await createOrReuseChannel(guild, {
        name: '🔊 SALONS VOCAUX',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: roleVerified.id,
            allow: [PermissionFlagsBits.ViewChannel],
          },
        ],
      });

      // 📚 COURS & ENTRAIDE
      const categoryCours = await createOrReuseChannel(guild, {
        name: '📚 COURS & ENTRAIDE',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: roleVerified.id,
            allow: [PermissionFlagsBits.ViewChannel],
          },
        ],
      });

      // 🎟️ SUPPORT
      const categorySupport = await createOrReuseChannel(guild, {
        name: '🎟️ SUPPORT',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
        ],
      });

      // 🛡️ MODÉRATION
      const categoryModeration = await createOrReuseChannel(guild, {
        name: '🛡️ MODÉRATION',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: roleAdmin.id,
            allow: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: roleDelegue.id,
            allow: [PermissionFlagsBits.ViewChannel],
          },
        ],
      });

      await interaction.editReply('⏳ Configuration du serveur en cours...\n\n**Étape 3/7** : Création des salons système...');

      // ========== 🛠️ SYSTÈME ==========
      const channelWelcome = await createOrReuseChannel(guild, {
        name: '👋┃bienvenue',
        type: ChannelType.GuildText,
        parent: categorySystem.id,
        permissionOverwrites: [
          {
            id: guild.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [PermissionFlagsBits.SendMessages],
          },
        ],
      }) as TextChannel;

      const channelVerify = await createOrReuseChannel(guild, {
        name: '✅┃vérification',
        type: ChannelType.GuildText,
        parent: categorySystem.id,
        permissionOverwrites: [
          {
            id: guild.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [PermissionFlagsBits.SendMessages],
          },
          {
            id: roleVerified.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
        ],
        topic: 'Vérifiez votre statut d\'étudiant avec /verify',
      }) as TextChannel;

      const channelRules = await createOrReuseChannel(guild, {
        name: '📜┃règlement',
        type: ChannelType.GuildText,
        parent: categorySystem.id,
        permissionOverwrites: [
          {
            id: guild.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [PermissionFlagsBits.SendMessages],
          },
        ],
      }) as TextChannel;

      const channelAnnouncements = await createOrReuseChannel(guild, {
        name: '📢┃annonces',
        type: ChannelType.GuildText,
        parent: categorySystem.id,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: roleVerified.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [PermissionFlagsBits.SendMessages],
          },
          {
            id: roleAdmin.id,
            allow: [PermissionFlagsBits.SendMessages],
          },
        ],
        topic: 'Annonces importantes',
      }) as TextChannel;

      const channelRoles = await createOrReuseChannel(guild, {
        name: '🎭┃rôles',
        type: ChannelType.GuildText,
        parent: categorySystem.id,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: roleVerified.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [PermissionFlagsBits.SendMessages],
          },
        ],
        topic: 'Réagissez pour obtenir vos rôles',
      }) as TextChannel;

      const channelInformations = await createOrReuseChannel(guild, {
        name: 'ℹ️┃informations',
        type: ChannelType.GuildText,
        parent: categorySystem.id,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: roleVerified.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [PermissionFlagsBits.SendMessages],
          },
        ],
        topic: 'Informations importantes, liens utiles et ressources de l\'université',
      }) as TextChannel;

      await interaction.editReply('⏳ Configuration du serveur en cours...\n\n**Étape 4/7** : Création des salons de discussion...');

      // ========== 💬 DISCUSSIONS ==========
      const channelGeneral = await createOrReuseChannel(guild, {
        name: '💬┃général',
        type: ChannelType.GuildText,
        parent: categoryDiscussions.id,
        topic: 'Discussion générale',
      }) as TextChannel;

      const channelGossip = await createOrReuseChannel(guild, {
        name: '☕┃gossip',
        type: ChannelType.GuildText,
        parent: categoryDiscussions.id,
        topic: 'Les potins du BUT Info',
      }) as TextChannel;

      const channelPictures = await createOrReuseChannel(guild, {
        name: '🖼️┃pictures',
        type: ChannelType.GuildText,
        parent: categoryDiscussions.id,
        permissionOverwrites: [
          {
            id: roleBot.id,
            allow: [PermissionFlagsBits.ManageMessages],
          },
        ],
        topic: 'Partagez vos photos ! Un thread sera automatiquement créé',
      }) as TextChannel;

      const channelQuotes = await createOrReuseChannel(guild, {
        name: '📖┃citations-profs',
        type: ChannelType.GuildText,
        parent: categoryDiscussions.id,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: roleVerified.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [PermissionFlagsBits.SendMessages],
          },
        ],
        topic: 'Les meilleures citations de nos profs ! Utilisez /quote pour en ajouter',
      }) as TextChannel;

      const channelBotCommands = await createOrReuseChannel(guild, {
        name: '🤖┃commandes',
        type: ChannelType.GuildText,
        parent: categoryDiscussions.id,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: roleVerified.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
          },
        ],
        topic: 'Utilisez les commandes du bot ici pour éviter de polluer les autres salons',
      }) as TextChannel;

      const channelPolls = await createOrReuseChannel(guild, {
        name: '📊┃sondages',
        type: ChannelType.GuildText,
        parent: categoryDiscussions.id,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: roleVerified.id,
            allow: [
              PermissionFlagsBits.ViewChannel, 
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.CreatePublicThreads,
              PermissionFlagsBits.SendMessagesInThreads
            ],
            deny: [PermissionFlagsBits.SendMessages],
          },
          {
            id: roleAdmin.id,
            allow: [PermissionFlagsBits.SendMessages],
          },
        ],
        topic: '📊 Créez des sondages ici ! Seuls les sondages sont autorisés. Un thread de discussion s\'ouvrira automatiquement.',
      }) as TextChannel;

      const channelMemes = await createOrReuseChannel(guild, {
        name: '😂┃memes',
        type: ChannelType.GuildText,
        parent: categoryDiscussions.id,
        topic: 'Partagez vos memes et délires ! 🤣',
      }) as TextChannel;

      const channelLinks = await createOrReuseChannel(guild, {
        name: '🔗┃liens-utiles',
        type: ChannelType.GuildText,
        parent: categoryDiscussions.id,
        permissionOverwrites: [
          {
            id: roleBot.id,
            allow: [PermissionFlagsBits.ManageMessages],
          },
        ],
        topic: 'Partagez vos liens utiles et découvertes !',
      }) as TextChannel;

      const channelJobs = await createOrReuseChannel(guild, {
        name: '💼┃jobs',
        type: ChannelType.GuildText,
        parent: categoryDiscussions.id,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: roleJobs.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [PermissionFlagsBits.SendMessages],
          },
        ],
        topic: '💼 Offres d\'emploi étudiants à Lille - Mis à jour automatiquement',
      }) as TextChannel;

      await interaction.editReply('⏳ Configuration du serveur en cours...\n\n**Étape 5/7** : Création des salons vocaux...');

      // ========== 🔊 SALONS VOCAUX ==========
      const voiceChannel1 = await createOrReuseChannel(guild, {
        name: '🎙️┃Vocal 1',
        type: ChannelType.GuildVoice,
        parent: categoryVoice.id,
      });

      const voiceChannel2 = await createOrReuseChannel(guild, {
        name: '🎙️┃Vocal 2',
        type: ChannelType.GuildVoice,
        parent: categoryVoice.id,
      });

      const voiceChannel3 = await createOrReuseChannel(guild, {
        name: '🎙️┃Vocal 3',
        type: ChannelType.GuildVoice,
        parent: categoryVoice.id,
      });

      const voiceAmphi = await createOrReuseChannel(guild, {
        name: '🏛️┃Amphi',
        type: ChannelType.GuildVoice,
        parent: categoryVoice.id,
        userLimit: 50,
      });
      
      await interaction.editReply('⏳ Configuration du serveur en cours...\n\n**Étape 6/7** : Création des salons de cours...');

      // ========== 📚 COURS & ENTRAIDE ==========
      const channelAideDevoirs = await createOrReuseChannel(guild, {
        name: '📝┃aide-devoirs',
        type: ChannelType.GuildForum,
        parent: categoryCours.id,
        topic: 'Besoin d\'aide sur un devoir ? Demandez ici !',
      }) as ForumChannel;

      const channelSAE = await createOrReuseChannel(guild, {
        name: '🎯┃sae',
        type: ChannelType.GuildText,
        parent: categoryCours.id,
        topic: 'Discussions et entraide sur les SAE (Situations d\'Apprentissage et d\'Évaluation)',
      }) as TextChannel;

      const channelRessources = await createOrReuseChannel(guild, {
        name: '📂┃ressources',
        type: ChannelType.GuildText,
        parent: categoryCours.id,
        topic: 'Partagez vos ressources, tutoriels, liens utiles',
      }) as TextChannel;

      const channelPartageCours = await createOrReuseChannel(guild, {
        name: '📑┃partage-cours',
        type: ChannelType.GuildText,
        parent: categoryCours.id,
        topic: 'Partagez vos notes de cours',
      }) as TextChannel;

      // ========== 🎟️ SUPPORT ==========
      const channelSupport = await createOrReuseChannel(guild, {
        name: '🎟️┃support',
        type: ChannelType.GuildText,
        parent: categorySupport.id,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: roleVerified.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [PermissionFlagsBits.SendMessages],
          },
        ],
        topic: 'Ouvrez un ticket pour obtenir de l\'aide',
      }) as TextChannel;

      // ========== 🛡️ MODÉRATION ==========
      const channelPanelControl = await createOrReuseChannel(guild, {
        name: '🎛️┃panel-controle',
        type: ChannelType.GuildText,
        parent: categoryModeration.id,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: roleAdmin.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
        ],
        topic: 'Panel de contrôle du bot - Admins uniquement',
      }) as TextChannel;

      const channelLogsBots = await createOrReuseChannel(guild, {
        name: '🤖┃logs-bots',
        type: ChannelType.GuildText,
        parent: categoryModeration.id,
        topic: 'Logs des actions du bot',
      }) as TextChannel;

      const channelLogsModeration = await createOrReuseChannel(guild, {
        name: '🛡️┃logs-modération',
        type: ChannelType.GuildText,
        parent: categoryModeration.id,
        topic: 'Logs des actions de modération',
      }) as TextChannel;

      const channelLogsServer = await createOrReuseChannel(guild, {
        name: '🗂️┃logs-serveur',
        type: ChannelType.GuildText,
        parent: categoryModeration.id,
        topic: 'Logs des événements du serveur',
      }) as TextChannel;

      await interaction.editReply('⏳ Configuration du serveur en cours...\n\n**Étape 7/7** : Envoi des messages...');

      // ========== MESSAGES ==========
      
      // Message de vérification
      const verifyEmbed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle('✅ Vérification')
        .setDescription(
          '**Pour accéder au serveur, vous devez vérifier que vous êtes bien étudiant à l\'Université de Lille.**\n\n' +
          '📧 Utilisez la commande `/verify` avec votre email universitaire (@univ-lille.fr)\n\n' +
          'Une fois vérifié, vous obtiendrez le rôle <@&' + roleVerified.id + '> et aurez accès à tous les salons !'
        );

      const verifyMessage = await channelVerify.send({ embeds: [verifyEmbed] });

      // Message du salon rôles
      const rolesEmbed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle('🎭 Sélection des rôles')
        .setDescription(
          '**Choisissez vos rôles en cliquant sur les boutons ci-dessous :**\n\n' +
          '📋 **Délégué** - Si vous êtes délégué de votre groupe\n' +
          '_(Vous obtiendrez des permissions de modération)_\n\n' +
          '💼 **Jobs** - Accédez au salon des offres d\'emploi étudiants\n' +
          '_(Mis à jour automatiquement avec les offres de la région lilloise)_'
        )
        .setFooter({ text: 'Cliquez pour ajouter ou retirer un rôle' })
        .setTimestamp();

      const delegueButton = new ButtonBuilder()
        .setCustomId('toggle_delegue')
        .setLabel('Délégué')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📋');

      const jobsButton = new ButtonBuilder()
        .setCustomId('toggle_jobs')
        .setLabel('Jobs')
        .setStyle(ButtonStyle.Success)
        .setEmoji('💼');

      const rolesRow = new ActionRowBuilder<ButtonBuilder>().addComponents(delegueButton, jobsButton);
      const rolesMessage = await channelRoles.send({ embeds: [rolesEmbed], components: [rolesRow] });

      // Message des liens utiles avec menu interactif
      
      const linksMainEmbed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle('ℹ️ Informations - Université de Lille')
        .setDescription(
          '**Tous les liens importants pour votre parcours au BUT Informatique**\n\n' +
          'Utilisez le menu ci-dessous pour accéder rapidement aux différentes sections.'
        )
        .setFooter({ text: '💡 Ajoutez ces liens à vos favoris !' })
        .setTimestamp();

      const linksSelectMenu = new StringSelectMenuBuilder()
        .setCustomId('links_menu')
        .setPlaceholder('📚 Sélectionnez une catégorie')
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('📓 Notion de Yann')
            .setDescription('Ressources et cours BUT1 Info')
            .setValue('notion_yann')
            .setEmoji('📓'),
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

      const linksRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(linksSelectMenu);
      const linksMessage = await channelInformations.send({ embeds: [linksMainEmbed], components: [linksRow] });

      // Message de support (tickets)  
      const supportEmbed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle('🎟️ Support - Système de tickets')
        .setDescription(
          '**Besoin d\'aide ou d\'assistance ?**\n\n' +
          'Cliquez sur le bouton ci-dessous pour ouvrir un ticket.\n' +
          'Un salon privé sera créé où vous pourrez discuter avec l\'équipe de support (délégués, support, admins).\n\n' +
          `⚠️ **Pour les questions sur les devoirs, utilisez <#${channelAideDevoirs.id}>**`
        )
        .setFooter({ text: 'Un membre du support vous répondra dès que possible' })
        .setTimestamp();

      const supportButton = new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('Ouvrir un ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎟️');

      const supportRow = new ActionRowBuilder<ButtonBuilder>().addComponents(supportButton);
      const supportMessage = await channelSupport.send({ embeds: [supportEmbed], components: [supportRow] });

      // Message du panel de contrôle
      const panelEmbed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle('🎛️ Panel de Contrôle - Hotaru Bot')
        .setDescription(
          '**Bienvenue sur le panel de contrôle du bot !**\n\n' +
          'Utilisez les boutons ci-dessous pour rafraîchir les messages dans les différents salons.\n' +
          'Cela permet d\'appliquer les modifications du code sans refaire tout le setup.\n\n' +
          '**Messages actuellement gérés :**\n' +
          '• Message de support (🎟️ tickets)\n' +
          '• Message des liens utiles (🔗)\n' +
          '• Message de vérification (✅)\n' +
          '• Message des rôles (🎭)'
        )
        .addFields(
          { 
            name: '🔄 Git Pull', 
            value: 'Récupère les dernières modifications depuis GitHub\nPensez à redémarrer le bot manuellement après un pull !', 
            inline: false 
          },
          { 
            name: '💼 Rafraîchir Jobs', 
            value: 'Force la mise à jour immédiate des offres d\'emploi (sans attendre le délai de 6h)', 
            inline: false 
          }
        )
        .setFooter({ text: 'Réservé aux administrateurs' })
        .setTimestamp();

      const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('refresh_support')
          .setLabel('Rafraîchir Support')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎟️'),
        new ButtonBuilder()
          .setCustomId('refresh_links')
          .setLabel('Rafraîchir Liens')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🔗'),
        new ButtonBuilder()
          .setCustomId('refresh_verify')
          .setLabel('Rafraîchir Vérification')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('✅')
      );

      const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('refresh_roles')
          .setLabel('Rafraîchir Rôles')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎭'),
        new ButtonBuilder()
          .setCustomId('manage_channels')
          .setLabel('Gérer les Salons')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📝'),
        new ButtonBuilder()
          .setCustomId('git_pull')
          .setLabel('Git Pull')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🔄')
      );

      const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('refresh_jobs')
          .setLabel('Rafraîchir Jobs')
          .setStyle(ButtonStyle.Success)
          .setEmoji('💼')
      );

      await channelPanelControl.send({ embeds: [panelEmbed], components: [row1, row2, row3] });

      // Sauvegarder les IDs des messages dans un fichier JSON
      const messageIds = {
        support: { channelId: channelSupport.id, messageId: supportMessage.id },
        links: { channelId: channelInformations.id, messageId: linksMessage.id },
        verify: { channelId: channelVerify.id, messageId: verifyMessage.id },
        roles: { channelId: channelRoles.id, messageId: rolesMessage.id },
      };

      // Sauvegarder dans un fichier
      const { writeFileSync } = await import('fs');
      const { join } = await import('path');
      const configPath = join(process.cwd(), 'data', 'panel-config.json');
      writeFileSync(configPath, JSON.stringify(messageIds, null, 2));

      // ========== RÉSUMÉ FINAL ==========
      const summaryEmbed = new EmbedBuilder()
        .setColor(0x00b894)
        .setTitle('✅ Configuration terminée !')
        .setDescription(
          '**Le serveur a été configuré avec succès !**\n\n' +
          '**Rôles créés :**\n' +
          `• ${roleAdmin}\n` +
          `• ${roleDelegue}\n` +
          `• ${roleSupport}\n` +
          `• ${roleStudent}\n` +
          `• ${roleVerified}\n` +
          `• ${roleJobs}\n` +
          `• ${roleBot}\n\n` +
          '**Catégories créées :**\n' +
          '• 🛠️ SYSTÈME\n' +
          '• 💬 DISCUSSIONS\n' +
          '• 🔊 SALONS VOCAUX\n' +
          '• 📚 COURS & ENTRAIDE\n' +
          '• 🎟️ SUPPORT\n' +
          '• 🛡️ MODÉRATION\n\n' +
          '**⚙️ Configuration du .env :**\n' +
          'Ajoutez ces IDs dans votre fichier `.env` :\n' +
          '```env\n' +
          `ROLE_ADMIN_ID=${roleAdmin.id}\n` +
          `ROLE_DELEGUE_ID=${roleDelegue.id}\n` +
          `ROLE_SUPPORT_ID=${roleSupport.id}\n` +
          `ROLE_STUDENT_ID=${roleStudent.id}\n` +
          `ROLE_VERIFIED_ID=${roleVerified.id}\n` +
          `ROLE_JOBS_ID=${roleJobs.id}\n` +
          `ROLE_BOT_ID=${roleBot.id}\n\n` +
          `CHANNEL_WELCOME_ID=${channelWelcome.id}\n` +
          `CHANNEL_QUOTES_ID=${channelQuotes.id}\n` +
          `CHANNEL_VERIFY_ID=${channelVerify.id}\n` +
          `CHANNEL_PICTURES_ID=${channelPictures.id}\n` +
          `CHANNEL_POLLS_ID=${channelPolls.id}\n` +
          `CHANNEL_JOBS_ID=${channelJobs.id}\n` + 
          `CHANNEL_LIENS_UTILES_ID=${channelLinks.id}\n` + 
          `CATEGORY_TICKETS_ID=${categorySupport.id}\n\n` +
          `CHANNEL_LOGS_BOTS_ID=${channelLogsBots.id}\n` +
          `CHANNEL_LOGS_MODERATION_ID=${channelLogsModeration.id}\n` +
          `CHANNEL_LOGS_SERVER_ID=${channelLogsServer.id}\n\n` +
          `CATEGORY_VOICE_ID=${categoryVoice.id}\n` +
          '```\n' +
          '**N\'oubliez pas de redémarrer le bot après avoir modifié le .env !**'
        )
        .setFooter({ text: 'Vous pouvez maintenant utiliser toutes les commandes du bot !' })
        .setTimestamp();

      await interaction.editReply({ embeds: [summaryEmbed] });

    } catch (error) {
      console.error('Erreur lors du setup:', error);
      await interaction.editReply({
        content: '❌ Une erreur est survenue lors de la configuration du serveur.',
      });
    }
  },
};

export default command;