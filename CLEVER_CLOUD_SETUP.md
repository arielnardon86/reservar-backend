# ☁️ Configuración de PostgreSQL en Clever Cloud

## ✅ Sí, puedes usar PostgreSQL de Clever Cloud

Clever Cloud es perfecto para producción y también puedes usarlo para desarrollo si lo prefieres.

## 📋 Pasos para Configurar

### 1. Obtener la URL de Conexión desde Clever Cloud

1. Inicia sesión en tu panel de Clever Cloud: https://www.clever-cloud.com/
2. Ve a tu **add-on de PostgreSQL**
3. En la sección **Información de conexión** o **Connection Info**, encontrarás:
   - **Host**
   - **Puerto** (generalmente 5432)
   - **Base de datos** (database name)
   - **Usuario** (username)
   - **Contraseña** (password)

4. También puedes encontrar la **URL de conexión completa** en formato:
   ```
   postgresql://usuario:contraseña@host:puerto/base_de_datos
   ```

### 2. Configurar el archivo .env

Actualiza tu archivo `.env` en la carpeta `backend` con la URL de Clever Cloud:

```env
# Base de datos de Clever Cloud
DATABASE_URL="postgresql://usuario:contraseña@host.clever-cloud.com:5432/base_de_datos?schema=public"

# JWT
JWT_SECRET=super-secret-jwt-key-change-this-in-production-12345
JWT_EXPIRATION=7d
MAGIC_LINK_EXPIRATION=15m

# App
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://tu-dominio.com

# Email (configura con tus credenciales de Resend)
RESEND_API_KEY=tu_api_key_de_resend
RESEND_FROM_EMAIL=noreply@tu-dominio.com

# Redis (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Ejecutar Migraciones

Una vez configurado el `.env` con la URL de Clever Cloud:

```bash
cd backend

# Generar el cliente de Prisma
npx prisma generate

# Ejecutar migraciones en producción
npx prisma migrate deploy
```

**Nota:** En producción usa `migrate deploy` en lugar de `migrate dev`.

## 🔒 Seguridad en Producción

### Variables de Entorno en Clever Cloud

En lugar de usar un archivo `.env` en producción, configura las variables de entorno directamente en Clever Cloud:

1. Ve a tu **aplicación** en Clever Cloud
2. Ve a **Environment variables**
3. Agrega las siguientes variables:

```
DATABASE_URL=postgresql://usuario:contraseña@host.clever-cloud.com:5432/base_de_datos?schema=public
JWT_SECRET=tu-jwt-secret-super-seguro-y-largo
JWT_EXPIRATION=7d
MAGIC_LINK_EXPIRATION=15m
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://tu-dominio.com
RESEND_API_KEY=tu_api_key
RESEND_FROM_EMAIL=noreply@tu-dominio.com
```

### ⚠️ Importante

- **Nunca** subas el archivo `.env` a Git (ya está en `.gitignore`)
- Usa **variables de entorno** en Clever Cloud para producción
- El `JWT_SECRET` debe ser una cadena larga y aleatoria en producción
- La `DATABASE_URL` ya incluye las credenciales, no la compartas

## 🧪 Probar la Conexión

Puedes probar la conexión desde tu máquina local:

```bash
# Usando Prisma Studio (interfaz visual)
npx prisma studio

# O usando psql directamente
psql "postgresql://usuario:contraseña@host.clever-cloud.com:5432/base_de_datos"
```

## 📊 Ventajas de Clever Cloud

✅ **Base de datos gestionada** - No necesitas mantener el servidor  
✅ **Backups automáticos** - Clever Cloud hace backups regulares  
✅ **Escalable** - Puedes aumentar recursos cuando lo necesites  
✅ **SSL/TLS** - Conexiones seguras por defecto  
✅ **Monitoreo** - Panel de control con métricas  

## 🔄 Migraciones en Producción

### Desarrollo Local
```bash
# Crear nueva migración
npx prisma migrate dev --name nombre_de_la_migracion

# Esto crea el archivo SQL y lo aplica a tu BD local
```

### Producción (Clever Cloud)
```bash
# Aplicar migraciones existentes sin crear nuevas
npx prisma migrate deploy

# Esto solo aplica las migraciones que ya existen en /prisma/migrations/
```

## 🚀 Despliegue

Cuando despliegues tu backend en Clever Cloud:

1. **Configura las variables de entorno** en el panel de Clever Cloud
2. **Ejecuta las migraciones** durante el despliegue:
   ```bash
   # En el script de build o postinstall de tu package.json
   npx prisma migrate deploy
   ```

3. **Genera el cliente de Prisma**:
   ```bash
   npx prisma generate
   ```

## 📝 Ejemplo de package.json para Producción

```json
{
  "scripts": {
    "postinstall": "npx prisma generate",
    "start:prod": "npx prisma migrate deploy && node dist/main"
  }
}
```

## ❓ Solución de Problemas

### Error: "Connection timeout"
- Verifica que la IP de Clever Cloud esté permitida en el firewall
- Clever Cloud generalmente permite conexiones desde cualquier IP

### Error: "Password authentication failed"
- Verifica que la contraseña en la URL sea correcta
- Las contraseñas pueden tener caracteres especiales que necesitan ser codificados en URL

### Error: "Database does not exist"
- Verifica que el nombre de la base de datos sea correcto
- Puedes crear la base de datos desde el panel de Clever Cloud si no existe

## 🔗 Recursos

- [Documentación de Clever Cloud](https://www.clever-cloud.com/doc/)
- [Prisma Migrate Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
