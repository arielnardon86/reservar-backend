# 🔄 Ejecutar Migrations con Railway DATABASE_URL

## 🔴 Problema

Estás usando un `DATABASE_URL` de ejemplo. Además, Prisma lee primero el archivo `.env` local, que tiene una URL diferente.

## ✅ Solución: Usar DATABASE_URL de Railway

### Paso 1: Obtener DATABASE_URL de Railway

1. **Ve a Railway Dashboard:**
   - [railway.app](https://railway.app) → Tu proyecto
   - Click en tu servicio NestJS
   - Click en la pestaña **"Variables"**
   - Busca `DATABASE_URL`
   - **Copia el valor completo** (debe ser algo como `postgresql://postgres:xxxxx@xxxxx.up.railway.app:5432/railway`)

### Paso 2: Ejecutar Migrations (Opciones)

#### Opción A: Sobrescribir el .env temporalmente (Recomendado)

```bash
cd "/Users/marianonardon/Documents/turnero-backend"

# Respaldar .env local
cp .env .env.local.backup

# Editar .env temporalmente con DATABASE_URL de Railway
# (Edita el archivo .env y reemplaza DATABASE_URL con la de Railway)

# Ejecutar migrations
npx prisma migrate deploy

# Restaurar .env local después
mv .env.local.backup .env
```

#### Opción B: Usar variable de entorno directamente (Más simple)

```bash
cd "/Users/marianonardon/Documents/turnero-backend"

# Ejecutar migrations con DATABASE_URL de Railway
# (Reemplaza con tu DATABASE_URL real de Railway)
DATABASE_URL="postgresql://postgres:xxxxx@xxxxx.up.railway.app:5432/railway" \
npx prisma migrate deploy --skip-env-validation
```

**Nota:** El flag `--skip-env-validation` evita que Prisma valide el `.env`, pero igualmente necesitas pasar la URL real de Railway.

#### Opción C: Renombrar .env temporalmente (Más seguro)

```bash
cd "/Users/marianonardon/Documents/turnero-backend"

# Renombrar .env para que Prisma no lo lea
mv .env .env.local.temp

# Ejecutar migrations con DATABASE_URL de Railway
DATABASE_URL="postgresql://postgres:xxxxx@xxxxx.up.railway.app:5432/railway" \
npx prisma migrate deploy

# Restaurar .env
mv .env.local.temp .env
```

---

## 📋 Paso a Paso Detallado (Opción C - Recomendada)

### 1. Obtener DATABASE_URL de Railway

1. Ve a [railway.app](https://railway.app)
2. Selecciona tu proyecto
3. Click en tu servicio NestJS
4. Click en **"Variables"** tab
5. Busca `DATABASE_URL`
6. Click en el icono de **copiar** (o selecciona y copia manualmente)

### 2. Ejecutar Migrations

```bash
cd "/Users/marianonardon/Documents/turnero-backend"

# Paso 1: Respaldar .env local
mv .env .env.local.backup

# Paso 2: Ejecutar migrations con DATABASE_URL de Railway
# ⚠️ IMPORTANTE: Reemplaza "postgresql://..." con tu DATABASE_URL real de Railway
DATABASE_URL="postgresql://postgres:PASSWORD@HOST:5432/railway?schema=public" \
npx prisma migrate deploy

# Paso 3: Restaurar .env local
mv .env.local.backup .env
```

---

## ✅ Verificar que Funcionó

Si funciona, verás algo como:

```
Environment variables loaded from process.env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "railway", schema "public"

✅ The following migration(s) have been applied:

migrations/
  └── 20260112030753_init/
      └── migration.sql

All migrations have been successfully applied.
```

---

## 🆘 Troubleshooting

### Error: "Can't reach database server"

**Causa:** La DATABASE_URL es incorrecta o la base de datos no está accesible.

**Solución:**
1. Verifica que copiaste la DATABASE_URL completa de Railway
2. Verifica que no hay espacios extra al copiar
3. Verifica que el servicio PostgreSQL está corriendo en Railway

### Error: "Migration already applied"

**Está bien**, significa que ya se ejecutaron las migrations. Continúa.

### Error: "No migrations found"

**Solución:**
1. Verifica que las migrations están en `prisma/migrations/`
2. Si no hay migrations, créalas primero:
   ```bash
   npx prisma migrate dev --name init
   ```

---

## 💡 Recomendación Final

**La opción más simple:**
1. Renombra `.env` → `.env.local.backup`
2. Ejecuta migrations con `DATABASE_URL` de Railway
3. Restaura `.env`

**O mejor aún:** Simplemente haz redeploy en Railway - con los cambios en `package.json`, las migrations se ejecutarán automáticamente. ✅

---

**¿Ya obtuviste la DATABASE_URL de Railway? Si me ayudas con los primeros caracteres (sin la contraseña completa), puedo ayudarte a verificar el formato.** 🚀

