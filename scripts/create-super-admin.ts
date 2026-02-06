import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('🔐 Crear Super Administrador\n');

  const email = await question('Email del super administrador: ');
  if (!email || !email.includes('@')) {
    console.error('❌ Email inválido');
    process.exit(1);
  }

  const password = await question('Contraseña (mínimo 8 caracteres): ');
  if (!password || password.length < 8) {
    console.error('❌ La contraseña debe tener al menos 8 caracteres');
    process.exit(1);
  }

  const name = await question('Nombre (opcional): ') || 'Super Administrador';

  console.log('\n⏳ Creando super administrador...');

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
  } catch (error) {
    console.error('\n❌ Error al crear super administrador:', error);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
