# 🔄 Ejecutar Migrations en Railway

## ✅ Solución Automática (Recomendada)

Ya actualicé `package.json` para que:
- **Build**: Genera Prisma Client automáticamente
- **Start Prod**: Ejecuta migrations antes de iniciar

**No necesitas hacer nada más**, solo asegúrate de que `DATABASE_URL` esté configurada en Railway.

---

## 🔧 Opción 1: Ejecutar desde Terminal de Railway

1. **En Railway Dashboard:**
   - Ve a tu servicio NestJS
   - Click en la pestaña **"Deployments"**
   - En el último deployment, click en los **3 puntos** (⋮) → **"Open Terminal"**

2. **En la terminal, ejecuta:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Listo** ✅

---

## 🔧 Opción 2: Desde tu Máquina Local (Más Fácil)

1. **Obtener DATABASE_URL de Railway:**
   - Railway → Tu servicio NestJS → **"Variables"** tab
   - Copia el valor de `DATABASE_URL`

2. **En tu terminal local:**
   ```bash
   cd "/Users/marianonardon/Documents/turnero-backend"
   
   # Exportar DATABASE_URL temporalmente
   export DATABASE_URL="postgresql://..."  # Pega tu DATABASE_URL aquí
   
   # Ejecutar migrations
   npx prisma migrate deploy
   
   # (Opcional) Verificar que funcionó
   npx prisma studio  # Abre interfaz visual de la BD
   ```

3. **Listo** ✅

---

## 🔧 Opción 3: Usar Railway CLI

1. **Instalar Railway CLI:**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Conectar al proyecto:**
   ```bash
   cd "/Users/marianonardon/Documents/turnero-backend"
   railway link
   ```

4. **Ejecutar migrations:**
   ```bash
   railway run npx prisma migrate deploy
   ```

---

## ✅ Cambios en package.json (Ya aplicados)

Ya actualicé los scripts para que las migrations se ejecuten automáticamente:

```json
{
  "scripts": {
    "build": "nest build && npx prisma generate",
    "start:prod": "npx prisma migrate deploy && node dist/main",
    "postinstall": "npx prisma generate"
  }
}
```

**Esto significa que:**
- ✅ En cada build, Prisma Client se genera automáticamente
- ✅ Al iniciar en producción, las migrations se ejecutan automáticamente
- ✅ No necesitas hacer nada manualmente

---

## 🧪 Verificar que Funcionó

### Opción 1: Desde Railway Logs

1. Ve a tu servicio → **"Deploy Logs"**
2. Busca líneas como:
   ```
   ✅ Applied migration: 20260112030753_init
   🚀 Backend running on port 3001
   ```

### Opción 2: Desde Prisma Studio

```bash
cd "/Users/marianonardon/Documents/turnero-backend"
export DATABASE_URL="postgresql://..."  # Tu DATABASE_URL de Railway
npx prisma studio
```

Si Prisma Studio se abre y ves las tablas, significa que las migrations funcionaron.

---

## 🆘 Si Aún Tiene Problemas

### Error: "Migration already applied"

**Solución:** Está bien, significa que ya se ejecutaron. Continúa.

### Error: "Can't reach database server"

**Solución:**
1. Verifica que `DATABASE_URL` es correcta
2. Verifica que el servicio PostgreSQL está corriendo en Railway
3. Si usas Supabase, verifica que el connection string es correcto

### Error: "Prisma Client not generated"

**Solución:**
- El script `build` ahora incluye `npx prisma generate`
- Si aún falla, ejecuta manualmente: `npx prisma generate`

---

## 💡 Recomendación

**La opción más fácil es la 2 (desde tu máquina local):**
- Es más rápida
- Puedes ver el output completo
- Puedes usar Prisma Studio para verificar

**O simplemente redeploy** - con los cambios en `package.json`, las migrations se ejecutarán automáticamente.

---

**¿Cuál opción prefieres usar?** 🚀


