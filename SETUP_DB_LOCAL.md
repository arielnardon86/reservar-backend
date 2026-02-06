# 🗄️ Configuración Rápida de Base de Datos Local

## Opción Más Fácil: Docker Desktop (Recomendado)

### Paso 1: Instalar Docker Desktop
1. Descarga Docker Desktop para Windows: https://www.docker.com/products/docker-desktop
2. Instala y reinicia tu computadora
3. Abre Docker Desktop y espera a que inicie

### Paso 2: Iniciar PostgreSQL
```powershell
cd backend
docker-compose up -d
```

### Paso 3: Crear archivo .env
Crea un archivo `.env` en la carpeta `backend` con este contenido:

```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/reservar_db?schema=public"
JWT_SECRET=super-secret-jwt-key-change-this-in-production-12345
JWT_EXPIRATION=7d
MAGIC_LINK_EXPIRATION=15m
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
RESEND_API_KEY=
RESEND_FROM_EMAIL=
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Paso 4: Ejecutar migraciones
```powershell
npx prisma migrate dev --name add_super_admin_and_tenant_active
```

---

## Opción Alternativa: PostgreSQL Local

### Paso 1: Instalar PostgreSQL
1. Descarga desde: https://www.postgresql.org/download/windows/
2. Ejecuta el instalador
3. **Durante la instalación:**
   - Configura una contraseña para el usuario `postgres` (anótala)
   - Marca la opción para agregar PostgreSQL al PATH

### Paso 2: Crear base de datos
Abre PowerShell y ejecuta:

```powershell
# Conectar a PostgreSQL (te pedirá la contraseña que configuraste)
psql -U postgres

# Dentro de psql, ejecuta:
CREATE DATABASE reservar_db;

# Salir de psql
\q
```

### Paso 3: Crear archivo .env
Crea un archivo `.env` en la carpeta `backend` con este contenido (reemplaza `TU_CONTRASEÑA` con la contraseña que configuraste):

```env
DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/reservar_db?schema=public"
JWT_SECRET=super-secret-jwt-key-change-this-in-production-12345
JWT_EXPIRATION=7d
MAGIC_LINK_EXPIRATION=15m
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
RESEND_API_KEY=
RESEND_FROM_EMAIL=
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Paso 4: Ejecutar migraciones
```powershell
npx prisma migrate dev --name add_super_admin_and_tenant_active
```

---

## Verificar que Funciona

```powershell
# Abrir Prisma Studio (interfaz visual de la base de datos)
npx prisma studio
```

Si se abre en el navegador, ¡todo está funcionando! 🎉

---

## Comandos Útiles

### Si usas Docker:
```powershell
# Ver logs
docker-compose logs -f postgres

# Detener PostgreSQL
docker-compose down

# Reiniciar
docker-compose restart
```

### Si usas PostgreSQL local:
```powershell
# Conectar a la base de datos
psql -U postgres -d reservar_db

# Ver todas las bases de datos
psql -U postgres -c "\l"
```
