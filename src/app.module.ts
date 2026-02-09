import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { GroupModule } from './group/group.module';
import { EntityModule } from './entity/entity.module';
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
import { AssetModule } from './asset/asset.module';
import { AccountModule } from './accounts/account/account.module';
import { JournalModule } from './accounts/journal/journal.module';
import { LogModule } from './log/log.module';
import { BudgetModule } from './accounts/budget/budget.module';
import { AttendanceModule } from './hr-payroll/attendance/attendance.module';
import { EmployeeModule } from './hr-payroll/employee/employee.module';
import { BullmqModule } from './bullmq/bullmq.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    GroupModule,
    EntityModule,
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
    JournalModule,
    LogModule,
    BudgetModule,
    AttendanceModule,
    EmployeeModule,
    BullmqModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
