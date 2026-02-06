# 🔐 Super Administrador - Guía de Producción

## ✅ Sí, funciona en producción con autenticación JWT segura

He actualizado el sistema para usar **autenticación JWT** en lugar del header inseguro `X-User-Email`. Ahora es seguro para producción.

## 🔄 Flujo de Autenticación

### 1. Login del Super Admin

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "admin@reservar.com",
  "password": "Admin123!"
}
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@reservar.com",
    "name": "Super Administrador",
    "isSuperAdmin": true,
    "tenantId": "uuid",
    "tenant": null
  }
}
```

### 2. Usar el Token en Requests

Todos los endpoints de super admin ahora requieren el token JWT en el header `Authorization`:

```bash
GET /super-admin/tenants
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📋 Endpoints de Super Admin (Protegidos con JWT)

### Estadísticas del Sistema
```bash
GET /super-admin/stats
Authorization: Bearer <token>
```

### Listar Todos los Tenants
```bash
GET /super-admin/tenants
Authorization: Bearer <token>
```

### Detalles de un Tenant
```bash
GET /super-admin/tenants/:id
Authorization: Bearer <token>
```

### Inactivar Tenant
```bash
PATCH /super-admin/tenants/:id/deactivate
Authorization: Bearer <token>
```

### Activar Tenant
```bash
PATCH /super-admin/tenants/:id/activate
Authorization: Bearer <token>
```

### Eliminar Tenant
```bash
DELETE /super-admin/tenants/:id
Authorization: Bearer <token>
```

## 🔒 Seguridad

### ✅ Implementado

- ✅ Autenticación JWT con tokens firmados
- ✅ Tokens con expiración (7 días por defecto)
- ✅ Validación de permisos de super admin
- ✅ Verificación de usuario en cada request

### ⚠️ Configuración Requerida en Producción

1. **JWT_SECRET seguro:**
   ```env
   JWT_SECRET=tu-secret-super-largo-y-aleatorio-minimo-32-caracteres
   ```
   Genera uno seguro:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **HTTPS obligatorio:**
   - Los tokens JWT deben enviarse solo sobre HTTPS en producción
   - Nunca uses HTTP para autenticación en producción

3. **Variables de entorno en Clever Cloud:**
   - Configura `JWT_SECRET` en las variables de entorno de tu aplicación
   - No lo pongas en el código fuente

## 🧪 Probar en Desarrollo

### 1. Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@reservar.com","password":"Admin123!"}'
```

### 2. Usar el Token
```bash
# Guardar el token en una variable
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Usar el token en requests
curl -X GET http://localhost:3001/super-admin/tenants \
  -H "Authorization: Bearer $TOKEN"
```

## 🚀 Despliegue en Producción

### Variables de Entorno Requeridas

En Clever Cloud, configura estas variables:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=tu-secret-super-seguro-y-largo
JWT_EXPIRATION=7d
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://tu-dominio.com
```

### Verificar que Funciona

1. **Login:**
   ```bash
   curl -X POST https://tu-backend.clever-cloud.com/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@reservar.com","password":"tu-contraseña"}'
   ```

2. **Probar Super Admin:**
   ```bash
   curl -X GET https://tu-backend.clever-cloud.com/super-admin/stats \
     -H "Authorization: Bearer <token-obtenido-del-login>"
   ```

## 🔄 Migración desde Desarrollo

Si ya estabas usando el header `X-User-Email` en desarrollo, ahora debes:

1. **Hacer login primero** para obtener el token
2. **Usar el token** en el header `Authorization: Bearer <token>`

El sistema anterior (con `X-User-Email`) **ya no funciona** por seguridad.

## 📝 Ejemplo Completo

```bash
# 1. Login
RESPONSE=$(curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@reservar.com","password":"Admin123!"}')

# 2. Extraer token (requiere jq)
TOKEN=$(echo $RESPONSE | jq -r '.access_token')

# 3. Usar token
curl -X GET http://localhost:3001/super-admin/tenants \
  -H "Authorization: Bearer $TOKEN"
```

## ⚠️ Importante

- **Cambia la contraseña por defecto** del super admin en producción
- **Usa un JWT_SECRET fuerte** (mínimo 32 caracteres aleatorios)
- **Habilita HTTPS** en producción
- **No compartas tokens** ni credenciales
- Los tokens expiran después de 7 días (configurable con `JWT_EXPIRATION`)

## 🔍 Troubleshooting

### Error: "Usuario no autenticado"
- Verifica que estés enviando el header `Authorization: Bearer <token>`
- Asegúrate de que el token no haya expirado

### Error: "No tienes permisos de super administrador"
- Verifica que el usuario tenga `isSuperAdmin: true` en la base de datos
- El token debe haberse generado después de marcar al usuario como super admin

### Error: "Invalid token"
- Verifica que `JWT_SECRET` sea el mismo en desarrollo y producción
- Asegúrate de que el token sea válido y no esté corrupto
