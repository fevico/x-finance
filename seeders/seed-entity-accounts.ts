import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../prisma/generated/client';
import 'dotenv/config';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});

const prisma = new PrismaClient({ adapter });

/**
 * Default accounts to create for each entity
 * Maps common accounts that most businesses need
 */
const defaultEntityAccounts = [
  // Assets - Cash and Bank
  {
    subCategoryCode: '1110', // Cash and Cash Equivalents
    name: 'Cash - Main',
    description: 'Main cash account for day-to-day transactions',
  },
  {
    subCategoryCode: '1110',
    name: 'Petty Cash',
    description: 'Small cash account for minor expenses',
  },

  // Assets - Receivables
  {
    subCategoryCode: '1120', // Accounts Receivable
    name: 'Accounts Receivable',
    description: 'Money owed by customers for sales',
  },

  // Assets - Inventory
  {
    subCategoryCode: '1130', // Inventory
    name: 'Product Inventory',
    description: 'Stock of products held for sale',
  },

  // Liabilities - Payables
  {
    subCategoryCode: '2110', // Accounts Payable
    name: 'Accounts Payable',
    description: 'Money owed to suppliers and vendors',
  },

  // Equity - Capital
  {
    subCategoryCode: '3110', // Capital Stock
    name: 'Opening Balance Equity',
    description: 'Initial equity balance at business start',
  },

  // Revenue - Sales
  {
    subCategoryCode: '4110', // Product Sales Revenue
    name: 'Sales Revenue',
    description: 'Revenue from customer sales',
  },

  // Expenses - Salaries
  {
    subCategoryCode: '5210', // Salaries & Wages
    name: 'Salary Expense',
    description: 'Employee salary and wage expenses',
  },

  // Expenses - Rent
  {
    subCategoryCode: '5220', // Rent Expense
    name: 'Rent Expense',
    description: 'Building and facility rental costs',
  },

  // Expenses - Utilities
  {
    subCategoryCode: '5230', // Utilities
    name: 'Utilities Expense',
    description: 'Electricity, water, and gas expenses',
  },
];

async function seedDefaultEntityAccounts(entityId: string, groupId: string) {
  try {
    console.log(`Seeding default accounts for entity: ${entityId}`);

    for (const accountData of defaultEntityAccounts) {
      // Find the subcategory
      const subCategory = await prisma.accountSubCategory.findFirst({
        where: {
          code: accountData.subCategoryCode,
          category: {
            groupId,
          },
        },
        include: {
          category: true,
        },
      });

      if (!subCategory) {
        console.warn(
          `⚠ SubCategory not found: ${accountData.subCategoryCode} for group ${groupId}`,
        );
        continue;
      }

      // Check if account already exists
      const existingAccount = await prisma.account.findFirst({
        where: {
          name: accountData.name,
          entityId,
        },
      });

      if (!existingAccount) {
        // Generate code based on subcategory
        const code = `${subCategory.code}-01`;

        const account = await prisma.account.create({
          data: {
            name: accountData.name,
            code,
            description: accountData.description,
            subCategoryId: subCategory.id,
            entityId,
            balance: 0,
          },
        });

        console.log(
          `  ✓ Created account: ${accountData.name} (${code})`,
        );
      } else {
        console.log(`  • Account already exists: ${accountData.name}`);
      }
    }

    console.log(`✓ Default accounts seeded for entity: ${entityId}\n`);
  } catch (error) {
    console.error('Error seeding default entity accounts:', error);
    throw error;
  }
}

export { seedDefaultEntityAccounts };
