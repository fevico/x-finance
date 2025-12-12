// @ts-nocheck


dashboard
group, entity

  sales
  customers, invoices, paymentRecieved, creditNotes
  
  purchases
bills, paymentMade, debitNotes, expenses, vendors


  products
items, collections, inventory, orders


  quickSale
  quickSale


  onlineStore
  onlineStoreManagement

  hrAndPayroll
  employees, attendance, payroll, manageLeave
  
  
  accounts
  chartOfAccounts, openingBalance, manualJournal, currencyAdjustment, Budget

  banking
bankingOverview, bankAccounts, reconciliation

  reports
  reportsCenter, profitAndLoss, balanceSheet, cashFlowStatement
  
  
  settings
  organization, usersAndRoles, setupAndConfiguration, salesSettings, purchaseSettings, product, Tax, generalSettings, emailSettings



//   oncreate superadmin give all permissions plus override, group owners have allowedNodeEnvironmentFlags, entity is restricted to no group dashboard else company determins ithers

// enum Module {
//   dashboard
//   sales
//   purchases
//   products
//   quickSale
//   onlineStore
//   hrAndPayroll
//   accounts
//   banking
//   reports
//   settings
// }


// npx prisma init --datasource-provider postgresql --output ../generated/prisma


// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

