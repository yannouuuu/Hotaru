# 🚀 Script de déploiement Heroku pour Hotaru
# Usage: .\deploy-heroku.ps1

param(
    [Parameter(Mandatory=$false)]
    [string]$AppName = "hotaru-bot-app"
)

Write-Host "🎓 Déploiement de Hotaru sur Heroku" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

# Vérifier si Heroku CLI est installé
Write-Host "📦 Vérification de Heroku CLI..." -ForegroundColor Yellow

# Chercher heroku dans le PATH ou dans l'emplacement par défaut
$herokuCmd = Get-Command heroku -ErrorAction SilentlyContinue
if (-Not $herokuCmd) {
    # Essayer le chemin par défaut
    $defaultHerokuPath = "C:\Program Files\heroku\bin\heroku.cmd"
    if (Test-Path $defaultHerokuPath) {
        Write-Host "✅ Heroku CLI trouvé (utilisation du chemin complet)" -ForegroundColor Yellow
        Set-Alias -Name heroku -Value $defaultHerokuPath -Scope Script
    } else {
        Write-Host "❌ Heroku CLI n'est pas installé!" -ForegroundColor Red
        Write-Host "Installez-le avec: winget install Heroku.HerokuCLI" -ForegroundColor Yellow
        Write-Host "Ou exécutez: .\fix-heroku-path.ps1" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✅ Heroku CLI installé et dans le PATH" -ForegroundColor Green
}

# Vérifier si .env existe
Write-Host "`n📝 Vérification du fichier .env..." -ForegroundColor Yellow
if (-Not (Test-Path ".env")) {
    Write-Host "❌ Fichier .env introuvable!" -ForegroundColor Red
    Write-Host "Créez-le à partir de env.example: cp env.example .env" -ForegroundColor Yellow
    exit 1
}

# Lire les variables d'environnement
Write-Host "✅ Fichier .env trouvé" -ForegroundColor Green
Write-Host "`n🔑 Chargement des variables d'environnement..." -ForegroundColor Yellow

$envVars = @{}
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        if ($value) {
            $envVars[$key] = $value
        }
    }
}

Write-Host "✅ $($envVars.Count) variables chargées" -ForegroundColor Green

# Vérifier les variables requises
$requiredVars = @('DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID')
$missingVars = @()

foreach ($var in $requiredVars) {
    if (-Not $envVars.ContainsKey($var) -or -Not $envVars[$var]) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "❌ Variables requises manquantes dans .env:" -ForegroundColor Red
    $missingVars | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
    exit 1
}

Write-Host "✅ Toutes les variables requises sont présentes" -ForegroundColor Green

# Demander confirmation
Write-Host "`n⚠️  Attention: Vos variables d'environnement vont être envoyées à Heroku" -ForegroundColor Yellow
Write-Host "Application: $AppName" -ForegroundColor Cyan
$confirm = Read-Host "Continuer? (o/n)"

if ($confirm -ne "o" -and $confirm -ne "O" -and $confirm -ne "yes") {
    Write-Host "❌ Déploiement annulé" -ForegroundColor Red
    exit 0
}

# Vérifier si l'app existe déjà
Write-Host "`n🔍 Vérification de l'application Heroku..." -ForegroundColor Yellow
$appExists = $false
try {
    heroku apps:info --app $AppName 2>&1 | Out-Null
    $appExists = $true
    Write-Host "✅ Application '$AppName' existe déjà" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  Application '$AppName' n'existe pas encore" -ForegroundColor Cyan
}

# Créer l'app si nécessaire
if (-Not $appExists) {
    Write-Host "`n🆕 Création de l'application Heroku..." -ForegroundColor Yellow
    try {
        heroku create $AppName
        Write-Host "✅ Application créée: $AppName" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erreur lors de la création de l'application" -ForegroundColor Red
        Write-Host "Le nom '$AppName' est peut-être déjà pris. Essayez un autre nom:" -ForegroundColor Yellow
        Write-Host ".\deploy-heroku.ps1 -AppName 'votre-nom-unique'" -ForegroundColor Cyan
        exit 1
    }
    
    # Ajouter le buildpack Bun
    Write-Host "`n📦 Ajout du buildpack Bun..." -ForegroundColor Yellow
    heroku buildpacks:add https://github.com/xmakina/heroku-buildpack-bun.git --app $AppName
    Write-Host "✅ Buildpack Bun ajouté" -ForegroundColor Green
}

# Configurer les variables d'environnement
Write-Host "`n🔧 Configuration des variables d'environnement..." -ForegroundColor Yellow
$configuredCount = 0
foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    try {
        heroku config:set "$key=$value" --app $AppName | Out-Null
        $configuredCount++
        Write-Host "  ✅ $key" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  Erreur pour $key" -ForegroundColor Yellow
    }
}
Write-Host "✅ $configuredCount variables configurées" -ForegroundColor Green

# Vérifier Git
Write-Host "`n📚 Vérification de Git..." -ForegroundColor Yellow
try {
    git status | Out-Null
    Write-Host "✅ Dépôt Git trouvé" -ForegroundColor Green
} catch {
    Write-Host "❌ Pas de dépôt Git!" -ForegroundColor Red
    Write-Host "Initialisez avec: git init" -ForegroundColor Yellow
    exit 1
}

# Vérifier si Procfile est commité
$procfileStatus = git status --porcelain Procfile
if ($procfileStatus) {
    Write-Host "⚠️  Procfile a des modifications non commitées" -ForegroundColor Yellow
    Write-Host "Ajout et commit de Procfile..." -ForegroundColor Yellow
    git add Procfile
    git commit -m "Add Procfile for Heroku deployment"
    Write-Host "✅ Procfile commité" -ForegroundColor Green
}

# Demander confirmation pour le déploiement
Write-Host "`n🚀 Prêt à déployer!" -ForegroundColor Cyan
$deploy = Read-Host "Déployer maintenant sur Heroku? (o/n)"

if ($deploy -ne "o" -and $deploy -ne "O" -and $deploy -ne "yes") {
    Write-Host "`nℹ️  Configuration terminée sans déploiement" -ForegroundColor Cyan
    Write-Host "Pour déployer manuellement:" -ForegroundColor Yellow
    Write-Host "  git push heroku main" -ForegroundColor Cyan
    exit 0
}

# Déployer
Write-Host "`n📤 Déploiement sur Heroku..." -ForegroundColor Yellow
try {
    git push heroku main
    Write-Host "✅ Code déployé!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Erreur lors du déploiement" -ForegroundColor Yellow
    Write-Host "Vérifiez les logs ci-dessus pour plus de détails" -ForegroundColor Yellow
}

# Démarrer le worker
Write-Host "`n⚡ Démarrage du worker..." -ForegroundColor Yellow
heroku ps:scale worker=1 --app $AppName
Write-Host "✅ Worker démarré" -ForegroundColor Green

# Afficher les logs
Write-Host "`n📜 Logs du bot (Ctrl+C pour quitter):" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────" -ForegroundColor Cyan
heroku logs --tail --app $AppName

Write-Host "`n═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 Déploiement terminé!" -ForegroundColor Green
Write-Host "`nCommandes utiles:" -ForegroundColor Cyan
Write-Host "  heroku logs --tail --app $AppName" -ForegroundColor Yellow
Write-Host "  heroku restart --app $AppName" -ForegroundColor Yellow
Write-Host "  heroku ps --app $AppName" -ForegroundColor Yellow
Write-Host "  heroku open --app $AppName" -ForegroundColor Yellow

