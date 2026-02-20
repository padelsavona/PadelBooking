import 'dotenv/config';
import prisma from './db.js';
import { hashPassword } from './services/auth.service.js';

async function seed() {
  console.log('Seeding database...');

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@padelsavona.it';
  const adminPassword = process.env.ADMIN_PASSWORD || 'PadelSavonaAdmin2026!';

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: await hashPassword(adminPassword),
      name: 'Admin',
      role: 'ADMIN',
    },
    create: {
      email: adminEmail,
      password: await hashPassword(adminPassword),
      name: 'Admin',
      role: 'ADMIN',
    },
  });

  console.log(`Admin user pronto: ${adminEmail}`);

  // Create sample courts
  await prisma.court.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Campo Centrale',
      description: 'Campo principale con illuminazione LED',
      pricePerHour: 40.0,
      memberPricePerHour: 32.0,
    },
  });

  await prisma.court.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Campo 2',
      description: 'Campo coperto',
      pricePerHour: 40.0,
      memberPricePerHour: 32.0,
    },
  });

  console.log('Sample courts created');
  console.log('Seeding completed!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
