# 🚀 Instrucciones de Setup - Backend NestJS

## 📋 Pasos para Configurar

### 1. Instalar Dependencias

```bash
cd "/Users/marianonardon/Documents/turnero-backend"
npm install
```

### 2. Configurar PostgreSQL

**Opción A: PostgreSQL Local**

```bash
# Instalar PostgreSQL (si no lo tienes)
brew install postgresql@14
brew services start postgresql@14

# Crear base de datos
createdb turnero_db
```

**Opción B: PostgreSQL Cloud (Recomendado para desarrollo rápido)**

- **Supabase** (gratis): https://supabase.com
- **Railway**: https://railway.app
- **Render**: https://render.com

Obtén la `DATABASE_URL` de tu proveedor.

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del backend:

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/turnero_db?schema=public"
JWT_SECRET="tu-secret-super-seguro-aqui"
FRONTEND_URL="http://localhost:3000"
PORT=3001
```

### 4. Setup de Prisma

```bash
# Generar Prisma Client
npm run prisma:generate

# Crear y ejecutar migrations
npm run prisma:migrate
```

### 5. (Opcional) Seed de Datos

Puedes crear datos de prueba manualmente o usar Prisma Studio:

```bash
npm run prisma:studio
```

### 6. Ejecutar Backend

```bash
npm run start:dev
```

El servidor estará en `http://localhost:3001`

---

## ✅ Verificación

### Probar Endpoints

**1. Health Check (crear endpoint simple):**
```bash
curl http://localhost:3001/tenants
```

**2. Crear Tenant:**
```bash
curl -X POST http://localhost:3001/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Negocio",
    "slug": "mi-negocio",
    "email": "admin@example.com"
  }'
```

**3. Obtener Tenant por Slug:**
```bash
curl http://localhost:3001/tenants/slug/mi-negocio
```

---

## 🔌 Endpoints Disponibles

### Públicos (Sin autenticación)

- `GET /tenants/slug/:slug` - Obtener tenant por slug
- `GET /services/tenant/:tenantSlug` - Servicios activos
- `GET /professionals/tenant/:tenantSlug` - Profesionales activos
- `GET /appointments/availability?tenantSlug=...&professionalId=...&date=...` - Disponibilidad
- `POST /appointments?tenantSlug=...` - Crear appointment (cliente)

### Admin (Requieren X-Tenant-Id header)

- `GET /tenants` - Listar tenants
- `POST /tenants` - Crear tenant
- `GET /services` - Listar servicios
- `POST /services` - Crear servicio
- `GET /professionals` - Listar profesionales
- `POST /professionals` - Crear profesional
- `GET /schedules` - Horarios
- `GET /appointments` - Listar turnos
- `GET /customers` - Listar clientes

### Auth

- `POST /auth/login` - Enviar magic link
- `GET /auth/callback?token=...` - Verificar magic link

---

## 🐛 Troubleshooting

### Error: "Prisma Client not generated"

```bash
npm run prisma:generate
```

### Error: "Database connection failed"

- Verifica que PostgreSQL esté corriendo
- Verifica la `DATABASE_URL` en `.env`
- Prueba la conexión: `psql $DATABASE_URL`

### Error: "Cannot find module"

```bash
npm install
```

---

## 📝 Próximos Pasos

1. ✅ Backend básico funcionando
2. ⏭️ Conectar frontend con backend
3. ⏭️ Implementar autenticación completa (JWT)
4. ⏭️ Implementar emails (Resend)
5. ⏭️ Implementar jobs (recordatorios)

---

**¡Backend listo para conectar con el frontend!** 🎉


