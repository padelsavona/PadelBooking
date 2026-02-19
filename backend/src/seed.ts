import 'dotenv/config';
import prisma from './db.js';
import { hashPassword } from './services/auth.service.js';

async function seed() {
  console.log('Seeding database...');

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@padelbooking.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: await hashPassword(adminPassword),
        name: 'Admin',
        role: 'ADMIN',
      },
    });
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    console.log('Admin user already exists');
  }

  // Create sample courts
  const court1 = await prisma.court.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Campo Centrale',
      description: 'Campo principale con illuminazione LED',
      pricePerHour: 30.0,
    },
  });

  const court2 = await prisma.court.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Campo 2',
      description: 'Campo coperto',
      pricePerHour: 25.0,
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
