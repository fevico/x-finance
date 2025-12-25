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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
