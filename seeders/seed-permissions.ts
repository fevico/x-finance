import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../prisma/generated/client';
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});

const prisma = new PrismaClient({ adapter });

const actions = ['view', 'create', 'edit', 'approve', 'delete', 'export'];

const modules = {
  dashboard: { submodules: [], actions: ['view'] },
  sales: ['customers', 'invoices', 'paymentRecieved', 'creditNotes'],
  purchases: ['bills', 'paymentMade', 'debitNotes', 'expenses', 'vendors'],
  products: ['items', 'collections', 'inventory', 'orders'],
  assets: {
    submodules: [],
    actions: ['view', 'create', 'edit', 'approve', 'delete', 'export'],
  },
  // quickSale: ['quickSale'],
  // onlineStore: ['onlineStoreManagement'],
  hrAndPayroll: ['employees', 'attendance', 'payroll', 'manageLeave'],
  accounts: [
    'chartOfAccounts',
    'openingBalance',
    'manualJournal',
    'currencyAdjustment',
    'Budget',
  ],
  banking: {
    submodules: [],
    actions: ['view', 'create', 'edit', 'approve', 'delete', 'export'],
  },
  // banking: ['bankingOverview', 'bankAccounts', 'reconciliation'],
  // reports: [
  //   'reportsCenter',
  //   'profitAndLoss',
  //   'balanceSheet',
  //   'cashFlowStatement',
  // ],
  reports: {
    submodules: [],
    actions: ['view', 'create', 'edit', 'approve', 'delete', 'export'],
  },
  settings: [
    'organization',
    'usersAndRoles',
    'setupAndConfig',
    'sales',
    'purchases',
    'product',
    'tax',
    'email',
    'payroll',
  ],
};

async function main() {
  console.log('Seeding permissions...');
  const permissionsToCreate: { name: string }[] = [];

  for (const moduleName of Object.keys(modules)) {
    const moduleConfig = modules[moduleName];

    // Handle standard modules (defined as an array of submodules)
    if (Array.isArray(moduleConfig)) {
      const submodules = moduleConfig;
      for (const submoduleName of submodules) {
        for (const action of actions) {
          const permissionName = `${moduleName}:${submoduleName.trim()}:${action}`;
          permissionsToCreate.push({
            name: permissionName,
          });
        }
      }
    } else {
      // Handle special modules (defined as an object)
      const specialActions = moduleConfig.actions;
      const specialSubmodules = moduleConfig.submodules;

      // If there are no submodules, create permissions like "module:action"
      if (specialSubmodules.length === 0) {
        for (const action of specialActions) {
          const permissionName = `${moduleName}:${action}`;
          permissionsToCreate.push({ name: permissionName });
        }
      } else {
        // If there are submodules, create permissions like "module:submodule:action"
        for (const submoduleName of specialSubmodules) {
          for (const action of specialActions) {
            const permissionName = `${moduleName}:${submoduleName.trim()}:${action}`;
            permissionsToCreate.push({
              name: permissionName,
            });
          }
        }
      }
    }
  }

  const result = await prisma.permission.createMany({
    data: permissionsToCreate,
    skipDuplicates: true, // This will prevent errors if a permission already exists
  });

  console.log(`Seeding finished. ${result.count} permissions were created.`);

  // Export the permissions to a JSON file
  const outputPath = path.join(__dirname, 'generated-permissions.json');
  const permissionNames = permissionsToCreate.map((p) => p.name);
  fs.writeFileSync(outputPath, JSON.stringify(permissionNames, null, 2));

  console.log(`All permissions have been exported to ${outputPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
