/**
 * Données de l'Université de Lille - IUT Informatique
 * Liens utiles et contacts du département
 */

import type { UniversityInfo } from '../types/index.ts';

export const universityData: UniversityInfo = {
  links: [
    {
      name: 'Emploi du temps',
      url: 'https://edt-iut.univ-lille.fr/',
      description: 'Consultez votre emploi du temps'
    },
    {
      name: 'Notes',
      url: 'https://bulletin.iut-info.univ-lille.fr/',
      description: 'Accédez à vos notes et bulletins'
    },
    {
      name: 'Zimbra',
      url: 'https://zimbra.univ-lille.fr/',
      description: 'Votre boîte mail universitaire'
    },
    {
      name: 'Moodle',
      url: 'https://moodle.univ-lille.fr/',
      description: 'Ressources des cours'
    },
    {
      name: 'Aide BUT Info',
      url: 'https://but-info.septhime.fr/',
      description: 'En partenariat avec le tutorat'
    },
    {
      name: 'Sport à l\'université',
      url: 'https://sport.univ-lille.fr/',
      description: 'Activités sportives universitaires'
    },
    {
      name: 'ENT',
      url: 'https://ent.univ-lille.fr/',
      description: 'Environnement Numérique de Travail'
    }
  ],
  contacts: [
    {
      year: 'Département Informatique',
      responsibles: [
        {
          name: 'Frédéric Guyomarch',
          email: 'frederic.guyomarch@univ-lille.fr',
          role: 'Chef de département'
        },
        {
          name: 'Isabelle Delille',
          email: 'isabelle.delille@univ-lille.fr',
          role: 'Responsable alternances'
        }
      ],
      secretary: { name: '', email: '' },
      edt: { name: '', email: '' }
    },
    {
      year: 'BUT 1',
      responsibles: [
        {
          name: 'Julien Baste',
          email: 'julien.baste@univ-lille.fr',
          role: 'Responsable première année'
        },
        {
          name: 'Fabien Delecroix',
          email: 'fabien.delecroix@univ-lille.fr',
          role: 'Responsable réussite 1ère année'
        }
      ],
      secretary: {
        name: 'Marie Ryckebosch',
        email: 'marie.ryckebosch@univ-lille.fr'
      },
      edt: {
        name: 'Deise Santana Maia',
        email: 'deise.santanamaia@univ-lille.fr'
      }
    },
    {
      year: 'BUT 2',
      responsibles: [
        {
          name: 'Patricia Everaere',
          email: 'patricia.everaere-caillier@univ-lille.fr',
          role: 'Responsable'
        }
      ],
      secretary: {
        name: 'Melissa Leger',
        email: 'melissa.leger@univ-lille.fr'
      },
      edt: {
        name: 'Isabelle Delille',
        email: 'isabelle.delille@univ-lille.fr'
      }
    },
    {
      year: 'BUT 3',
      responsibles: [
        {
          name: 'Philippe Mathieu',
          email: 'philippe.mathieu@univ-lille.fr',
          role: 'Responsable'
        },
        {
          name: 'Yvan Peter',
          email: 'yvan.peter@univ-lille.fr',
          role: 'Responsable'
        }
      ],
      secretary: {
        name: 'Melissa Leger',
        email: 'melissa.leger@univ-lille.fr'
      },
      edt: {
        name: 'Marie Deletombe',
        email: 'marie.deletombe@univ-lille.fr'
      }
    }
  ]
};

