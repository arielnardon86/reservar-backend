# 🚀 Turnero Backend - NestJS

Backend API para el sistema de turnos SaaS.

## 📋 Prerequisitos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

## 🚀 Setup Inicial

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Copia `.env.example` a `.env` y configura:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de PostgreSQL.

### 3. Setup de Base de Datos

```bash
# Generar Prisma Client
npm run prisma:generate

# Ejecutar migrations
npm run prisma:migrate

# (Opcional) Abrir Prisma Studio para ver datos
npm run prisma:studio
```

### 4. Ejecutar en Desarrollo

```bash
npm run start:dev
```

El servidor estará en `http://localhost:3001`

## 📁 Estructura del Proyecto

```
src/
├── common/           # Utilidades compartidas
│   ├── decorators/   # Decorators (TenantId)
│   ├── guards/       # Guards (TenantGuard)
│   ├── interceptors/ # Interceptors (TenantInterceptor)
│   └── middleware/   # Middleware (TenantMiddleware)
├── prisma/           # Prisma service y module
├── tenants/          # Módulo de tenants
├── services/         # Módulo de servicios
├── professionals/    # Módulo de profesionales
├── schedules/        # Módulo de horarios
├── appointments/    # Módulo de turnos
├── customers/       # Módulo de clientes
└── auth/            # Módulo de autenticación
```

## 🔌 Endpoints Principales

### Tenants
- `GET /tenants` - Listar todos
- `GET /tenants/slug/:slug` - Obtener por slug (público)
- `POST /tenants` - Crear tenant
- `PATCH /tenants/:id` - Actualizar tenant
- `DELETE /tenants/:id` - Eliminar tenant

## 🔐 Multi-Tenancy

El sistema usa middleware para extraer `tenantId` de:
- Header `X-Tenant-Id` (para admin)
- Query parameter `tenantId` (desarrollo)
- Path parameter (futuro)

Todos los endpoints admin requieren `TenantGuard` para validar tenant.

## 📝 Próximos Pasos

1. Implementar módulos restantes (Services, Professionals, etc.)
2. Implementar autenticación (Magic Link)
3. Implementar cálculo de disponibilidad
4. Implementar emails (Resend)


