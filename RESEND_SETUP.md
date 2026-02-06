# Configuración de Resend para Envío de Emails

## 📧 Variables de Entorno Necesarias en Railway

Para que el envío de magic links funcione correctamente, necesitas configurar las siguientes variables de entorno en Railway:

### 1. Obtener API Key de Resend

1. Ve a [resend.com](https://resend.com) y crea una cuenta (si no tienes una)
2. Ve a **API Keys** en el dashboard
3. Crea una nueva API Key
4. Copia la key (comienza con `re_`)

### 2. Configurar Email Remitente

**Opción A: Usar el dominio de prueba de Resend (para desarrollo)**
- Email: `onboarding@resend.dev`
- No requiere verificación de dominio

**Opción B: Usar tu propio dominio (recomendado para producción)**
1. Ve a **Domains** en Resend
2. Agrega tu dominio (ej: `turnero.com`)
3. Configura los registros DNS que Resend te proporciona
4. Espera a que se verifique el dominio
5. Usa un email como `noreply@tudominio.com`

### 3. Configurar Variables en Railway

Ve a tu proyecto en Railway → **Variables** y agrega:

```
RESEND_API_KEY=re_tu_api_key_aqui
RESEND_FROM_EMAIL=onboarding@resend.dev  (o tu email verificado)
FRONTEND_URL=https://tu-app.vercel.app  (tu URL de Vercel)
```

### 4. Verificar Configuración

Después de agregar las variables:
1. Railway hará un redeploy automáticamente
2. Revisa los logs de Railway para verificar que no haya errores
3. Busca el log: `⚠️ RESEND_API_KEY no configurada` - si aparece, la key no está configurada correctamente

### 5. Probar el Envío

1. Intenta hacer login desde el frontend
2. Revisa los logs de Railway para ver si hay errores al enviar el email
3. Revisa tu bandeja de entrada (y spam) para el magic link

## 🔍 Troubleshooting

### El email no llega

1. **Verifica que las variables estén configuradas:**
   - Revisa los logs de Railway al iniciar el servidor
   - Si ves `⚠️ RESEND_API_KEY no configurada`, la variable no está configurada

2. **Verifica el email remitente:**
   - Si usas `onboarding@resend.dev`, debería funcionar inmediatamente
   - Si usas tu propio dominio, asegúrate de que esté verificado en Resend

3. **Revisa los logs de Railway:**
   - Busca errores relacionados con `resend` o `email`
   - Los errores de Resend aparecerán en los logs

4. **Verifica la URL del frontend:**
   - Asegúrate de que `FRONTEND_URL` apunte a tu dominio de Vercel (con `https://`)
   - Ejemplo: `https://turnero-frontend.vercel.app`

### Errores Comunes

**Error: "Invalid API key"**
- Verifica que la `RESEND_API_KEY` esté correctamente copiada (sin espacios)
- Asegúrate de que la key sea válida en Resend

**Error: "Domain not verified"**
- Si usas tu propio dominio, verifica que esté correctamente configurado en Resend
- Usa `onboarding@resend.dev` para pruebas rápidas

**Error: "Invalid from email"**
- El email remitente debe estar verificado en Resend
- Si usas tu dominio, el email debe ser del formato `algo@tudominio.com`

## 📝 Notas

- En desarrollo local, si no configuras `RESEND_API_KEY`, el sistema solo mostrará el link en consola
- En producción, el email debe enviarse automáticamente si las variables están configuradas
- Resend tiene límites en el plan gratuito (3,000 emails/mes)

