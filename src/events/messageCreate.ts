import { Events, Message } from 'discord.js';
import { incrementPhotoCounter } from '../utils/database.ts';

export default {
  name: Events.MessageCreate,
  async execute(message: Message) {
    // Ignorer les messages des bots
    if (message.author.bot) return;

    // Salon pictures - Créer automatiquement un thread sur chaque image
    if (message.channelId === process.env.CHANNEL_PICTURES_ID) {
      // Vérifier s'il y a des images/pièces jointes
      if (message.attachments.size > 0) {
        const hasImage = message.attachments.some(attachment => 
          attachment.contentType?.startsWith('image/')
        );

        if (hasImage) {
          try {
            // Incrémenter le compteur en base de données (persiste entre les redémarrages)
            const photoNumber = incrementPhotoCounter(message.channelId);
            
            // Créer directement le thread
            const threadName = `📸 Photo ${photoNumber}`;
            
            await message.startThread({
              name: threadName,
              autoArchiveDuration: 1440,
            });
          } catch (error) {
            console.error('Erreur lors du traitement de l\'image:', error);
          }
        } else {
          // A des fichiers mais pas d'images
          try {
            await message.delete();
            const warning = await message.channel.send({
              content: `${message.author}, ce salon est réservé aux **images** uniquement ! 📸`,
            });
            
            setTimeout(async () => {
              try {
                await warning.delete();
              } catch (error) {
                console.error('Erreur lors de la suppression du message d\'avertissement:', error);
              }
            }, 5000);
          } catch (error) {
            console.error('Erreur lors de la suppression du message:', error);
          }
        }
      } else {
        // Pas de fichiers du tout - Supprimer les messages sans image
        try {
          await message.delete();
          const warning = await message.channel.send({
            content: `${message.author}, ce salon est réservé aux images uniquement ! 📸\nVous pouvez ajouter du texte avec votre image.`,
          });
          
          // Supprimer le message d'avertissement après 5 secondes
          setTimeout(async () => {
            try {
              await warning.delete();
            } catch (error) {
              console.error('Erreur lors de la suppression du message d\'avertissement:', error);
            }
          }, 5000);
        } catch (error) {
          console.error('Erreur lors de la suppression du message:', error);
        }
      }
    }
  },
};

