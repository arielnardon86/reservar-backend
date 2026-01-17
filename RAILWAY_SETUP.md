# 🚂 Configuración de Railway para Backend

## 🔴 Error Actual

```
PrismaClientInitializationError: error: Environment variable not found: DATABASE_URL
```

**Causa:** Falta la variable `DATABASE_URL` en Railway.

---

## ✅ Solución: Configurar Variables de Entorno en Railway

### Opción 1: Usar PostgreSQL de Railway (Recomendado)

#### Paso 1: Crear Base de Datos PostgreSQL

1. **En Railway Dashboard:**
   - Ve a tu proyecto
   - Click en **"+ New"** → **"Database"** → **"Add PostgreSQL"**
   - Railway creará una instancia de PostgreSQL automáticamente

2. **Railway automáticamente:**
   - Crea la variable `DATABASE_URL` en tu servicio NestJS
   - Conecta el servicio con la base de datos

3. **Verificar:**
   - Ve a tu servicio NestJS → **"Variables"**
   - Deberías ver `DATABASE_URL` automáticamente agregada

#### Paso 2: Ejecutar Migrations

1. **Opción A: Desde Railway (Terminal)**
   - Ve a tu servicio NestJS → **"Deploy Logs"** o **"Settings"** → **"Deployments"**
   - Click en **"Settings"** → **"Build"**
   - Agrega un **Post Deploy Command**:
     ```bash
     npx prisma migrate deploy
     ```

2. **Opción B: Desde tu máquina local**
   ```bash
   # Conectar tu Prisma a Railway PostgreSQL
   # Obtén DATABASE_URL de Railway → Variables
   export DATABASE_URL="postgresql://..."
   cd turnero-backend
   npx prisma migrate deploy
   ```

---

### Opción 2: Usar Supabase PostgreSQL

#### Paso 1: Obtener Connection String de Supabase

1. **En Supabase Dashboard:**
   - Ve a tu proyecto
   - **Settings** → **Database**
   - Copia la **"Connection string"** (URI format)
   - Formato: `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres`

#### Paso 2: Configurar en Railway

1. **En Railway Dashboard:**
   - Ve a tu servicio NestJS
   - Click en **"Variables"** tab
   - Click en **"+ New Variable"**

2. **Agregar Variable:**
   - **Key**: `DATABASE_URL`
   - **Value**: Pega el connection string de Supabase
   - **Generate Variable** (si quieres que Railway genere una)

3. **Guardar**

#### Paso 3: Ejecutar Migrations

```bash
# Desde tu máquina local
export DATABASE_URL="postgresql://..." # Tu connection string
cd turnero-backend
npx prisma migrate deploy
```

---

## 📋 Variables de Entorno Necesarias en Railway

### Variables Mínimas (CRÍTICAS)

```env
# Database (REQUERIDA)
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public

# JWT Secrets (REQUERIDAS)
JWT_SECRET=tu-super-secret-jwt-key-aqui
MAGIC_LINK_SECRET=tu-super-secret-magic-link-key-aqui

# Email (Requerida para enviar emails)
RESEND_API_KEY=re_tu_api_key_aqui
```

### Variables Opcionales (pero recomendadas)

```env
# CORS
ALLOWED_ORIGINS=https://tu-app.vercel.app,http://localhost:3000

# Node Environment
NODE_ENV=production

# Port (Railway lo configura automáticamente, pero puedes especificarlo)
PORT=3001
```

---

## 🔧 Cómo Agregar Variables en Railway

### Método 1: Desde el Dashboard

1. Ve a tu servicio NestJS en Railway
2. Click en **"Variables"** tab
3. Click en **"+ New Variable"**
4. Ingresa:
   - **Key**: Nombre de la variable (ej: `DATABASE_URL`)
   - **Value**: Valor de la variable
5. Click en **"Add"**

### Método 2: Desde Variables Tab

1. Ve a tu **proyecto** (no servicio) en Railway
2. Click en **"Variables"** tab
3. Las variables agregadas aquí se aplican a TODOS los servicios del proyecto
4. Click en **"+ New Variable"** y agrega las variables

---

## 🚀 Generar Secrets Seguros

### Para JWT_SECRET y MAGIC_LINK_SECRET

```bash
# En tu terminal local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ejecuta esto **2 veces** (una para cada secret) y copia los valores generados.

---

## 📝 Checklist Completo

### Base de Datos
- [ ] PostgreSQL creado en Railway O Supabase configurado
- [ ] `DATABASE_URL` configurada en Railway
- [ ] Migrations ejecutadas (`npx prisma migrate deploy`)

### Autenticación
- [ ] `JWT_SECRET` configurada (string aleatorio seguro)
- [ ] `MAGIC_LINK_SECRET` configurada (string aleatorio seguro)

### Email
- [ ] `RESEND_API_KEY` configurada (obtener de resend.com)
- [ ] Verificar que el dominio está verificado en Resend (para producción)

### CORS
- [ ] `ALLOWED_ORIGINS` configurada (incluir tu dominio de Vercel)

---

## 🧪 Verificar que Funciona

### 1. Verificar Logs en Railway

1. Ve a tu servicio → **"Deploy Logs"**
2. Busca:
   - ✅ `🚀 Backend running on port 3001` (o el puerto configurado)
   - ✅ Sin errores de conexión a la base de datos

### 2. Probar el Backend

1. Ve a **"Settings"** → **"Networking"** en Railway
2. Copia la **"Public URL"** (ej: `https://turnero-backend-production.up.railway.app`)
3. Prueba en el navegador o Postman:
   ```
   GET https://tu-backend.railway.app/health
   ```
   (Debería responder, aunque sea 404, significa que está vivo)

---

## 🆘 Troubleshooting

### Error: "DATABASE_URL not found"

**Solución:**
1. Verifica que agregaste `DATABASE_URL` en Railway → Variables
2. Verifica que el valor es correcto (connection string válido)
3. **Redeploy** el servicio después de agregar la variable

### Error: "Can't reach database server"

**Causa:** Connection string incorrecto o base de datos no accesible.

**Solución:**
1. Verifica el connection string
2. Si usas Supabase, asegúrate de usar el connection string con **pooling**:
   ```
   postgresql://postgres:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

### Error: "Migration not found"

**Solución:**
1. Ejecuta migrations manualmente:
   ```bash
   npx prisma migrate deploy
   ```
2. O agrega post-deploy command en Railway

---

## 💡 Tips

1. **Usar Railway PostgreSQL es más fácil:** Se configura automáticamente
2. **Usar Supabase es más económico:** Free tier generoso
3. **Migrations:** Siempre ejecuta `npx prisma migrate deploy` en producción
4. **Variables sensibles:** Nunca las subas a Git, siempre en Railway

---

**¿Necesitas ayuda con algún paso específico?** 🚀


