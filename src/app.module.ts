import { BankingModule } from './banking/banking.module';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { GroupModule } from './group/group.module';
import { EntityModule } from './entity/entity.module';
import { MultitenancyModule } from './multitenancy/multitenancy.module';
import { PermissionModule } from './permission/permission.module';
import { TenantMiddleware } from './multitenancy/tenant.middleware';
import { RequirePermissionGuard } from './permission/require-permission.guard';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { CustomerModule } from './sales/customer/customer.module';
import { InvoiceModule } from './sales/invoice/invoice.module';
import { ReceiptModule } from './sales/receipt/receipt.module';
import { VendorModule } from './purchases/vendor/vendor.module';
import { ExpensesModule } from './purchases/expenses/expenses.module';
import { FileuploadModule } from './fileupload/fileupload.module';
import { BillsModule } from './purchases/bills/bills.module';
import { ItemsModule } from './product/items/items.module';
import { CollectionsModule } from './product/collections/collections.module';
import { InventoryModule } from './product/inventory/inventory.module';
import { AssetModule } from './assets-inventory/asset/asset.module';
import { AccountModule } from './accounts/account/account.module';
import { AccountTypeModule } from './accounts/account-type/account-type.module';
import { AccountCategoryModule } from './accounts/account-category/account-category.module';
import { AccountSubCategoryModule } from './accounts/account-subcategory/account-subcategory.module';
import { JournalModule } from './accounts/journal/journal.module';
import { LogModule } from './log/log.module';
import { BudgetModule } from './accounts/budget/budget.module';
import { OpeningBalanceModule } from './accounts/opening-balance/opening-balance.module';
import { AttendanceModule } from './hr-payroll/attendance/attendance.module';
import { EmployeeModule } from './hr-payroll/employee/employee.module';
import { BullmqModule } from './bullmq/bullmq.module';
import { PaymentReceivedModule } from './sales/payment-received/payment-received.module';
import { LeaveModule } from './hr-payroll/leave/leave.module';
import { OrganizationModule } from './settings/organization/organization.module';
import { PaymentMadeModule } from './purchases/payment-made/payment-made.module';
import { AccountTransactionModule } from './accounts/account-transaction/account-transaction.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuditInterceptor } from './log/audit.interceptor';
import { SubscriptionModule } from './subscription/subscription.module';
import { CacheModule } from './cache/cache.module';
import { MenuModule } from './menu/menu.module';
import { GatewayModule } from './gateway/gateway.module';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { ModuleModule } from './module/module.module';

@Module({
  imports: [
    PrismaModule,
    CacheModule,
    GatewayModule,
    MultitenancyModule,
    PermissionModule,
    AuthModule,
    GroupModule,
    EntityModule,
    MenuModule,
    UserModule,
    RoleModule,
    ModuleModule,
    SubscriptionModule,
    CustomerModule,
    InvoiceModule,
    ReceiptModule,
    VendorModule,
    ExpensesModule,
    FileuploadModule,
    BillsModule,
    ItemsModule,
    CollectionsModule,
    InventoryModule,
    AssetModule,
    AccountModule,
    AccountTypeModule,
    AccountCategoryModule,
    AccountSubCategoryModule,
    JournalModule,
    LogModule,
    BudgetModule,
    OpeningBalanceModule,
    AttendanceModule,
    EmployeeModule,
    BullmqModule,
    PaymentReceivedModule,
    LeaveModule,
    OrganizationModule,
    PaymentMadeModule,
    BankingModule,
    AccountTransactionModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RequirePermissionGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
