# 🔍 Cómo Obtener DATABASE_URL de Supabase

## ⚠️ Lo que tienes ahora

Lo que ves en la pantalla es:
- **Project URL**: Para usar el cliente de Supabase (no lo necesitamos ahora)
- **Publishable API Key**: Para autenticación con Supabase (no lo necesitamos ahora)

## ✅ Lo que necesitamos

Para Prisma/NestJS necesitamos la **DATABASE_URL** (connection string de PostgreSQL).

---

## 📍 Pasos para Encontrar DATABASE_URL

### Paso 1: Ve a Database Settings

En tu proyecto de Supabase:

1. En el menú lateral izquierdo, busca **"Settings"** (⚙️)
2. Click en **"Settings"**
3. En el submenú, click en **"Database"**

### Paso 2: Busca "Connection string"

En la página de Database Settings verás:

- **Connection string** o **Connection pooling**
- Varias opciones: **URI**, **JDBC**, **Golang**, etc.

### Paso 3: Selecciona "URI"

1. Busca la sección **"Connection string"**
2. Selecciona la pestaña **"URI"** (no "Session mode" ni "Transaction mode")
3. Verás algo como:

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Paso 4: Reemplaza [PASSWORD]

La password la encontraste cuando creaste el proyecto. Si no la recuerdas:

1. En la misma página de Database Settings
2. Busca **"Database password"** o **"Reset database password"**
3. Puedes resetearla o verla ahí

### Paso 5: Formato Final

Tu DATABASE_URL debería verse así:

```env
DATABASE_URL="postgresql://postgres.xijcnkdwrkfyajyyuwqe:TU_PASSWORD_AQUI@aws-0-us-east-1.pooler.supabase.com:6543/postgres?schema=public"
```

O si usas la connection directa (sin pooler):

```env
DATABASE_URL="postgresql://postgres.xijcnkdwrkfyajyyuwqe:TU_PASSWORD_AQUI@db.xijcnkdwrkfyajyyuwqe.supabase.co:5432/postgres?schema=public"
```

---

## 🎯 Alternativa: Connection Pooling

Si ves opciones de "Connection pooling", puedes usar:

**Session mode:**
```
postgresql://postgres.xijcnkdwrkfyajyyuwqe:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Transaction mode:**
```
postgresql://postgres.xijcnkdwrkfyajyyuwqe:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

Para desarrollo, cualquiera funciona. **Session mode** es más común.

---

## ✅ Verificación Rápida

Una vez que tengas la DATABASE_URL, puedes probarla:

```bash
# Desde el backend
cd "/Users/marianonardon/Documents/turnero-backend"

# Probar conexión (después de npm install)
npm run prisma:generate
npm run prisma:migrate
```

Si funciona, verás que se crean las tablas en Supabase.

---

## 📝 Resumen

1. ✅ Ya tienes proyecto en Supabase
2. ⏭️ Ve a **Settings** → **Database**
3. ⏭️ Copia la **Connection string** (URI)
4. ⏭️ Reemplaza `[PASSWORD]` con tu password
5. ⏭️ Agrega `?schema=public` al final
6. ⏭️ Pégala en tu `.env` como `DATABASE_URL`

---

**¿Necesitas ayuda para encontrarla?** Puedo guiarte paso a paso.


