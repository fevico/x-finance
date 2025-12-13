import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, systemRole } from '../prisma/generated/client';
import 'dotenv/config';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding admin user...');

  const hashedPassword = await bcrypt.hash('password123!', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@xf.com' },
    update: {},
    create: {
      email: 'admin@xf.com',
      password: hashedPassword,
      systemRole: systemRole.admin,
      firstName: 'Admin',
      lastName: 'User',
    },
  });

  console.log('Admin user created/updated:');
  console.log(adminUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
