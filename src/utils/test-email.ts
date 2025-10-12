/**
 * 🧪 Script de test pour la configuration SMTP
 * 
 * Ce script permet de tester votre configuration SMTP
 * avant de lancer le bot.
 * 
 * Usage : bun run src/utils/test-email.ts
 */

import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';

// Charger manuellement le fichier .env
try {
    const envPath = join(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    
    envContent.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#') && line.includes('=')) {
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            process.env[key.trim()] = value.trim();
        }
    });
} catch (error) {
    console.error('❌ Impossible de lire le fichier .env');
    process.exit(1);
}

const TEST_EMAIL = process.env.SMTP_USER;

console.log('╔════════════════════════════════════════╗');
console.log('║   🧪 Test de configuration SMTP       ║');
console.log('╚════════════════════════════════════════╝\n');

// Vérifier que les variables d'environnement sont définies
const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Variables d\'environnement manquantes:');
    missingVars.forEach(varName => {
        console.error(`   - ${varName}`);
    });
    console.error('\n💡 Ajoutez-les dans votre fichier .env');
    console.error('   Voir .env.example pour un exemple de configuration\n');
    process.exit(1);
}

console.log('📋 Configuration détectée:');
console.log(`   Host:     ${process.env.SMTP_HOST}`);
console.log(`   Port:     ${process.env.SMTP_PORT}`);
console.log(`   Secure:   ${process.env.SMTP_SECURE === 'true' ? 'Oui (SSL/TLS)' : 'Non (STARTTLS)'}`);
console.log(`   User:     ${process.env.SMTP_USER}`);
console.log(`   From:     ${process.env.EMAIL_FROM}`);
console.log('');

// Créer le transporteur SMTP
console.log('🔧 Création du transporteur SMTP...');
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Test de la connexion
console.log('🔌 Test de connexion SMTP...\n');

transporter.verify((error) => {
    if (error) {
        console.error('❌ Échec de la connexion SMTP:\n');
        console.error(`   Erreur: ${error.message}\n`);
        
        // Suggestions d'erreurs courantes
        if (error.message.includes('authentication') || error.message.includes('credentials')) {
            console.error('💡 Suggestions:');
            console.error('   - Vérifiez votre SMTP_USER et SMTP_PASS');
            console.error('   - Si vous utilisez Gmail, assurez-vous d\'utiliser un "mot de passe d\'application"');
            console.error('     (pas votre mot de passe principal)');
            console.error('   - Lien: https://support.google.com/accounts/answer/185833\n');
        } else if (error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
            console.error('💡 Suggestions:');
            console.error('   - Vérifiez votre SMTP_HOST et SMTP_PORT');
            console.error('   - Vérifiez que votre pare-feu n\'bloque pas le port SMTP');
            console.error('   - Essayez avec SMTP_SECURE=false si vous utilisez le port 587\n');
        } else {
            console.error('💡 Consultez la documentation de votre fournisseur SMTP\n');
        }
        
        process.exit(1);
    }

    console.log('✅ Connexion SMTP réussie!\n');
    console.log('📧 Envoi d\'un email de test...\n');

    // Envoyer un email de test
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: TEST_EMAIL,
        subject: '🧪 Test Hotaru - Configuration SMTP',
        text: 
            'Félicitations!\n\n' +
            'Si vous recevez cet email, votre configuration SMTP fonctionne correctement.\n\n' +
            'Vous pouvez maintenant activer le système de vérification par email sur votre bot Discord.\n\n' +
            '---\n' +
            'Hotaru Bot - Système de vérification\n' +
            `Date: ${new Date().toLocaleString('fr-FR')}`,
        html:
            `<!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .header h1 { margin: 0; font-size: 28px; }
                    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                    .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px; }
                    .info-box { background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; border-radius: 5px; }
                    .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🧪 Test SMTP Réussi</h1>
                </div>
                <div class="content">
                    <div class="success-box">
                        <strong>✅ Félicitations!</strong><br>
                        Si vous recevez cet email, votre configuration SMTP fonctionne correctement.
                    </div>
                    
                    <p>Votre bot Discord est maintenant prêt à envoyer des emails de vérification aux étudiants.</p>
                    
                    <div class="info-box">
                        <strong>📋 Configuration testée:</strong><br>
                        <strong>Host:</strong> ${process.env.SMTP_HOST}<br>
                        <strong>Port:</strong> ${process.env.SMTP_PORT}<br>
                        <strong>User:</strong> ${process.env.SMTP_USER}<br>
                        <strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}
                    </div>
                    
                    <p><strong>Prochaines étapes:</strong></p>
                    <ol>
                        <li>Configurez le <code>verifiedRoleId</code> dans <code>src/config.ts</code></li>
                        <li>Définissez les domaines autorisés (<code>allowedDomains</code>)</li>
                        <li>Lancez votre bot avec <code>bun start</code></li>
                        <li>Testez la commande <code>/verify</code> sur votre serveur Discord</li>
                    </ol>
                    
                    <p>Consultez le fichier <strong>VERIFICATION_GUIDE.md</strong> pour plus d'informations.</p>
                </div>
                <div class="footer">
                    Hotaru Bot - Système de vérification<br>
                    Développé avec ❤️ pour le BUT Informatique
                </div>
            </body>
            </html>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('❌ Échec de l\'envoi de l\'email de test:\n');
            console.error(`   Erreur: ${error.message}\n`);
            process.exit(1);
        }

        console.log('✅ Email de test envoyé avec succès!\n');
        console.log('📬 Détails:');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Destinataire: ${TEST_EMAIL}`);
        console.log(`   Réponse: ${info.response}\n`);
        
        console.log('╔════════════════════════════════════════╗');
        console.log('║   ✅ Configuration SMTP validée!      ║');
        console.log('╚════════════════════════════════════════╝\n');
        
        console.log('💡 Vérifiez votre boîte mail (et vos spams!) pour voir l\'email de test.\n');
        console.log('🚀 Vous pouvez maintenant lancer votre bot avec: bun start\n');
        
        process.exit(0);
    });
});
