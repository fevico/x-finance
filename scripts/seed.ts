import { PrismaClient } from '../prisma/generated/client';

const prisma = new PrismaClient({});

const actions = ['view', 'create', 'edit', 'approve', 'delete', 'export'];

const modules = {
  dashboard: ['group', 'entity'],
  sales: ['customers', 'invoices', 'paymentRecieved', 'creditNotes'],
  purchases: ['bills', 'paymentMade', 'debitNotes', 'expenses', 'vendors'],
  products: ['items', 'collections', 'inventory', 'orders'],
  quickSale: ['quickSale'],
  onlineStore: ['onlineStoreManagement'],
  hrAndPayroll: ['employees', 'attendance', 'payroll', 'manageLeave'],
  accounts: [
    'chartOfAccounts',
    'openingBalance',
    'manualJournal',
    'currencyAdjustment',
    'Budget',
  ],
  banking: ['bankingOverview', 'bankAccounts', 'reconciliation'],
  reports: [
    'reportsCenter',
    'profitAndLoss',
    'balanceSheet',
    'cashFlowStatement',
  ],
  settings: [
    'organization',
    'usersAndRoles',
    'setupAndConfiguration',
    'salesSettings',
    'purchaseSettings',
    'product',
    'tax',
    'generalSettings',
    'emailSettings',
  ],
};

async function main() {
  console.log('Seeding permissions...');
  const permissionsToCreate = [];

  for (const moduleName of Object.keys(modules)) {
    const submodules = modules[moduleName];
    for (const submoduleName of submodules) {
      for (const action of actions) {
        const permissionName = `${moduleName}:${submoduleName.trim()}:${action}`;
        permissionsToCreate.push({
          name: permissionName,
        });
      }
    }
  }

  const result = await prisma.permission.createMany({
    data: permissionsToCreate,
    skipDuplicates: true, // This will prevent errors if a permission already exists
  });

  console.log(`Seeding finished. ${result.count} permissions were created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
