# Script para configurar .env con Clever Cloud PostgreSQL

$envPath = Join-Path $PSScriptRoot "..\.env"
$envContent = @"
# Database - Clever Cloud PostgreSQL
DATABASE_URL="postgresql://u8kurgkjwt76zwkpdpj7:GkPIly9bLCDD5DG8t1R7ee5bxZMtGU@b7a1zsccvyytxgvqr9wv-postgresql.services.clever-cloud.com:50013/b7a1zsccvyytxgvqr9wv?schema=public"

# JWT
JWT_SECRET=super-secret-jwt-key-change-this-in-production-12345
JWT_EXPIRATION=7d
MAGIC_LINK_EXPIRATION=15m

# App
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Email (opcional por ahora)
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Redis (opcional por ahora)
REDIS_HOST=localhost
REDIS_PORT=6379
"@

Write-Host "🔧 Configurando .env con credenciales de Clever Cloud..." -ForegroundColor Cyan

try {
    $envContent | Out-File -FilePath $envPath -Encoding utf8 -Force
    Write-Host "✅ Archivo .env configurado exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
    Write-Host "1. Ejecuta: npx prisma migrate dev --name add_super_admin_and_tenant_active" -ForegroundColor White
    Write-Host "2. Ejecuta: npm run create-super-admin" -ForegroundColor White
} catch {
    Write-Host "❌ Error al configurar .env: $_" -ForegroundColor Red
    exit 1
}
