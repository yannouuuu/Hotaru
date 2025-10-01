/**
 * Parser un email universitaire pour extraire le prénom et le nom
 * Format attendu: prenom.nom[chiffre][.etu]@univ-lille.fr
 */
export const parseEmailToName = (email: string): string | null => {
  try {
    const localPart = email.split('@')[0];
    if (!localPart) return null;

    let cleanedPart = localPart
      .replace(/\.(etu|etudiant|student)$/i, '')
      .replace(/\d+$/, '');
    
    const parts = cleanedPart.split('.');
    if (parts.length < 2 || !parts[0] || !parts[1]) return null;

    const capitalize = (str: string): string => {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    return `${capitalize(parts[0]!)} ${capitalize(parts[1]!)}`;
  } catch (error) {
    console.error('Erreur lors du parsing de l\'email:', error);
    return null;
  }
};

