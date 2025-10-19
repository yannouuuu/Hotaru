import { emailService } from './EmailService.js';

/**
 * Script de test pour visualiser le nouveau design d'email
 * Usage: bun run src/utils/test-email-design.ts
 */

console.log('📧 Test du nouveau design d\'email shadcn/ui\n');

// Tester l'email de vérification
console.log('1️⃣ Test de l\'email de vérification...');
const verificationResult = await emailService.sendVerificationCode(
    process.env.TEST_EMAIL || 'hotaru.github@gmail.com',
    'ABC12345',
    'TestUser',
    'BUT Informatique - Université de Lille'
);

if (verificationResult.success) {
    console.log('✅ Email de vérification envoyé avec succès !');
    console.log('📬 Vérifiez votre boîte mail pour voir le nouveau design\n');
} else {
    console.error('❌ Erreur:', verificationResult.error);
}

// Tester l'email de bienvenue
console.log('2️⃣ Test de l\'email de bienvenue...');
const welcomeResult = await emailService.sendWelcomeEmail(
    process.env.TEST_EMAIL || 'hotaru.github@gmail.com',
    'TestUser',
    'BUT Informatique - Université de Lille'
);

if (welcomeResult.success) {
    console.log('✅ Email de bienvenue envoyé avec succès !');
    console.log('📬 Vérifiez votre boîte mail pour voir le nouveau design\n');
} else {
    console.error('❌ Erreur:', welcomeResult.error);
}

process.exit(0);
