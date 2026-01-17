# 🗄️ Configuración de PostgreSQL - DATABASE_URL

## 📋 Formato de DATABASE_URL

El formato estándar de PostgreSQL es:

```
postgresql://[usuario]:[password]@[host]:[puerto]/[nombre_base_datos]?schema=public
```

---

## 🔧 Opción 1: PostgreSQL Local (macOS)

### Paso 1: Instalar PostgreSQL

```bash
brew install postgresql@14
brew services start postgresql@14
```

### Paso 2: Crear Base de Datos

```bash
# Crear usuario (si no existe)
createuser -s postgres

# Crear base de datos
createdb turnero_db
```

### Paso 3: DATABASE_URL

```env
DATABASE_URL="postgresql://postgres:@localhost:5432/turnero_db?schema=public"
```

O si configuraste password:

```env
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/turnero_db?schema=public"
```

---

## ☁️ Opción 2: Supabase (Recomendado - Gratis)

### Paso 1: Crear Cuenta

1. Ve a https://supabase.com
2. Crea una cuenta (gratis)
3. Crea un nuevo proyecto

### Paso 2: Obtener DATABASE_URL

1. En tu proyecto de Supabase, ve a **Settings** → **Database**
2. Busca la sección **Connection string**
3. Selecciona **URI** (no Pooler)
4. Copia la URL que se ve así:

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### Paso 3: Reemplazar [YOUR-PASSWORD]

La contraseña la encontraste cuando creaste el proyecto (o puedes resetearla).

**Ejemplo:**
```env
DATABASE_URL="postgresql://postgres.xxxxx:tu_password_aqui@aws-0-us-east-1.pooler.supabase.com:6543/postgres?schema=public"
```

---

## ☁️ Opción 3: Railway (Fácil y Gratis)

### Paso 1: Crear Cuenta

1. Ve a https://railway.app
2. Crea cuenta con GitHub
3. Crea nuevo proyecto → **New** → **Database** → **PostgreSQL**

### Paso 2: Obtener DATABASE_URL

1. Click en tu base de datos PostgreSQL
2. Ve a la pestaña **Variables**
3. Copia `DATABASE_URL`

**Ejemplo:**
```env
DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway"
```

---

## ☁️ Opción 4: Render (Gratis)

### Paso 1: Crear Base de Datos

1. Ve a https://render.com
2. **New** → **PostgreSQL**
3. Configura nombre y región
4. Crea

### Paso 2: Obtener DATABASE_URL

1. En tu base de datos, busca **Internal Database URL**
2. Copia la URL

**Ejemplo:**
```env
DATABASE_URL="postgresql://turnero_user:password@dpg-xxxxx-a/turnero_db"
```

---

## ✅ Verificar Conexión

Una vez que tengas tu DATABASE_URL, puedes probarla:

```bash
# Con psql (si lo tienes instalado)
psql "postgresql://usuario:password@host:puerto/database"

# O desde Node.js
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => console.log('✅ Connected!')).catch(e => console.error('❌ Error:', e));"
```

---

## 📝 Ejemplo Completo de .env

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/turnero_db?schema=public"

# JWT
JWT_SECRET=super-secret-key-change-in-production-12345
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
```

---

## 🎯 Recomendación

**Para desarrollo rápido:** Usa **Supabase** (gratis, fácil, rápido)

**Para producción:** Usa **Railway** o **Render** (más control, escalable)

---

## ⚠️ Importante

- **NUNCA** subas el archivo `.env` a Git
- **NUNCA** compartas tu DATABASE_URL públicamente
- En producción, usa variables de entorno del hosting

---

## 🐛 Troubleshooting

### Error: "connection refused"

- Verifica que PostgreSQL esté corriendo
- Verifica el host y puerto
- Verifica firewall

### Error: "password authentication failed"

- Verifica usuario y password
- En Supabase/Railway, asegúrate de usar la password correcta

### Error: "database does not exist"

- Crea la base de datos primero
- Verifica el nombre en la URL


