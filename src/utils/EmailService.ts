import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Service d'envoi d'emails pour les vérifications
 */
export class EmailService {
    private transporter: Transporter | null = null;
    private from: string;

    constructor() {
        this.from = process.env.EMAIL_FROM || 'noreply@hotaru-bot.fr';
        this.initializeTransporter();
    }

    /**
     * Initialiser le transporteur nodemailer
     */
    private initializeTransporter(): void {
        try {
            // Configuration SMTP
            const smtpConfig = {
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true', // true pour 465, false pour autres ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            };

            if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
                console.warn('⚠️ Configuration SMTP manquante. Le service d\'email ne fonctionnera pas.');
                return;
            }

            this.transporter = nodemailer.createTransport(smtpConfig);

            // Vérifier la connexion
            this.transporter.verify((error) => {
                if (error) {
                    console.error('❌ Erreur de connexion SMTP:', error);
                    this.transporter = null;
                } else {
                    console.log('✅ Service d\'email initialisé avec succès');
                }
            });
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du service d\'email:', error);
        }
    }

    /**
     * Vérifier si le service est disponible
     */
    public isAvailable(): boolean {
        return this.transporter !== null;
    }

    /**
     * Envoyer un code de vérification par email
     */
    public async sendVerificationCode(
        email: string,
        code: string,
        username: string,
        serverName: string = 'BUT Informatique - Université de Lille'
    ): Promise<{ success: boolean; error?: string }> {
        if (!this.transporter) {
            return {
                success: false,
                error: 'Service d\'email non disponible. Veuillez contacter un administrateur.'
            };
        }

        try {
            const mailOptions = {
                from: `Hotaru Bot <${this.from}>`,
                to: email,
                subject: `Code de vérification Discord - ${serverName}`,
                html: this.generateVerificationEmailHTML(code, username, serverName),
                text: this.generateVerificationEmailText(code, username, serverName)
            };

            await this.transporter.sendMail(mailOptions);

            return { success: true };
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
            return {
                success: false,
                error: 'Impossible d\'envoyer l\'email. Vérifiez votre adresse email.'
            };
        }
    }

    /**
     * Générer le HTML de l'email de vérification
     */
    private generateVerificationEmailHTML(
        code: string,
        username: string,
        serverName: string
    ): string {
        return `
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hotaru - Vérification</title>
  <style>
    /* Thème light shadcn/ui */
    :root {
      --background: #ffffff;
      --foreground: #020817;
      --card: #ffffff;
      --card-foreground: #020817;
      --muted: #f1f5f9;
      --muted-foreground: #64748b;
      --border: #e2e8f0;
      --primary: #0f172a;
      --ring: #020817;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    /* Reset */
    body, table, td { margin: 0; padding: 0; border: 0; font-family: inherit; }
    img { display: block; border: 0; outline: none; text-decoration: none; }
    a { color: inherit; text-decoration: none; }

    body {
      background: var(--muted);
      color: var(--foreground);
      line-height: 1.5;
    }

    .wrapper {
      background: var(--muted);
      padding: 40px 16px;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 40px;
    }

    .header {
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border);
    }

    .brand-text h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--foreground);
    }

    .brand-text p {
      margin: 4px 0 0 0;
      font-size: 14px;
      color: var(--muted-foreground);
    }

    .content {
      padding: 32px 0;
    }

    h2 {
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: var(--foreground);
    }

    p {
      margin: 0 0 16px 0;
      color: var(--muted-foreground);
      font-size: 14px;
    }

    .code-card {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border: 2px solid #fecaca;
      border-radius: 8px;
      padding: 24px;
      margin: 32px 0;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .code-card::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, #ef4444, #dc2626, #b91c1c, #dc2626, #ef4444);
      background-size: 300% 300%;
      border-radius: 8px;
      z-index: -1;
      animation: gradientShift 3s ease infinite;
    }
    
    @keyframes gradientShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    .code-label {
      font-size: 13px;
      color: var(--muted-foreground);
      margin-bottom: 12px;
      font-weight: 500;
    }

    .code {
      font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
      font-size: 32px;
      font-weight: 600;
      letter-spacing: 8px;
      color: var(--foreground);
      margin: 0;
    }

    .code-expiry {
      font-size: 12px;
      color: var(--muted-foreground);
      margin-top: 12px;
    }

    .section {
      margin: 32px 0;
      padding: 20px;
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: 6px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--foreground);
      margin: 0 0 12px 0;
    }

    ol, ul {
      margin: 0;
      padding-left: 20px;
      color: var(--muted-foreground);
      font-size: 14px;
    }

    li {
      margin-bottom: 8px;
    }

    li:last-child {
      margin-bottom: 0;
    }

    code {
      background: var(--muted);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: ui-monospace, monospace;
      font-size: 13px;
      border: 1px solid var(--border);
    }

    strong {
      color: var(--foreground);
      font-weight: 600;
    }

    .alert {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 20px;
      margin: 32px 0;
    }

    .footer {
      padding-top: 24px;
      border-top: 1px solid var(--border);
      text-align: center;
    }

    .footer p {
      font-size: 12px;
      color: var(--muted-foreground);
      margin: 4px 0;
    }

    .footer a {
      text-decoration: underline;
      color: var(--muted-foreground);
    }

    .footer a:hover {
      color: var(--foreground);
    }

    /* Responsive */
    @media (max-width: 480px) {
      .container {
        padding: 24px;
      }
      .code {
        font-size: 24px;
        letter-spacing: 6px;
      }
    }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="wrapper">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="container">
          <tr>
            <td>
              <!-- Header -->
              <div class="header">
                <div class="brand-text">
                  <h1>Hotaru Bot</h1>
                  <p>${serverName}</p>
                </div>
              </div>

              <!-- Content -->
              <div class="content">
                <h2>Vérification de votre compte</h2>
                <p>Bonjour <strong>${username}</strong>,</p>
                <p>Vous avez demandé à vérifier votre compte Discord pour accéder au serveur <strong>${serverName}</strong>.</p>

                <!-- Code -->
                <div class="code-card">
                  <div class="code-label">Votre code de vérification</div>
                  <div class="code">${code}</div>
                  <div class="code-expiry">Valide pendant 15 minutes</div>
                </div>

                <!-- Instructions -->
                <div class="section">
                  <div class="section-title">Instructions</div>
                  <ol>
                    <li>Retournez sur Discord</li>
                    <li>Cliquez sur le bouton <strong>"Entrer le code de vérification"</strong></li>
                    <li>Entrez le code ci-dessus dans le formulaire</li>
                    <li>Vous recevrez automatiquement le rôle "Vérifié"</li>
                  </ol>
                </div>

                <!-- Alert -->
                <div class="alert">
                  <div class="section-title">Important</div>
                  <ul style="padding-left: 20px;">
                    <li>Ce code expire dans <strong>15 minutes</strong></li>
                    <li>Ne partagez ce code avec personne</li>
                    <li>Si vous n'avez pas demandé ce code, ignorez cet email</li>
                    <li>Ce code ne peut être utilisé qu'une seule fois</li>
                  </ul>
                </div>

                <p>Si vous rencontrez des problèmes, contactez un administrateur sur le serveur Discord.</p>
              </div>

              <!-- Footer -->
              <div class="footer">
                <p>Cet email a été envoyé automatiquement par Hotaru Bot</p>
                <p>© 2025 ${serverName}</p>
                <p>Créé par <a href="https://github.com/yannouuuu" target="_blank" rel="noopener noreferrer">Yann Renard</a></p>
              </div>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;
    }

    /**
     * Générer le texte brut de l'email de vérification
     */
    private generateVerificationEmailText(
        code: string,
        username: string,
        serverName: string
    ): string {
        return `
🤖 Hotaru Bot - ${serverName}

Bonjour ${username},

Vous avez demandé à vérifier votre compte Discord pour accéder au serveur ${serverName}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VOTRE CODE DE VÉRIFICATION :

${code}

Valide pendant 15 minutes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Instructions :
1. Retournez sur Discord
2. Cliquez sur le bouton "Entrer le code de vérification"
3. Entrez le code ci-dessus dans le formulaire
4. Vous recevrez automatiquement le rôle "✅ Vérifié"

⚠️ Important :
• Ce code expire dans 15 minutes
• Ne partagez ce code avec personne
• Si vous n'avez pas demandé ce code, ignorez cet email
• Ce code ne peut être utilisé qu'une seule fois

Si vous rencontrez des problèmes, contactez un administrateur sur le serveur Discord.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cet email a été envoyé automatiquement par Hotaru Bot
© 2025 ${serverName}
        `;
    }

    /**
     * Envoyer un email de bienvenue après vérification réussie
     */
    public async sendWelcomeEmail(
        email: string,
        username: string,
        serverName: string = 'BUT Informatique - Université de Lille'
    ): Promise<{ success: boolean; error?: string }> {
        if (!this.transporter) {
            return { success: false, error: 'Service d\'email non disponible' };
        }

        try {
            const mailOptions = {
                from: `Hotaru Bot <${this.from}>`,
                to: email,
                subject: `Bienvenue sur le serveur Discord - ${serverName}`,
                html: `
                    <h2>Bienvenue ${username} !</h2>
                    <p>Votre compte Discord a été vérifié avec succès.</p>
                    <p>Vous avez maintenant accès à tous les salons du serveur <strong>${serverName}</strong>.</p>
                    <p>N'hésitez pas à vous présenter et à participer aux discussions !</p>
                    <p>À bientôt sur Discord !</p>
                `,
                text: `Bienvenue ${username} ! Votre compte a été vérifié avec succès sur ${serverName}.`
            };

            await this.transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi de l\'email de bienvenue:', error);
            return { success: false, error: 'Impossible d\'envoyer l\'email' };
        }
    }
}

// Instance singleton
export const emailService = new EmailService();
