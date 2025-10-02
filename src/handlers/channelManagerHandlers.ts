import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionFlagsBits,
} from 'discord.js';

// Handler principal pour la gestion des salons
export const handleChannelManagement = async (interaction: ButtonInteraction) => {
  const embed = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle('📝 Gestion des Salons')
    .setDescription(
      '**Créez un nouveau salon personnalisé**\n\n' +
      'Sélectionnez un type de salon dans le menu ci-dessous.\n' +
      'Vous pourrez ensuite personnaliser le nom et les options.'
    )
    .setTimestamp();

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('channel_type_select')
    .setPlaceholder('Choisissez un type de salon')
    .addOptions([
      new StringSelectMenuOptionBuilder()
        .setLabel('💬 Discussion générale')
        .setDescription('Salon de discussion pour tous les étudiants vérifiés')
        .setValue('discussion')
        .setEmoji('💬'),
      new StringSelectMenuOptionBuilder()
        .setLabel('📢 Annonces')
        .setDescription('Salon d\'annonces importantes (lecture seule)')
        .setValue('announcements')
        .setEmoji('📢'),
      new StringSelectMenuOptionBuilder()
        .setLabel('📊 Sondages')
        .setDescription('Salon dédié aux sondages uniquement')
        .setValue('polls')
        .setEmoji('📊'),
      new StringSelectMenuOptionBuilder()
        .setLabel('📸 Photos')
        .setDescription('Salon pour partager des photos uniquement')
        .setValue('pictures')
        .setEmoji('📸'),
      new StringSelectMenuOptionBuilder()
        .setLabel('📚 Cours & Entraide')
        .setDescription('Salon d\'entraide pour une matière spécifique')
        .setValue('course')
        .setEmoji('📚'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🔊 Salon vocal')
        .setDescription('Salon vocal pour discussions audio')
        .setValue('voice')
        .setEmoji('🔊'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🎮 Jeux & Détente')
        .setDescription('Salon de détente et jeux')
        .setValue('gaming')
        .setEmoji('🎮'),
      new StringSelectMenuOptionBuilder()
        .setLabel('🛠️ Personnalisé')
        .setDescription('Créer un salon avec des permissions personnalisées')
        .setValue('custom')
        .setEmoji('🛠️'),
    ]);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true,
  });
};

// Handler pour la sélection du type de salon
export const handleChannelTypeSelect = async (interaction: StringSelectMenuInteraction) => {
  const channelType = interaction.values[0];
  
  if (!channelType) {
    await interaction.reply({ content: '❌ Erreur : type de salon invalide.', ephemeral: true });
    return;
  }

  // Créer un modal pour personnaliser le salon
  const modal = new ModalBuilder()
    .setCustomId(`channel_create_modal_${channelType}`)
    .setTitle('Créer un nouveau salon');

  const nameInput = new TextInputBuilder()
    .setCustomId('channel_name')
    .setLabel('Nom du salon')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(getPlaceholderName(channelType))
    .setRequired(true)
    .setMaxLength(100);

  const descriptionInput = new TextInputBuilder()
    .setCustomId('channel_description')
    .setLabel('Description du salon (topic)')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Description qui apparaîtra en haut du salon...')
    .setRequired(false)
    .setMaxLength(1024);

  const categoryInput = new TextInputBuilder()
    .setCustomId('channel_category')
    .setLabel('Nom de la catégorie (optionnel)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Laissez vide pour catégorie par défaut')
    .setRequired(false)
    .setMaxLength(100);

  const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
  const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);
  const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(categoryInput);

  modal.addComponents(row1, row2, row3);

  await interaction.showModal(modal);
};

// Handler pour la soumission du modal
export const handleChannelCreateModal = async (interaction: ModalSubmitInteraction) => {
  await interaction.deferReply({ ephemeral: true });

  const channelType = interaction.customId.replace('channel_create_modal_', '');
  const channelName = interaction.fields.getTextInputValue('channel_name');
  const channelDescription = interaction.fields.getTextInputValue('channel_description') || '';
  const categoryName = interaction.fields.getTextInputValue('channel_category') || '';

  try {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply({ content: '❌ Erreur : serveur introuvable.' });
      return;
    }

    // Trouver ou créer la catégorie
    let category = null;
    if (categoryName) {
      category = guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === categoryName.toLowerCase()
      );

      if (!category) {
        category = await guild.channels.create({
          name: categoryName,
          type: ChannelType.GuildCategory,
        });
      }
    } else {
      // Catégorie par défaut selon le type
      const defaultCategory = getDefaultCategory(channelType);
      category = guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildCategory && c.name === defaultCategory
      );
    }

    // Récupérer les rôles
    const roleVerified = guild.roles.cache.get(process.env.ROLE_VERIFIED_ID || '');
    const roleStudent = guild.roles.cache.get(process.env.ROLE_STUDENT_ID || '');
    const roleDelegue = guild.roles.cache.get(process.env.ROLE_DELEGUE_ID || '');

    // Créer le salon avec les bonnes permissions
    const channelOptions = getChannelOptions(
      channelType,
      channelName,
      channelDescription,
      category?.id,
      guild,
      roleVerified,
      roleStudent,
      roleDelegue
    );

    const newChannel = await guild.channels.create(channelOptions);

    // Embed de confirmation
    const confirmEmbed = new EmbedBuilder()
      .setColor(0x00b894)
      .setTitle('✅ Salon créé avec succès !')
      .setDescription(`Le salon ${newChannel} a été créé.`)
      .addFields(
        { name: 'Type', value: getChannelTypeLabel(channelType), inline: true },
        { name: 'Catégorie', value: category?.name || 'Aucune', inline: true },
        { name: 'Nom', value: channelName, inline: false }
      )
      .setTimestamp();

    if (channelDescription) {
      confirmEmbed.addFields({ name: 'Description', value: channelDescription, inline: false });
    }

    await interaction.editReply({ embeds: [confirmEmbed] });

    // Log dans le salon de logs si disponible
    const logsChannel = guild.channels.cache.get(process.env.CHANNEL_LOGS_SERVER_ID || '');
    if (logsChannel && logsChannel.isTextBased()) {
      const logEmbed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle('📝 Nouveau salon créé')
        .setDescription(`${interaction.user} a créé un nouveau salon`)
        .addFields(
          { name: 'Salon', value: `${newChannel} (${newChannel.id})`, inline: false },
          { name: 'Type', value: getChannelTypeLabel(channelType), inline: true },
          { name: 'Catégorie', value: category?.name || 'Aucune', inline: true }
        )
        .setTimestamp();

      await logsChannel.send({ embeds: [logEmbed] });
    }
  } catch (error) {
    console.error('Erreur lors de la création du salon:', error);
    await interaction.editReply({
      content: '❌ Une erreur est survenue lors de la création du salon.',
    });
  }
};

// Fonction helper pour obtenir un nom d'exemple
function getPlaceholderName(type: string): string {
  const placeholders: Record<string, string> = {
    discussion: '💬┃discussion-générale',
    announcements: '📢┃annonces',
    polls: '📊┃sondages',
    pictures: '📸┃galerie-photos',
    course: '📚┃mathématiques',
    voice: '🔊┃Salon Vocal',
    gaming: '🎮┃détente',
    custom: '🛠️┃mon-salon',
  };
  return placeholders[type] || '📝┃nouveau-salon';
}

// Fonction helper pour obtenir la catégorie par défaut
function getDefaultCategory(type: string): string {
  const categories: Record<string, string> = {
    discussion: '💬 DISCUSSIONS',
    announcements: '🛠️ SYSTÈME',
    polls: '💬 DISCUSSIONS',
    pictures: '💬 DISCUSSIONS',
    course: '📚 COURS & ENTRAIDE',
    voice: '🔊 SALONS VOCAUX',
    gaming: '💬 DISCUSSIONS',
    custom: '💬 DISCUSSIONS',
  };
  return categories[type] || '💬 DISCUSSIONS';
}

// Fonction helper pour obtenir le label du type
function getChannelTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    discussion: '💬 Discussion générale',
    announcements: '📢 Annonces',
    polls: '📊 Sondages',
    pictures: '📸 Photos',
    course: '📚 Cours & Entraide',
    voice: '🔊 Salon vocal',
    gaming: '🎮 Jeux & Détente',
    custom: '🛠️ Personnalisé',
  };
  return labels[type] || '📝 Salon personnalisé';
}

// Fonction helper pour obtenir les options de création du salon
function getChannelOptions(
  type: string,
  name: string,
  description: string,
  categoryId: string | undefined,
  guild: any,
  roleVerified: any,
  roleStudent: any,
  roleDelegue: any
): any {
  const baseOptions: any = {
    name,
    parent: categoryId,
  };

  if (description) {
    baseOptions.topic = description;
  }

  // Permissions par défaut pour tous les types
  const defaultPermissions = [
    {
      id: guild.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: roleVerified?.id || guild.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
  ];

  switch (type) {
    case 'discussion':
      return {
        ...baseOptions,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          ...defaultPermissions,
          {
            id: roleVerified?.id || guild.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.EmbedLinks,
              PermissionFlagsBits.AttachFiles,
            ],
          },
        ],
      };

    case 'announcements':
      return {
        ...baseOptions,
        type: ChannelType.GuildAnnouncement,
        permissionOverwrites: [
          ...defaultPermissions,
          {
            id: roleVerified?.id || guild.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [PermissionFlagsBits.SendMessages],
          },
          {
            id: roleDelegue?.id || guild.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
        ],
      };

    case 'polls':
      return {
        ...baseOptions,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          ...defaultPermissions,
          {
            id: roleVerified?.id || guild.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.CreatePublicThreads,
              PermissionFlagsBits.SendMessagesInThreads,
            ],
          },
        ],
      };

    case 'pictures':
      return {
        ...baseOptions,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          ...defaultPermissions,
          {
            id: roleVerified?.id || guild.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.EmbedLinks,
              PermissionFlagsBits.AddReactions,
            ],
          },
        ],
      };

    case 'course':
      return {
        ...baseOptions,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          ...defaultPermissions,
          {
            id: roleVerified?.id || guild.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.EmbedLinks,
              PermissionFlagsBits.CreatePublicThreads,
              PermissionFlagsBits.SendMessagesInThreads,
            ],
          },
        ],
      };

    case 'voice':
      return {
        ...baseOptions,
        type: ChannelType.GuildVoice,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: roleVerified?.id || guild.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.Stream,
              PermissionFlagsBits.UseVAD,
            ],
          },
        ],
      };

    case 'gaming':
      return {
        ...baseOptions,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          ...defaultPermissions,
          {
            id: roleVerified?.id || guild.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AddReactions,
              PermissionFlagsBits.EmbedLinks,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.UseExternalEmojis,
            ],
          },
        ],
      };

    case 'custom':
    default:
      return {
        ...baseOptions,
        type: ChannelType.GuildText,
        permissionOverwrites: defaultPermissions,
      };
  }
}

