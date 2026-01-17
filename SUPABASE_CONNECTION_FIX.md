# 🔧 Solución: Error de Conexión a Supabase

## ❌ Error Actual

```
Error: P1001: Can't reach database server at `db.xijcnkdwrkfyajyyuwqe.supabase.co:5432`
```

## ✅ Solución: Usar Connection Pooler

Supabase requiere usar el **Connection Pooler** en lugar de la conexión directa para Prisma.

---

## 📍 Cómo Obtener la URL Correcta

### Paso 1: Ve a Supabase Dashboard

1. Ve a tu proyecto en Supabase
2. **Settings** → **Database**
3. Busca la sección **"Connection string"** o **"Connection pooling"**

### Paso 2: Selecciona "Session mode" o "Transaction mode"

En lugar de usar la conexión directa (`db.xxxxx.supabase.co:5432`), usa el **pooler**:

**Session mode:**
```
postgresql://postgres.xijcnkdwrkfyajyyuwqe:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Transaction mode:**
```
postgresql://postgres.xijcnkdwrkfyajyyuwqe:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

### Paso 3: Formato Final

Tu DATABASE_URL debería verse así:

```env
DATABASE_URL="postgresql://postgres.xijcnkdwrkfyajyyuwqe:Maro1905,.10@aws-0-us-east-1.pooler.supabase.com:6543/postgres?schema=public"
```

**Nota importante:**
- Usa el **pooler** (`pooler.supabase.com`) no la conexión directa (`db.xxxxx.supabase.co`)
- El puerto puede ser `6543` (Session mode) o `5432` (Transaction mode)
- Agrega `?schema=public` al final

---

## 🔄 Actualizar .env

Actualiza tu archivo `.env` con la URL del pooler:

```bash
cd "/Users/marianonardon/Documents/turnero-backend"
```

Edita el archivo `.env` y cambia la DATABASE_URL por la del pooler.

---

## ✅ Verificar

Después de actualizar, prueba:

```bash
npm run prisma:migrate -- --name init
```

---

## 🐛 Si Aún No Funciona

### Opción 1: Verificar Password

Asegúrate de que la password no tenga caracteres especiales que necesiten ser escapados. Si tiene caracteres especiales, puedes usar URL encoding:

- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- etc.

### Opción 2: Resetear Password

1. Ve a Supabase Dashboard
2. **Settings** → **Database**
3. Busca **"Database password"**
4. Click en **"Reset database password"**
5. Copia la nueva password
6. Actualiza el `.env`

### Opción 3: Verificar Región

El pooler puede tener una URL diferente según la región. Verifica en Supabase Dashboard cuál es la URL correcta para tu región.

---

## 📝 Ejemplo Completo

```env
# Usando Session mode (puerto 6543)
DATABASE_URL="postgresql://postgres.xijcnkdwrkfyajyyuwqe:Maro1905,.10@aws-0-us-east-1.pooler.supabase.com:6543/postgres?schema=public"

# O usando Transaction mode (puerto 5432)
DATABASE_URL="postgresql://postgres.xijcnkdwrkfyajyyuwqe:Maro1905,.10@aws-0-us-east-1.pooler.supabase.com:5432/postgres?schema=public"
```


