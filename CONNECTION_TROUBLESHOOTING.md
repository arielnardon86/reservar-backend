# 🔧 Troubleshooting: Conexión a Supabase

## ❌ Error Actual

```
FATAL: Tenant or user not found
```

Esto indica que la URL de conexión no es correcta o el formato del usuario no coincide.

---

## ✅ Solución: Obtener URL Exacta desde Supabase

### Paso 1: Ve a Supabase Dashboard

1. Abre tu proyecto en Supabase
2. Ve a **Settings** (⚙️) → **Database**

### Paso 2: Busca "Connection string"

En la página de Database Settings, busca la sección **"Connection string"** o **"Connection pooling"**.

### Paso 3: Copia la URL Exacta

Supabase te mostrará varias opciones. Para Prisma, necesitas:

**Opción A: Session mode (recomendado para Prisma)**
- Busca la pestaña **"Session mode"**
- Copia la URL completa que se ve así:
  ```
  postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[REGION].pooler.supabase.com:6543/postgres
  ```

**Opción B: Transaction mode**
- Busca la pestaña **"Transaction mode"**
- Copia la URL completa

**Opción C: Direct connection (si el pooler no funciona)**
- Busca **"Direct connection"** o **"Connection string"**
- Copia la URL que se ve así:
  ```
  postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
  ```

### Paso 4: Reemplaza [PASSWORD]

- Si la URL tiene `[PASSWORD]` o `[YOUR-PASSWORD]`, reemplázala con tu password real
- Si tu password tiene caracteres especiales (`,`, `.`, `@`, `#`, etc.), puede que necesites usar URL encoding:
  - `,` → `%2C`
  - `.` → `%2E`
  - `@` → `%40`
  - `#` → `%23`
  - `%` → `%25`

### Paso 5: Agrega `?schema=public`

Al final de la URL, agrega `?schema=public`:

```
postgresql://...postgres?schema=public
```

---

## 📝 Ejemplo de Formato Correcto

```env
# Session mode (puerto 6543)
DATABASE_URL="postgresql://postgres.xijcnkdwrkfyajyyuwqe:TU_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?schema=public"

# O Transaction mode (puerto 5432)
DATABASE_URL="postgresql://postgres.xijcnkdwrkfyajyyuwqe:TU_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres?schema=public"

# O Direct connection (si el pooler no funciona)
DATABASE_URL="postgresql://postgres.xijcnkdwrkfyajyyuwqe:TU_PASSWORD@db.xijcnkdwrkfyajyyuwqe.supabase.co:5432/postgres?schema=public"
```

---

## 🔍 Verificar Password

Si no estás seguro de tu password:

1. Ve a **Settings** → **Database**
2. Busca **"Database password"**
3. Si no la ves, click en **"Reset database password"**
4. Copia la nueva password
5. Actualiza el `.env`

---

## 🧪 Probar Conexión Manualmente

Puedes probar la conexión con `psql` (si lo tienes instalado):

```bash
psql "postgresql://postgres.xijcnkdwrkfyajyyuwqe:TU_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
```

Si funciona, verás el prompt de PostgreSQL. Si no, verás el error específico.

---

## 💡 Recomendación

**Lo más fácil:** Ve a Supabase Dashboard → Settings → Database → Connection string → **Session mode**, copia la URL completa y pégala en tu `.env` reemplazando solo `[PASSWORD]` con tu password real.

---

## ⚠️ Nota sobre Regiones

La URL del pooler puede variar según la región de tu proyecto:
- `aws-0-us-east-1.pooler.supabase.com` (US East)
- `aws-0-us-west-1.pooler.supabase.com` (US West)
- `aws-0-eu-west-1.pooler.supabase.com` (EU West)
- etc.

Verifica en Supabase Dashboard cuál es la región correcta para tu proyecto.


