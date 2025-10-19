# Synchronisation Hyperplanning (ICS)

La fonctionnalité `/edt` permet de connecter un emploi du temps Hyperplanning (ou n'importe quel flux iCalendar) au bot afin d'afficher automatiquement le cours en cours ou le prochain cours.

## Pré-requis

- Disposer d'une URL ICS accessible (Hyperplanning, Moodle, etc.).
- Avoir les permissions administrateur sur la guilde Discord.

## Commande `/edt`

### `configurer`

Configure la synchronisation pour la guilde.

| Option | Type | Description |
| --- | --- | --- |
| `url` | Texte | Lien ICS à récupérer périodiquement. |
| `mode` | Choix | `presence`, `channel_name`, `message`, `event`. |
| `salon` | Salon | Obligatoire pour `channel_name` et `message`. Texte ou vocal. |
| `message_id` | Texte | ID du message à éditer (mode `message`). |
| `event_id` | Texte | ID d'un événement planifié Discord (mode `event`). |
| `intervalle` | Nombre | Fréquence de mise à jour en minutes (1-60, 5 par défaut). |
| `anticipation` | Nombre | Horizon pour détecter le prochain cours (1-168 h, 12 h par défaut). |

Chaque mode actualise une cible différente :

- **presence** : met à jour le statut personnalisé du bot.
- **channel_name** : renomme le salon spécifié (texte ou vocal).
- **message** : édite un message existant avec le cours en cours.
- **event** : met à jour un événement planifié (dates, titre, description).

### `statut`

Affiche la configuration actuelle, l'URL suivie, la dernière synchronisation et le dernier état détecté.

### `forcer`

Relance immédiatement la synchronisation (utile après modification du calendrier ICS).

### `desactiver`

Supprime la configuration et arrête les mises à jour automatiques.

## Comportement

- La synchronisation s'exécute toutes les 5 minutes par défaut (configurable).
- Lorsqu'un cours est en cours, l'affichage indique le nom du cours et son heure de fin.
- À défaut, le prochain cours dans l'intervalle d'anticipation est annoncé.
- Si le mode `presence` est activé pour au moins une guilde, Hotaru désactive la rotation de statuts personnalisés pour éviter les conflits.

## Dépannage

- Vérifiez que l'URL ICS est publique ou accessible sans authentification.
- Assurez-vous de fournir les identifiants de message ou d'événement corrects (copie ID développeur).
- La commande `/edt forcer` peut être utilisée après un changement côté Hyperplanning pour rafraîchir immédiatement l'affichage.
