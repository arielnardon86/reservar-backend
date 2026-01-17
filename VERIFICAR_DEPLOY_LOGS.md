# 🔍 Cómo Verificar los Deploy Logs en Railway

## 📍 Dónde Encontrar los Logs Correctos

El error 502 "connection refused" significa que el backend no está respondiendo. Necesitas ver los **Deploy Logs** (no HTTP Logs) para saber por qué.

### Paso 1: Ir a Deploy Logs

1. En Railway, ve a tu servicio `turnero-backend`
2. En la parte superior, verás estas pestañas:
   - **Details**
   - **Build Logs** ← Aquí están los logs del build
   - **Deploy Logs** ← **AQUÍ están los logs de cuando el backend inicia**
   - **HTTP Logs** ← Estos son los logs de requests (lo que ya viste)

3. Click en **"Deploy Logs"**

### Paso 2: Qué Buscar

En los Deploy Logs, busca:

#### ✅ Si el Backend Inició Correctamente:

Deberías ver algo como:
```
🚀 Backend running on http://localhost:XXXX
🌐 CORS Configuration:
  - NODE_ENV: production
  - ALLOWED_ORIGINS: ...
```

#### ❌ Si el Backend NO Inició:

Busca errores como:
- `Error: Cannot connect to database`
- `PrismaClientInitializationError`
- `Environment variable not found: DATABASE_URL`
- `Error: listen EADDRINUSE` (puerto ocupado)
- Cualquier stack trace o error en rojo

### Paso 3: Errores Comunes

#### Error: "DATABASE_URL not found"
```
PrismaClientInitializationError: Environment variable not found: DATABASE_URL
```
**Solución:** Agrega `DATABASE_URL` en Railway → Variables

#### Error: "Cannot connect to database"
```
Error: Can't reach database server
```
**Solución:** Verifica que `DATABASE_URL` sea correcta y que la base de datos esté accesible

#### Error: "Migration failed"
```
Error: Migration failed
```
**Solución:** Verifica que las migrations estén en `prisma/migrations/` y que `DATABASE_URL` sea correcta

#### Error: "Module not found"
```
Error: Cannot find module '...'
```
**Solución:** El build no fue exitoso, verifica Build Logs

---

## 📋 Checklist de Verificación

1. **Ve a Deploy Logs** (no HTTP Logs)
2. **Busca el mensaje "Backend running"**
   - ✅ Si lo ves → El backend inició, pero hay otro problema
   - ❌ Si NO lo ves → El backend no está iniciando (busca errores)

3. **Si hay errores:**
   - Copia el error completo
   - Verifica qué variable de entorno falta
   - Verifica que `DATABASE_URL` esté configurada

---

## 💡 Qué Compartir

Si necesitas ayuda, comparte:
1. **Las últimas 50-100 líneas de Deploy Logs**
2. **Cualquier error en rojo que veas**
3. **Si ves el mensaje "Backend running" o no**

---

**¿Qué ves en los Deploy Logs? ¿Hay algún error o ves el mensaje "Backend running"?**

