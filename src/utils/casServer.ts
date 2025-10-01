import { BotClient } from '../types/index.ts';

// Stockage temporaire des sessions de vérification
export const verificationSessions = new Map<string, {
  userId: string;
  username: string;
  expiresAt: number;
}>();

// Créer un serveur web pour gérer les callbacks CAS
export const startCASServer = (client: BotClient) => {
  const PORT = parseInt(process.env.CAS_CALLBACK_PORT || '3000');
  const BASE_URL = process.env.CAS_CALLBACK_URL || `http://localhost:${PORT}`;
  
  const server = Bun.serve({
    port: PORT,
    async fetch(req) {
      const url = new URL(req.url);
      
      // Route de callback CAS
      if (url.pathname === '/cas/callback') {
        const ticket = url.searchParams.get('ticket');
        const state = url.searchParams.get('state');

        if (!ticket || !state) {
          return new Response('Paramètres manquants', { status: 400 });
        }

        // Vérifier que la session existe
        const session = verificationSessions.get(state);
        if (!session) {
          return new Response(
            '<html><body style="font-family: Arial; text-align: center; padding: 50px;">' +
            '<h1>❌ Session expirée</h1>' +
            '<p>Cette session de vérification a expiré ou est invalide.</p>' +
            '<p>Retournez sur Discord et utilisez à nouveau /verify</p>' +
            '</body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }

        // Vérifier que la session n'a pas expiré
        if (Date.now() > session.expiresAt) {
          verificationSessions.delete(state);
          return new Response(
            '<html><body style="font-family: Arial; text-align: center; padding: 50px;">' +
            '<h1>⏰ Session expirée</h1>' +
            '<p>Cette session a expiré (durée : 5 minutes).</p>' +
            '<p>Retournez sur Discord et utilisez à nouveau /verify</p>' +
            '</body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }

        try {
          // Valider le ticket auprès du CAS
          const casUrl = process.env.CAS_URL || 'https://cas.univ-lille.fr/cas';
          const serviceUrl = `${BASE_URL}/cas/callback?state=${state}`;
          const validateUrl = `${casUrl}/serviceValidate?service=${encodeURIComponent(serviceUrl)}&ticket=${ticket}`;

          const response = await fetch(validateUrl);
          const xmlText = await response.text();

          // Parser la réponse XML du CAS
          const isSuccess = xmlText.includes('<cas:authenticationSuccess>');
          const userMatch = xmlText.match(/<cas:user>(.*?)<\/cas:user>/);
          const username = userMatch ? userMatch[1] : null;

          if (isSuccess && username) {
            // Extraire l'email de l'username
            const email = username.includes('@') ? username : `${username}@univ-lille.fr`;

            // Vérifier que c'est bien un email univ-lille
            if (!email.endsWith('@univ-lille.fr')) {
              return new Response(
                '<html><body style="font-family: Arial; text-align: center; padding: 50px;">' +
                '<h1>❌ Domaine invalide</h1>' +
                '<p>Vous devez utiliser un compte @univ-lille.fr</p>' +
                '</body></html>',
                { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
              );
            }

            // Attribuer les rôles sur Discord
            const { addVerifiedUser } = await import('./database.ts');
            const guild = client.guilds.cache.first();
            
            if (guild) {
              const member = await guild.members.fetch(session.userId);
              
              const verifiedRoleId = process.env.ROLE_VERIFIED_ID;
              const studentRoleId = process.env.ROLE_STUDENT_ID;
              
              const rolesToAdd: string[] = [];
              if (verifiedRoleId) rolesToAdd.push(verifiedRoleId);
              if (studentRoleId) rolesToAdd.push(studentRoleId);
              
              if (rolesToAdd.length > 0) {
                await member.roles.add(rolesToAdd);
              }

              // Sauvegarder en base
              addVerifiedUser(session.userId, email);

              // Log
              const { logAction } = await import('./logger.ts');
              await logAction(
                client,
                'Vérification CAS',
                session.username,
                undefined,
                `Email: ${email}`,
                0x00b894,
                'bot'
              );

              console.log(`✅ ${session.username} vérifié via CAS avec ${email}`);
            }

            // Nettoyer la session
            verificationSessions.delete(state);

            return new Response(
              '<html><body style="font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">' +
              '<h1>✅ Vérification réussie !</h1>' +
              '<p style="font-size: 18px;">Votre compte a été vérifié avec succès !</p>' +
              '<p>Email : <strong>' + email + '</strong></p>' +
              '<p style="margin-top: 30px;">Vous pouvez maintenant fermer cette page et retourner sur Discord.</p>' +
              '<p style="font-size: 14px; margin-top: 50px; opacity: 0.8;">Bienvenue sur le serveur BUT Info Lille ! 🎓</p>' +
              '</body></html>',
              { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            );
          } else {
            return new Response(
              '<html><body style="font-family: Arial; text-align: center; padding: 50px;">' +
              '<h1>❌ Authentification échouée</h1>' +
              '<p>Impossible de valider votre authentification CAS.</p>' +
              '<p>Retournez sur Discord et réessayez avec /verify</p>' +
              '</body></html>',
              { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            );
          }
        } catch (error) {
          console.error('Erreur lors de la validation CAS:', error);
          return new Response(
            '<html><body style="font-family: Arial; text-align: center; padding: 50px;">' +
            '<h1>❌ Erreur</h1>' +
            '<p>Une erreur est survenue lors de la vérification.</p>' +
            '<p>Erreur: ' + (error instanceof Error ? error.message : 'Inconnue') + '</p>' +
            '</body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
      }

      // Page d'accueil
      return new Response(
        '<html><body style="font-family: Arial; text-align: center; padding: 50px;">' +
        '<h1>🤖 Hotaru Bot - Serveur CAS</h1>' +
        '<p>Ce serveur gère les authentifications CAS pour le bot Discord.</p>' +
        '<p>Utilisez /verify sur Discord pour vous authentifier.</p>' +
        '</body></html>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    },
  });

  console.log(`🌐 Serveur CAS démarré sur le port ${PORT}`);
  console.log(`🔗 URL de callback: ${BASE_URL}/cas/callback`);
  
  return server;
};

// Générer un lien CAS pour un utilisateur
export const generateCASLink = (userId: string, username: string): string => {
  const PORT = parseInt(process.env.CAS_CALLBACK_PORT || '3000');
  const BASE_URL = process.env.CAS_CALLBACK_URL || `http://localhost:${PORT}`;
  const CAS_URL = process.env.CAS_URL || 'https://cas.univ-lille.fr/cas';
  
  // Générer un token unique
  const state = `${Date.now()}-${userId}-${Math.random().toString(36).substring(7)}`;
  
  // Stocker la session (expire après 5 minutes)
  verificationSessions.set(state, {
    userId,
    username,
    expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
  });

  // Construire l'URL CAS
  const serviceUrl = `${BASE_URL}/cas/callback?state=${state}`;
  const casLoginUrl = `${CAS_URL}/login?service=${encodeURIComponent(serviceUrl)}`;
  
  return casLoginUrl;
};

