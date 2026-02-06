# Script para configurar base de datos PostgreSQL local
# Opción 1: Usando Docker (recomendado)
# Opción 2: PostgreSQL instalado localmente

Write-Host "🗄️  Configuración de Base de Datos Local para ReservAr" -ForegroundColor Cyan
Write-Host ""

# Verificar si Docker está disponible
$dockerAvailable = $false
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerAvailable = $true
        Write-Host "✅ Docker detectado: $dockerVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Docker no está disponible" -ForegroundColor Yellow
}

# Verificar si PostgreSQL está instalado localmente
$pgAvailable = $false
try {
    $pgVersion = psql --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $pgAvailable = $true
        Write-Host "✅ PostgreSQL detectado: $pgVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  PostgreSQL no está instalado localmente" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Selecciona una opción:" -ForegroundColor Cyan
Write-Host "1. Usar Docker (requiere Docker Desktop instalado)"
Write-Host "2. Usar PostgreSQL local (requiere instalación previa)"
Write-Host "3. Instrucciones para instalar PostgreSQL en Windows"
Write-Host ""

$opcion = Read-Host "Opción (1-3)"

switch ($opcion) {
    "1" {
        if (-not $dockerAvailable) {
            Write-Host "❌ Docker no está disponible. Por favor instala Docker Desktop:" -ForegroundColor Red
            Write-Host "   https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host ""
        Write-Host "🐳 Iniciando PostgreSQL con Docker..." -ForegroundColor Cyan
        
        # Verificar si el contenedor ya existe
        $containerExists = docker ps -a --filter "name=reservar-postgres" --format "{{.Names}}"
        
        if ($containerExists -eq "reservar-postgres") {
            Write-Host "📦 Contenedor ya existe. Iniciando..." -ForegroundColor Yellow
            docker start reservar-postgres
        } else {
            Write-Host "📦 Creando e iniciando contenedor..." -ForegroundColor Yellow
            docker-compose up -d
        }
        
        Write-Host ""
        Write-Host "⏳ Esperando a que PostgreSQL esté listo..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        
        # Verificar que esté corriendo
        $isRunning = docker ps --filter "name=reservar-postgres" --format "{{.Names}}"
        if ($isRunning -eq "reservar-postgres") {
            Write-Host "✅ PostgreSQL está corriendo en localhost:5432" -ForegroundColor Green
            Write-Host ""
            Write-Host "📝 Configuración para .env:" -ForegroundColor Cyan
            Write-Host 'DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/reservar_db?schema=public' -ForegroundColor White
        } else {
            Write-Host "❌ Error al iniciar PostgreSQL" -ForegroundColor Red
            exit 1
        }
    }
    
    "2" {
        if (-not $pgAvailable) {
            Write-Host "❌ PostgreSQL no está instalado localmente." -ForegroundColor Red
            Write-Host "   Por favor instala PostgreSQL o usa la opción 1 (Docker)" -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host ""
        Write-Host "📝 Configurando PostgreSQL local..." -ForegroundColor Cyan
        
        $dbName = Read-Host "Nombre de la base de datos (default: reservar_db)"
        if ([string]::IsNullOrWhiteSpace($dbName)) {
            $dbName = "reservar_db"
        }
        
        $dbUser = Read-Host "Usuario PostgreSQL (default: postgres)"
        if ([string]::IsNullOrWhiteSpace($dbUser)) {
            $dbUser = "postgres"
        }
        
        $dbPassword = Read-Host "Contraseña PostgreSQL" -AsSecureString
        $dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
        )
        
        Write-Host ""
        Write-Host "🔧 Creando base de datos..." -ForegroundColor Yellow
        
        # Crear base de datos
        $env:PGPASSWORD = $dbPasswordPlain
        $createDbCmd = "CREATE DATABASE $dbName;" | psql -U $dbUser -h localhost -p 5432 -d postgres 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Base de datos '$dbName' creada exitosamente" -ForegroundColor Green
        } else {
            if ($createDbCmd -match "already exists") {
                Write-Host "⚠️  La base de datos '$dbName' ya existe" -ForegroundColor Yellow
            } else {
                Write-Host "❌ Error al crear la base de datos: $createDbCmd" -ForegroundColor Red
                exit 1
            }
        }
        
        Write-Host ""
        Write-Host "📝 Configuración para .env:" -ForegroundColor Cyan
        $dbUrl = "postgresql://$dbUser`:$dbPasswordPlain@localhost:5432/$dbName?schema=public"
        Write-Host "DATABASE_URL=$dbUrl" -ForegroundColor White
        
        Remove-Item Env:\PGPASSWORD
    }
    
    "3" {
        Write-Host ""
        Write-Host "📥 Instrucciones para instalar PostgreSQL en Windows:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Opción A: Instalador oficial (recomendado)" -ForegroundColor Yellow
        Write-Host "1. Descarga PostgreSQL desde: https://www.postgresql.org/download/windows/" -ForegroundColor White
        Write-Host "2. Ejecuta el instalador y sigue las instrucciones" -ForegroundColor White
        Write-Host "3. Durante la instalación, configura una contraseña para el usuario 'postgres'" -ForegroundColor White
        Write-Host "4. Asegúrate de agregar PostgreSQL al PATH durante la instalación" -ForegroundColor White
        Write-Host ""
        Write-Host "Opción B: Usando Chocolatey (si lo tienes instalado)" -ForegroundColor Yellow
        Write-Host "   choco install postgresql15" -ForegroundColor White
        Write-Host ""
        Write-Host "Opción C: Usar Docker Desktop (más fácil)" -ForegroundColor Yellow
        Write-Host "1. Instala Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor White
        Write-Host "2. Ejecuta este script nuevamente y selecciona la opción 1" -ForegroundColor White
        Write-Host ""
        Write-Host "Después de instalar, ejecuta este script nuevamente y selecciona la opción 2" -ForegroundColor Cyan
    }
    
    default {
        Write-Host "❌ Opción inválida" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Crea un archivo .env en la carpeta backend con la DATABASE_URL mostrada arriba" -ForegroundColor White
Write-Host "2. Ejecuta: npx prisma migrate dev --name add_super_admin_and_tenant_active" -ForegroundColor White
Write-Host "3. Ejecuta: npm run create-super-admin" -ForegroundColor White
