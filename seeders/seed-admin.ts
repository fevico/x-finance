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

  const superadminUser = await prisma.user.upsert({
    where: { email: 'superadmin@xf.com' },
    update: {},
    create: {
      email: 'superadmin@xf.com',
      password: hashedPassword,
      systemRole: systemRole.superadmin,
      firstName: 'Superadmin',
      lastName: 'User',
    },
  });

  console.log('Admin user created/updated:');
  console.log(superadminUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
