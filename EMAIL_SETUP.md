# 📧 Configuración de Emails con Resend

## Setup Inicial

### 1. Crear cuenta en Resend

1. Ve a [resend.com](https://resend.com)
2. Crea una cuenta gratuita
3. Verifica tu dominio (o usa el dominio de prueba para desarrollo)

### 2. Obtener API Key

1. Ve a [Dashboard de Resend](https://resend.com/api-keys)
2. Crea una nueva API Key
3. Copia la key (empieza con `re_`)

### 3. Configurar Variables de Entorno

Agrega estas variables a tu archivo `.env` en el backend:

```env
# Resend Configuration
RESEND_API_KEY=re_tu_api_key_aqui
RESEND_FROM_EMAIL=noreply@tudominio.com

# Frontend URL (para magic links)
FRONTEND_URL=http://localhost:3000
```

### 4. Dominio de Prueba (Desarrollo)

Resend permite usar `onboarding@resend.dev` para pruebas sin verificar dominio.

**Para desarrollo, puedes usar:**
```env
RESEND_FROM_EMAIL=onboarding@resend.dev
```

## Emails Implementados

### 1. Magic Link (Login)
- **Cuándo:** Cuando un admin solicita iniciar sesión
- **Destinatario:** Email del usuario admin
- **Contenido:** Link temporal para autenticarse

### 2. Confirmación de Turno
- **Cuándo:** Cuando un cliente reserva un turno
- **Destinatario:** Email del cliente
- **Contenido:** 
  - Detalles del turno
  - Archivo .ics adjunto para agregar al calendario
  - Información de contacto del negocio

### 3. Recordatorio de Turno
- **Cuándo:** 24 horas antes del turno (requiere jobs programados)
- **Destinatario:** Email del cliente
- **Contenido:** Recordatorio con detalles del turno

### 4. Cancelación de Turno
- **Cuándo:** Cuando un admin cancela un turno
- **Destinatario:** Email del cliente
- **Contenido:** Notificación de cancelación con motivo

## Modo Desarrollo

Si `RESEND_API_KEY` no está configurada, el sistema:
- ✅ Funciona normalmente
- ✅ Loguea los emails en consola
- ✅ No envía emails reales
- ✅ Retorna el magic link en la respuesta (solo en desarrollo)

## Testing

### Probar Magic Link
```bash
# 1. Solicitar magic link
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com"}'

# 2. Revisar logs del backend para ver el link
# 3. O revisar la respuesta (solo en desarrollo)
```

### Probar Confirmación de Turno
1. Reserva un turno desde el frontend
2. Revisa los logs del backend
3. En producción, el cliente recibirá el email automáticamente

## Producción

### Verificar Dominio

1. En Resend Dashboard → Domains
2. Agrega tu dominio
3. Configura los registros DNS (SPF, DKIM, DMARC)
4. Espera verificación (puede tardar hasta 24h)

### Configurar Variables

```env
RESEND_API_KEY=re_prod_key_aqui
RESEND_FROM_EMAIL=noreply@tudominio.com
FRONTEND_URL=https://turnero.com
NODE_ENV=production
```

## Troubleshooting

### Error: "Invalid API Key"
- Verifica que `RESEND_API_KEY` esté correctamente configurada
- Asegúrate de que no tenga espacios extra

### Emails no se envían
- Revisa los logs del backend
- Verifica que el dominio esté verificado (en producción)
- En desarrollo, usa `onboarding@resend.dev`

### Emails van a spam
- Configura SPF, DKIM y DMARC correctamente
- Usa un dominio verificado
- Evita palabras spam en el contenido


