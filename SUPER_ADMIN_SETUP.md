# 🔐 Super Administrador - Guía de Configuración

## Descripción

Sistema de super administrador que permite gestionar todos los edificios (tenants) de la aplicación desde un panel centralizado.

## Características

- ✅ Ver todos los edificios registrados
- ✅ Ver estadísticas de cada edificio (usuarios, servicios, reservas, clientes)
- ✅ Inactivar/activar edificios sin eliminarlos
- ✅ Eliminar edificios permanentemente (con advertencia)
- ✅ Ver estadísticas globales del sistema

## Configuración Inicial

### 1. Ejecutar Migración de Base de Datos

Primero, necesitas crear y ejecutar la migración para agregar los campos `isActive` a `Tenant` e `isSuperAdmin` a `User`:

```bash
cd backend
npx prisma migrate dev --name add_super_admin_and_tenant_active
```

### 2. Crear Usuario Super Administrador

Después de ejecutar la migración, necesitas crear un usuario super administrador. Puedes hacerlo de dos formas:

#### Opción A: Desde Prisma Studio (Recomendado)

```bash
npx prisma studio
```

1. Ve a la tabla `users`
2. Crea un nuevo usuario o edita uno existente
3. Marca el campo `isSuperAdmin` como `true`
4. Asegúrate de que tenga un `email` y `passwordHash` válidos

#### Opción B: Desde SQL directo

```sql
-- Primero, crea un tenant (o usa uno existente)
-- Luego, actualiza o crea un usuario como super admin:

UPDATE users 
SET "isSuperAdmin" = true 
WHERE email = 'tu-email@ejemplo.com';

-- O crea un nuevo usuario super admin:
INSERT INTO users (id, email, "tenantId", "isSuperAdmin", "role", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'superadmin@reservar.com',
  (SELECT id FROM tenants LIMIT 1), -- Usa un tenant existente o crea uno
  true,
  'admin',
  NOW(),
  NOW()
);
```

#### Opción C: Script de Node.js

Crea un archivo `scripts/create-super-admin.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'superadmin@reservar.com';
  const password = 'tu-contraseña-segura';
  
  // Buscar o crear un tenant para el super admin
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        slug: 'super-admin-tenant',
        name: 'Super Admin Tenant',
        email: email,
        isActive: true,
      },
    });
  }
  
  // Crear o actualizar usuario super admin
  const passwordHash = await bcrypt.hash(password, 10);
  
  await prisma.user.upsert({
    where: { email },
    update: {
      isSuperAdmin: true,
      passwordHash,
    },
    create: {
      email,
      name: 'Super Administrador',
      tenantId: tenant.id,
      role: 'admin',
      isSuperAdmin: true,
      passwordHash,
    },
  });
  
  console.log('✅ Super admin creado exitosamente');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Ejecuta:
```bash
npx ts-node scripts/create-super-admin.ts
```

## Endpoints Disponibles

Todos los endpoints requieren autenticación como super administrador. Por ahora, se autentica mediante el header `X-User-Email` (en producción, deberías usar JWT).

### Base URL: `/super-admin`

### 1. Estadísticas Globales
```
GET /super-admin/stats
```

**Respuesta:**
```json
{
  "tenants": {
    "total": 10,
    "active": 8,
    "inactive": 2
  },
  "users": {
    "total": 25
  },
  "appointments": {
    "total": 150
  },
  "customers": {
    "total": 80
  },
  "services": {
    "total": 30
  }
}
```

### 2. Listar Todos los Tenants
```
GET /super-admin/tenants
```

**Headers requeridos:**
```
X-User-Email: superadmin@reservar.com
```

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "slug": "torre-pacifico",
    "name": "Torre Pacífico",
    "email": "admin@torrepacifico.com",
    "phone": "+54 11 1234-5678",
    "address": "Av. Corrientes 1234",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-20T15:30:00Z",
    "stats": {
      "users": 3,
      "services": 5,
      "appointments": 45,
      "customers": 20
    }
  }
]
```

### 3. Obtener Detalles de un Tenant
```
GET /super-admin/tenants/:id
```

**Respuesta:**
```json
{
  "id": "uuid",
  "slug": "torre-pacifico",
  "name": "Torre Pacífico",
  "email": "admin@torrepacifico.com",
  "isActive": true,
  "users": [...],
  "services": [...],
  "_count": {
    "appointments": 45,
    "customers": 20,
    "schedules": 35
  }
}
```

### 4. Inactivar un Tenant
```
PATCH /super-admin/tenants/:id/deactivate
```

**Respuesta:**
```json
{
  "message": "Tenant \"Torre Pacífico\" inactivado exitosamente",
  "tenant": {
    "id": "uuid",
    "isActive": false,
    ...
  }
}
```

### 5. Activar un Tenant
```
PATCH /super-admin/tenants/:id/activate
```

**Respuesta:**
```json
{
  "message": "Tenant \"Torre Pacífico\" activado exitosamente",
  "tenant": {
    "id": "uuid",
    "isActive": true,
    ...
  }
}
```

### 6. Eliminar un Tenant Permanentemente
```
DELETE /super-admin/tenants/:id
```

**⚠️ ADVERTENCIA:** Esto eliminará TODOS los datos relacionados (usuarios, servicios, reservas, clientes, etc.)

**Respuesta:**
```json
{
  "message": "Tenant \"Torre Pacífico\" eliminado permanentemente",
  "deletedStats": {
    "appointments": 45,
    "customers": 20,
    "services": 5
  }
}
```

## Autenticación

Actualmente, la autenticación se realiza mediante el header `X-User-Email`. El guard verifica que:

1. El email existe en la base de datos
2. El usuario tiene `isSuperAdmin: true`

### Ejemplo de Request:

```bash
curl -X GET http://localhost:3000/super-admin/tenants \
  -H "X-User-Email: superadmin@reservar.com"
```

## Mejoras Futuras

- [ ] Implementar autenticación JWT para super admin
- [ ] Crear panel web para super admin (frontend)
- [ ] Agregar logs de acciones del super admin
- [ ] Implementar soft delete para tenants (ya está con isActive)
- [ ] Agregar filtros y búsqueda en listado de tenants
- [ ] Exportar reportes de tenants

## Notas de Seguridad

1. **Nunca** expongas los endpoints de super admin públicamente sin autenticación adecuada
2. En producción, usa JWT tokens en lugar del header `X-User-Email`
3. Considera agregar rate limiting a estos endpoints
4. Implementa logging de todas las acciones del super admin
5. Los tenants inactivos (`isActive: false`) no son accesibles públicamente (el endpoint público `/tenants/slug/:slug` los filtra)
