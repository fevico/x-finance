import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../prisma/generated/client';
import 'dotenv/config';
import { ModuleScope, PermissionAction } from '../prisma/generated/enums';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});

const prisma = new PrismaClient({ adapter });

async function seedModules() {
  try {
    console.log('Seeding modules and actions...');

    // Define all modules with scope (ADMIN or USER)
    const modules = [
      // USER-level entity modules (business operations)
            { key: 'dashboard', name: 'Dashboard', menu: 'Dashboard', scope: 'user' },

      // Income
      { key: 'customers', name: 'Customers', menu: 'Income', scope: 'user' },
      { key: 'items', name: 'Items', menu: 'Income', scope: 'user' },
      { key: 'invoices', name: 'Invoices', menu: 'Income', scope: 'user' },
      { key: 'paymentReceived', name: 'Payment Received', menu: 'Income', scope: 'user' },
      { key: 'salesReceipt', name: 'Sales Receipt', menu: 'Income', scope: 'user' },
      // Projects
      { key: 'projects', name: 'Projects', menu: 'Projects', scope: 'user' },
      // Expense
      { key: 'vendors', name: 'Vendors', menu: 'Expense', scope: 'user' },
      { key: 'expenses', name: 'Expenses', menu: 'Expense', scope: 'user' },
      { key: 'bills', name: 'Bills', menu: 'Expense', scope: 'user' },
      { key: 'paymentMade', name: 'Payment Made', menu: 'Expense', scope: 'user' },
      // Products
      { key: 'storeItems', name: 'Store Items', menu: 'Products', scope: 'user' },
      { key: 'collections', name: 'Collections', menu: 'Products', scope: 'user' },
      { key: 'orders', name: 'Orders', menu: 'Products', scope: 'user' },
      // Assets & Inventory
      { key: 'fixedAssets', name: 'Fixed Assets', menu: 'Assets & Inventory', scope: 'user' },
      { key: 'inventory', name: 'Inventory', menu: 'Assets & Inventory', scope: 'user' },
      // Accounts
      { key: 'chartOfAccounts', name: 'Chart of Accounts', menu: 'Accounts', scope: 'user' },
      { key: 'openingBalance', name: 'Opening Balance', menu: 'Accounts', scope: 'user' },
      { key: 'manualJournal', name: 'Manual Journal', menu: 'Accounts', scope: 'user' },
      { key: 'budget', name: 'Budget', menu: 'Accounts', scope: 'user' },
      // Banking
      { key: 'banking', name: 'Banking', menu: 'Banking', scope: 'user' },
      // HR & Payroll
      { key: 'employees', name: 'Employees', menu: 'HR & Payroll', scope: 'user' },
      { key: 'attendance', name: 'Attendance', menu: 'HR & Payroll', scope: 'user' },
      { key: 'payroll', name: 'Payroll', menu: 'HR & Payroll', scope: 'user' },
      { key: 'manageLeave', name: 'Manage Leave', menu: 'HR & Payroll', scope: 'user' },
      // Reports
      { key: 'reports', name: 'Reports', menu: 'Reports', scope: 'user' },
      // Entity Settings
      { key: 'settings', name: 'Settings', menu: 'Settings', scope: 'user' },

      // ADMIN-level modules (group administration)
      // Overview
      { key: 'dashboard', name: 'Overview', menu: 'Dashboard', scope: 'admin' },
      
      
      // Intercompany
      { key: 'intercompany', name: 'Intercompany', menu: 'Intercompany', scope: 'admin' },
      // Group Reports
      { key: 'groupReports', name: 'Group Reports', menu: 'Group Reports', scope: 'admin' },
      // Budgeting & Forecasts
      { key: 'budgetOverview', name: 'Budget Overview', menu: 'Budgeting & Forecasts', scope: 'admin' },
      { key: 'forecast', name: 'Forecast', menu: 'Budgeting & Forecasts', scope: 'admin' },
      // Master Chart of Accounts
      { key: 'masterChartOfAccounts', name: 'Master Chart of Accounts', menu: 'Master Chart of Accounts', scope: 'admin' },
      // Admin
      { key: 'entities', name: 'Entities', menu: 'Admin', scope: 'admin' },
      { key: 'users', name: 'Users & Roles', menu: 'Admin', scope: 'admin' },
      { key: 'auditTrail', name: 'Audit Trail', menu: 'Admin', scope: 'admin' },
      { key: 'integrations', name: 'Integrations', menu: 'Admin', scope: 'admin' },
      { key: 'groupSettings', name: 'Group Settings', menu: 'Admin', scope: 'admin' },
    
          // Superadmin modules
      { key: 'dashboard', name: 'Dashboard', menu: 'Dashboard', scope: 'superadmin' },
      { key: 'companies', name: 'Companies', menu: 'Companies', scope: 'superadmin' },
      { key: 'subscriptions', name: 'Subscriptions', menu: 'Subscriptions', scope: 'superadmin' },

    ];

    // All actions
    const actions = [
      PermissionAction.View,
      PermissionAction.Create,
      PermissionAction.Edit,
      PermissionAction.Delete,
      PermissionAction.Approve,
      PermissionAction.Export,
      PermissionAction.Import,
    ];

    // Seed modules and their actions
    for (const module of modules) {
      const moduleScope = module.scope.toUpperCase() === 'USER' ? ModuleScope.ENTITY : module.scope.toUpperCase() === 'SUPERADMIN' ? ModuleScope.SUPERADMIN : ModuleScope.GROUP;
      
      let createdModule = await prisma.module.findFirst({
        where: { 
          moduleKey: module.key,
          scope: moduleScope,
        },
      });

      if (!createdModule) {
        createdModule = await prisma.module.create({
          data: {
            moduleKey: module.key,
            displayName: module.name,
            menu: module.menu,
            scope: moduleScope,
            ...(module.scope !== 'superadmin' && {
              actions: {
                create: actions.map((action) => ({
                  actionName: action,
                })),
              },
            }),
          },
        });
        console.log(`✓ Created module: ${module.name} [${module.scope.toUpperCase()}]`);
      } else {
        console.log(`✓ Module already exists: ${module.name}`);
      }
    }

    console.log('✓ Modules and actions seeding complete!');
  } catch (error) {
    console.error('Error seeding modules:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🌱 Starting modules seed...\n');
    await seedModules();
    console.log('✅ Seeding completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


