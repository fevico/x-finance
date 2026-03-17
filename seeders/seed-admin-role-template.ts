import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../prisma/generated/client';
import 'dotenv/config';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});

const prisma = new PrismaClient({ adapter });
/**
 * Seed admin role template with all GROUP-scoped permissions
 * This template role (groupId: null) is cloned for each new group
 * Run once during initial setup: ts-node seeders/seed-admin-role-template.ts
 */


async function seedAdminRoleTemplate() {
  console.log('🔧 Starting admin role template seeding...');

  try {
    // Check if template already exists
    const existingTemplate = await prisma.role.findFirst({
      where: {
        name: 'administrator',
        groupId: undefined,
        isSystemRole: true,
      },
    });

    if (existingTemplate) {
      console.log('✓ Admin role template already exists (ID: ' + existingTemplate.id + ')');
      return;
    }

    // Fetch all GROUP-scoped permissions
    const groupPermissions = await prisma.permission.findMany({
      include: {
        action: {
          include: {
            module: true,
          },
        },
      },
    });

    console.log(`📋 Found ${groupPermissions.length} permissions to attach`);

    // Create template admin role with ALL permissions
    const adminTemplate = await prisma.role.create({
      data: {
        name: 'administrator',
        scope: 'ADMIN',
        isSystemRole: true, // Mark as system template role
        description: 'Global administrator role template - cloned to each new group',
        // No groupId = template role
        rolePermissions: {
          create: groupPermissions.map((p) => ({
            permissionId: p.id,
          })),
        },
      },
      include: {
        rolePermissions: true,
      },
    });

    console.log(
      `✓ Created admin role template with ID: ${adminTemplate.id}`,
    );
    console.log(
      `✓ Attached ${adminTemplate.rolePermissions.length} permissions`,
    );
    console.log('');
    console.log('ℹ️ This template will be cloned to new groups during group creation');
    console.log('');
  } catch (error) {
    console.error('✗ Error seeding admin role template:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedAdminRoleTemplate()
  .then(() => {
    console.log('✓ Admin role template seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Seeding failed:', error);
    process.exit(1);
  });
