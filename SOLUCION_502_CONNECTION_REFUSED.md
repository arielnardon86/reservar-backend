# 🔧 Solución: Error 502 Connection Refused en Railway

## 🔴 Problema

El error muestra:
- **HTTP Status:** 502
- **Error:** `connection refused` (repetido 3 veces)
- **Response Details:** "Retried single replica"

Esto significa que Railway no puede conectarse al backend, aunque esté marcado como "Active".

---

## ✅ Soluciones Paso a Paso

### 1. Verificar Logs de Deploy

En Railway → **Deploy Logs**, busca:
- ✅ Si el build fue exitoso
- ✅ Si el backend inició correctamente
- ❌ Errores al iniciar (DATABASE_URL, Prisma, etc.)

### 2. Verificar Variables de Entorno en Railway

Asegúrate de que estas variables estén configuradas:

**Obligatorias:**
- `DATABASE_URL` - Connection string de PostgreSQL
- `PORT` - Railway lo asigna automáticamente (no necesitas configurarlo manualmente)

**Opcionales pero recomendadas:**
- `NODE_ENV=production`
- `ALLOWED_ORIGINS=https://turnero-frontend.vercel.app,http://localhost:3000`
- `JWT_SECRET` - Si usas autenticación
- `RESEND_API_KEY` - Si usas emails

### 3. Verificar Comando de Start

En Railway → **Settings** → **Deploy**, verifica:

**Start Command debe ser:**
```bash
npm run start:prod
```

O si Railway detecta automáticamente:
```bash
node dist/main.js
```

### 4. Verificar que el Backend Escucha en el Puerto Correcto

El código en `src/main.ts` ya está correcto:
```typescript
const port = process.env.PORT || 3001;
await app.listen(port);
```

Railway asigna automáticamente el puerto en `process.env.PORT`, así que esto debería funcionar.

### 5. Verificar Prisma Migrations

El script `start:prod` ejecuta migrations:
```json
"start:prod": "npx prisma migrate deploy && node dist/main"
```

Si las migrations fallan, el backend no iniciará.

**Solución:**
1. Ve a Railway → **Deploy Logs**
2. Busca errores relacionados con Prisma
3. Si hay errores, ejecuta migrations manualmente o verifica `DATABASE_URL`

### 6. Verificar Logs de la Aplicación

En Railway → **Deploy Logs** (no HTTP Logs), busca:

**Si el backend inició correctamente, deberías ver:**
```
🚀 Backend running on http://localhost:XXXX
🌐 CORS Configuration:
  - NODE_ENV: production
  - ALLOWED_ORIGINS: ...
```

**Si NO ves estos mensajes, el backend no está iniciando.**

---

## 🔍 Diagnóstico Rápido

### Checklist:

- [ ] `DATABASE_URL` está configurada en Railway
- [ ] El build fue exitoso (ver Deploy Logs)
- [ ] El backend inició (ver mensaje "Backend running" en logs)
- [ ] No hay errores de Prisma en los logs
- [ ] El Start Command es correcto (`npm run start:prod`)
- [ ] `PORT` está disponible (Railway lo asigna automáticamente)

---

## 🚨 Errores Comunes y Soluciones

### Error: "Cannot connect to database"

**Causa:** `DATABASE_URL` incorrecta o base de datos no accesible.

**Solución:**
1. Verifica `DATABASE_URL` en Railway
2. Verifica que la base de datos esté activa
3. Prueba la conexión desde Railway

### Error: "Prisma migrate deploy failed"

**Causa:** Migrations no aplicadas o schema desactualizado.

**Solución:**
1. Verifica que todas las migrations estén en `prisma/migrations/`
2. Verifica que `DATABASE_URL` sea correcta
3. Si es necesario, ejecuta migrations manualmente

### Error: "Module not found" o errores de importación

**Causa:** El build no generó correctamente los archivos.

**Solución:**
1. Verifica que el build fue exitoso
2. Verifica que `dist/` contiene los archivos compilados
3. Rebuild el proyecto

### Error: Backend inicia pero se cae inmediatamente

**Causa:** Error en el código al iniciar (conexión a BD, etc.).

**Solución:**
1. Revisa los logs completos de la aplicación
2. Busca el error específico que causa el crash
3. Verifica variables de entorno faltantes

---

## 📋 Pasos de Verificación

1. **Ve a Railway → Deploy Logs**
   - Busca el último deployment
   - Verifica que el build fue exitoso
   - Busca el mensaje "Backend running"

2. **Si NO ves "Backend running":**
   - Busca errores en los logs
   - Verifica variables de entorno
   - Verifica que `DATABASE_URL` sea correcta

3. **Si ves "Backend running" pero sigue el 502:**
   - Verifica que el puerto sea correcto
   - Verifica que Railway pueda conectarse al puerto
   - Revisa HTTP Logs para más detalles

---

## 💡 Próximos Pasos

1. **Revisa Deploy Logs** en Railway para ver qué está pasando
2. **Verifica variables de entorno** (especialmente `DATABASE_URL`)
3. **Comparte los logs** si necesitas ayuda adicional

¿Qué ves en los Deploy Logs? ¿Hay algún error específico al iniciar el backend?

