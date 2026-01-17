# 🚀 Setup Rápido - Backend

## ✅ Paso 1: Crear archivo .env

Crea un archivo llamado `.env` en la carpeta `turnero-backend` con este contenido:

```env
DATABASE_URL="postgresql://postgres:Maro1905,.10@db.xijcnkdwrkfyajyyuwqe.supabase.co:5432/postgres?schema=public"
JWT_SECRET=super-secret-jwt-key-change-this-in-production-12345
JWT_EXPIRATION=7d
MAGIC_LINK_EXPIRATION=15m
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

---

## ✅ Paso 2: Instalar Dependencias

```bash
cd "/Users/marianonardon/Documents/turnero-backend"
npm install
```

---

## ✅ Paso 3: Generar Prisma Client

```bash
npm run prisma:generate
```

---

## ✅ Paso 4: Ejecutar Migrations (Crear Tablas)

```bash
npm run prisma:migrate
```

Cuando te pregunte el nombre de la migration, escribe: `init`

---

## ✅ Paso 5: Ejecutar Backend

```bash
npm run start:dev
```

Deberías ver:
```
🚀 Backend running on http://localhost:3001
```

---

## ✅ Paso 6: Probar Endpoint

Abre otra terminal y prueba:

```bash
curl http://localhost:3001/tenants
```

Deberías ver `[]` (array vacío, que es correcto).

---

## 🎉 ¡Listo!

Si todo funciona, el backend está corriendo y listo para conectar con el frontend.

---

## 🐛 Si hay errores

### Error: "Prisma Client not generated"
```bash
npm run prisma:generate
```

### Error: "Database connection failed"
- Verifica que la password en DATABASE_URL sea correcta
- Verifica que no haya espacios extra en la URL
- Prueba la conexión desde Supabase Dashboard

### Error: "Cannot find module"
```bash
npm install
```


