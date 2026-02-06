import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@reservar.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!';
  const name = process.env.SUPER_ADMIN_NAME || 'Super Administrador';

  console.log('🔐 Creando Super Administrador...\n');
  console.log(`Email: ${email}`);
  console.log(`Nombre: ${name}\n`);

  try {
    // Buscar o crear un tenant para el super admin
    let tenant = await prisma.tenant.findFirst({
      where: { slug: 'super-admin-tenant' },
    });

    if (!tenant) {
      console.log('📝 Creando tenant para super admin...');
      tenant = await prisma.tenant.create({
        data: {
          slug: 'super-admin-tenant',
          name: 'Super Admin Tenant',
          email: email,
          isActive: true,
        },
      });
      console.log('✅ Tenant creado');
    }

    // Crear o actualizar usuario super admin
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        isSuperAdmin: true,
        passwordHash,
        name,
      },
      create: {
        email,
        name,
        tenantId: tenant.id,
        role: 'admin',
        isSuperAdmin: true,
        passwordHash,
      },
    });

    console.log('\n✅ Super administrador creado exitosamente!');
    console.log('\n📋 Detalles:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Super Admin: ${user.isSuperAdmin}`);
    console.log(`   Tenant ID: ${user.tenantId}`);
    console.log('\n💡 Para usar los endpoints de super admin, incluye el header:');
    console.log(`   X-User-Email: ${user.email}`);
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña por defecto en producción!');
  } catch (error) {
    console.error('\n❌ Error al crear super administrador:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
