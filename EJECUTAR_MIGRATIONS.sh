#!/bin/bash
# Script para ejecutar migrations usando DATABASE_URL de Railway

echo "🔧 Ejecutando migrations en Railway..."
echo ""
echo "⚠️  IMPORTANTE: Necesitas copiar tu DATABASE_URL de Railway"
echo ""
echo "Pasos:"
echo "1. Ve a Railway Dashboard → Tu servicio NestJS → Variables"
echo "2. Copia el valor de DATABASE_URL"
echo "3. Ejecuta este comando:"
echo ""
echo "export DATABASE_URL=\"postgresql://...\""
echo "npx prisma migrate deploy"
echo ""
echo "O ejecuta todo junto:"
echo ""
echo "DATABASE_URL=\"postgresql://...\" npx prisma migrate deploy"


