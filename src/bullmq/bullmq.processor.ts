import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { systemRole } from 'prisma/generated/enums';
import { EmailService } from '@/email/email.service';
import * as path from 'path';
import { seedDefaultChartOfAccounts } from '../../seeders/seed-account-chart';
import { seedDefaultEntityAccounts } from '../../seeders/seed-entity-accounts';
import { ItemsType, InvoiceActivityType } from 'prisma/generated/enums';
import { BadRequestException } from '@nestjs/common';
import { generateJournalReference } from '@/auth/utils/helper';

@Processor('default')
@Injectable()
export class BullmqProcessor extends WorkerHost {
  private readonly logger = new Logger(BullmqProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.debug(`[Job ${job.id}] Starting job: ${job.name}`);
    if (job.name === 'create-group-user') {
      return this.handleCreateGroupDefaults(job);
    } else if (job.name === 'create-entity-user') {
      return this.handleCreateEntityUser(job);
    } else if (job.name === 'post-invoice-journal') {
      return this.handleInvoiceJournalPosting(job);
    } else if (job.name === 'post-payment-journal') {
      return this.handlePaymentReceivedPosting(job);
    } else if (job.name === 'post-receipt-journal') {
      return this.handleReceiptJournalPosting(job);
    } else {
      this.logger.warn(`[Job ${job.id}] Unknown job type: ${job.name}`);
    }
  }

  async handleCreateGroupDefaults(job: Job) {
    const { groupId, email, groupName } = job.data as {
      groupId: string;
      email: string;
      groupName?: string;
    };

    this.logger.log(
      `[Job ${job.id}] Running create-group-user for groupId: ${groupId}, email: ${email}`,
    );

    try {
      // 1. Fetch all existing permissions
      const permissions = await this.prisma.permission.findMany();

      this.logger.debug(
        `[Job ${job.id}] Fetched ${permissions.length} permissions`,
      );

      // 2. Create group role 'entityAdmin' with all permissions connected
      const role = await this.prisma.groupRole.create({
        data: {
          name: 'entityAdmin',
          groupId,
          permissions: {
            connect: permissions.map((p) => ({ id: p.id })),
          },
        },
      });

      this.logger.debug(
        `[Job ${job.id}] Created group role with id: ${role.id}`,
      );

      // 2.5 Seed default chart of accounts for the group
      try {
        await seedDefaultChartOfAccounts(groupId);
        this.logger.debug(
          `[Job ${job.id}] Seeded default chart of accounts for group`,
        );
      } catch (err) {
        this.logger.error(
          `[Job ${job.id}] Failed to seed chart of accounts: ${err}`,
        );
        // Don't throw - continue with other setup steps
      }

      // 3. Create owner user and attach to the new role
      const password = 'Password123';
      const hashed = await bcrypt.hash(password, 10);

      await this.prisma.user.create({
        data: {
          email,
          firstName: groupName || 'Group',
          lastName: 'Admin',
          password: hashed,
          groupId,
          groupRoleId: role.id,
          systemRole: systemRole.admin,
        },
      });

      this.logger.debug(`[Job ${job.id}] Created owner user for group`);

      // Send welcome email to group admin
      try {
        const htmlContent = this.emailService.renderHtmlTemplate(
              path.join(process.cwd(), 'src/email/templates/group-admin-welcome.html'),
          {
            firstName: groupName || 'Group',
            groupName: groupName || 'Group',
            email,
            password,
          },
        );
        const html = this.emailService.wrapWithBaseTemplate(
          htmlContent,
          'Welcome to X-Finance',
          { year: new Date().getFullYear() },
        );
        await this.emailService.sendEmail({
          to: email,
          subject: 'Welcome to X-Finance',
          html,
        });
        this.logger.log(`[Job ${job.id}] Sent welcome email to group admin`);
      } catch (err) {
        this.logger.error(
          `[Job ${job.id}] Failed to send group admin welcome email: ${err}`,
        );
      }

      // Remove job from queue and Redis after successful completion
      await job.remove();
      this.logger.log(
        `[Job ${job.id}] ✓ create-group-user completed successfully and removed from queue`,
      );

      return { ok: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[Job ${job.id}] ✗ create-group-user FAILED: ${errorMsg}`,
        error instanceof Error ? error.stack : '',
      );
      throw error;
    }
  }

  async handleCreateEntityUser(job: Job) {
    const { entityId, groupId, email, entityName, legalName } = job.data as {
      entityId: string;
      groupId: string;
      email: string;
      entityName?: string;
      legalName?: string;
    };

    this.logger.log(
      `[Job ${job.id}] Running create-entity-user for groupId: ${groupId}, entityId: ${entityId}, email: ${email}, entityName: ${entityName}`,
    );

    try {
      // 1. Fetch the 'entityAdmin' group role for this group
      const entityAdminRole = await this.prisma.groupRole.findFirst({
        where: {
          groupId,
          name: 'entityAdmin',
        },
      });

      this.logger.debug(
        `[Job ${job.id}] Fetched entityAdmin role: ${entityAdminRole?.id || 'NOT FOUND'}`,
      );

      if (!entityAdminRole) {
        throw new Error(`entityAdmin role not found for group ${groupId}`);
      }

      // 2. Generate password for entity user
      const plainPassword = this.generateSimpleEntityPassword(
        entityName,
        legalName,
      );
      console.log('entity password', plainPassword);
      const hashed = await bcrypt.hash(plainPassword, 10);

      this.logger.debug(`[Job ${job.id}] Generated password for entity user`);

      // 3. Create user with systemRole 'user' and the entityAdmin groupRoleId
      await this.prisma.user.create({
        data: {
          email,
          firstName: entityName ? entityName.split(' ')[0] : 'Entity',
          lastName: 'Admin',
          password: hashed,
          entityId,
          groupId,
          groupRoleId: entityAdminRole.id,
          systemRole: systemRole.user,
        },
      });

      this.logger.debug(
        `[Job ${job.id}] Created entity user with email: ${email}`,
      );

      // 3.5 Seed default accounts for the entity
      try {
        await seedDefaultEntityAccounts(entityId, groupId);
        this.logger.debug(
          `[Job ${job.id}] Seeded default accounts for entity`,
        );
      } catch (err) {
        this.logger.error(
          `[Job ${job.id}] Failed to seed entity accounts: ${err}`,
        );
        // Don't throw - continue with other setup steps
      }

      // Send welcome email to entity user
try { const htmlContent = this.emailService.renderHtmlTemplate( path.join(process.cwd(), 'src/email/templates/entity-user-welcome.html'), { firstName: entityName ? entityName.split(' ')[0] : 'Entity', entityName: entityName || legalName || 'Entity', email, password: plainPassword,
          },
        );
        const html = this.emailService.wrapWithBaseTemplate(
          htmlContent,
          'Welcome to X-Finance',
          { year: new Date().getFullYear() },
        );
        await this.emailService.sendEmail({
          to: email,
          subject: 'Welcome to X-Finance',
          html,
        });
        this.logger.log(`[Job ${job.id}] Sent welcome email to entity user`);
      } catch (err) {
        this.logger.error(
          `[Job ${job.id}] Failed to send entity user welcome email: ${err}`,
        );
      }

      // Remove job from queue and Redis after successful completion
      await job.remove();
      this.logger.log(
        `[Job ${job.id}] ✓ create-entity-user completed successfully and removed from queue`,
      );

      return { ok: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[Job ${job.id}] ✗ create-entity-user FAILED: ${errorMsg}`,
        error instanceof Error ? error.stack : '',
      );
      throw error;
    }
  }

  private generateSimpleEntityPassword(
    name?: string,
    legalName?: string,
  ): string {
    const base = (legalName || name || 'Entity').trim();
    const cleanBase = base
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
      .replace(/[^a-zA-Z0-9]/g, '');

    const prefix = cleanBase.slice(0, 7);

    const randomNum = Math.floor(10 + Math.random() * 90);
    const symbols = '!@#$%^&*';
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];

    return `${prefix}${symbol}${randomNum}`;
  }

  /**
   * Handle invoice journal posting job
   * Posts invoice to journal and updates account balances
   */
  async handleInvoiceJournalPosting(job: Job): Promise<any> {
    const { invoiceId, invoiceData } = job.data as {
      invoiceId: string;
      invoiceData: {
        invoiceNumber: string;
        entityId: string;
        subtotal: number;
        tax: number;
        total: number;
        items: Array<{
          itemId: string;
          quantity: number;
          rate: number;
          total: number;
        }>;
      };
    };

    this.logger.log(
      `[Job ${job.id}] Processing invoice journal posting for invoice: ${invoiceData.invoiceNumber}`,
    );

    try {
      // Mark as Processing
      this.logger.debug(`[Job ${job.id}] Setting invoice ${invoiceId} to Processing state`);
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { postingStatus: 'Processing' },
      });

      // Fetch item details to determine type and COGS
      const itemDetails = await this.prisma.items.findMany({
        where: {
          id: { in: invoiceData.items.map((i) => i.itemId) },
        },
        select: {
          id: true,
          type: true,
          trackInventory: true,
          costPrice: true,
        },
      });

      // Separate items by type
      let productNetTotal = 0;
      let serviceNetTotal = 0;
      let cogsTotal = 0;

      for (const item of invoiceData.items) {
        const itemDetail = itemDetails.find((i) => i.id === item.itemId);
        if (!itemDetail) continue;

        const netAmount = item.total;

        if (itemDetail.type === ItemsType.product) {
          productNetTotal += netAmount;

          if (itemDetail.trackInventory && itemDetail.costPrice) {
            const itemCogs = itemDetail.costPrice * item.quantity;
            cogsTotal += itemCogs;
          }
        } else if (itemDetail.type === ItemsType.service) {
          serviceNetTotal += netAmount;
        }
      }

      // Find account codes
      const [
        arAccount,
        productRevenueAccount,
        serviceRevenueAccount,
        vatAccount,
        cogsAccount,
        inventoryAccount,
      ] = await Promise.all([
        this.prisma.account.findFirst({
          where: {
            code: '1120-01',
            entityId: invoiceData.entityId,
          },
          select: { id: true },
        }),
        this.prisma.account.findFirst({
          where: {
            code: '4110-01',
            entityId: invoiceData.entityId,
          },
          select: { id: true },
        }),
        this.prisma.account.findFirst({
          where: {
            code: '4120-01',
            entityId: invoiceData.entityId,
          },
          select: { id: true },
        }),
        this.prisma.account.findFirst({
          where: {
            code: '2140-01',
            entityId: invoiceData.entityId,
          },
          select: { id: true },
        }),
        this.prisma.account.findFirst({
          where: {
            code: '5110-01',
            entityId: invoiceData.entityId,
          },
          select: { id: true },
        }),
        this.prisma.account.findFirst({
          where: {
            code: '1130-01',
            entityId: invoiceData.entityId,
          },
          select: { id: true },
        }),
      ]);

      if (!arAccount) {
        throw new BadRequestException(
          'Accounts Receivable account (1120-01) not found for entity',
        );
      }

      // Build journal lines
      const journalLines: Array<{
        accountId: string;
        debit: number;
        credit: number;
      }> = [];

      journalLines.push({
        accountId: arAccount.id,
        debit: invoiceData.total,
        credit: 0,
      });

      if (productNetTotal > 0 && productRevenueAccount) {
        journalLines.push({
          accountId: productRevenueAccount.id,
          debit: 0,
          credit: productNetTotal,
        });
      }

      if (serviceNetTotal > 0 && serviceRevenueAccount) {
        journalLines.push({
          accountId: serviceRevenueAccount.id,
          debit: 0,
          credit: serviceNetTotal,
        });
      }

      if (invoiceData.tax > 0 && vatAccount) {
        journalLines.push({
          accountId: vatAccount.id,
          debit: 0,
          credit: invoiceData.tax,
        });
      }

      if (cogsTotal > 0 && cogsAccount && inventoryAccount) {
        journalLines.push({
          accountId: cogsAccount.id,
          debit: cogsTotal,
          credit: 0,
        });

        journalLines.push({
          accountId: inventoryAccount.id,
          debit: 0,
          credit: cogsTotal,
        });
      }

      // Validate journal balances
      const totalDebit = journalLines.reduce(
        (sum, line) => sum + line.debit,
        0,
      );
      const totalCredit = journalLines.reduce(
        (sum, line) => sum + line.credit,
        0,
      );

      if (totalDebit !== totalCredit) {
        throw new BadRequestException(
          `Journal entry does not balance. Debit: ${totalDebit}, Credit: ${totalCredit}`,
        );
      }

      // Create journal entry in transaction
      await this.prisma.$transaction(async (tx) => {
        const journalRef = generateJournalReference('INV');
        const postedAt = new Date();
        
        // Create journal
        await tx.journal.create({
          data: {
            description: `Invoice ${invoiceData.invoiceNumber} posted`,
            date: postedAt,
            reference: journalRef,
            entityId: invoiceData.entityId,
            lines: journalLines,
          },
        });

        // Get current account balances and update them
        const accountBalances = await Promise.all(
          journalLines.map((line) =>
            tx.account.findUnique({ where: { id: line.accountId }, select: { balance: true } }),
          ),
        );

        const updatedAccounts = await Promise.all(
          journalLines.map((line) =>
            tx.account.update({
              where: { id: line.accountId },
              data: {
                balance: {
                  increment: line.debit - line.credit,
                },
              },
              select: { balance: true },
            }),
          ),
        );

        // Create account transactions for each journal line with running balance
        await Promise.all(
          journalLines.map((line, index) =>
            tx.accountTransaction.create({
              data: {
                date: postedAt,
                description: `Invoice ${invoiceData.invoiceNumber} posted to journal`,
                reference: journalRef,
                type: 'INVOICE_POSTING',
                status: 'Success',
                accountId: line.accountId,
                debitAmount: line.debit,
                creditAmount: line.credit,
                runningBalance: updatedAccounts[index].balance,
                entityId: invoiceData.entityId,
                relatedEntityId: invoiceId,
                relatedEntityType: 'Invoice',
                metadata: {
                  invoiceNumber: invoiceData.invoiceNumber,
                  journalReference: journalRef,
                },
              },
            }),
          ),
        );

        // Mark invoice as successfully posted with reference and timestamp
        this.logger.debug(`[Job ${job.id}] Updating invoice ${invoiceId} with postingStatus=Success and reference=${journalRef}`);
        
        const invoiceUpdateResult = await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            postingStatus: 'Success',
            journalReference: journalRef,
            postedAt,
          },
        });

        this.logger.debug(
          `[Job ${job.id}] Invoice updated. postingStatus=${invoiceUpdateResult.postingStatus}, journalReference=${invoiceUpdateResult.journalReference}`,
        );

        // Log activity
        await tx.invoiceActivity.create({
          data: {
            invoiceId,
            activityType: InvoiceActivityType.Sent,
            description: 'Invoice posted to journal',
            metadata: { reference: journalRef },
          } as any,  // performedBy is optional after migration
        });
      });

      this.logger.log(
        `[Job ${job.id}] Successfully posted invoice ${invoiceData.invoiceNumber} to journal`,
      );

      return { success: true, invoiceId };
    } catch (error) {
      this.logger.error(
        `[Job ${job.id}] Failed to post invoice journal: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Update invoice posting status to Failed for retry
      try {
        await this.prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            postingStatus: 'Failed',
          },
        });
      } catch (updateError) {
        this.logger.error(
          `[Job ${job.id}] Failed to update invoice status to Failed`,
        );
      }

      throw error; // Rethrow to trigger retry
    }
  }

  /**
   * Handle payment received journal posting
   * Posts: Dr Bank/Cash Account = payment amount
   *        Cr Accounts Receivable = payment amount
   */
  async handlePaymentReceivedPosting(job: Job): Promise<any> {
    const { paymentId, paymentData } = job.data as {
      paymentId: string;
      paymentData: {
        amount: number;
        paymentNumber: string;
        bankAccountId: string;
        entityId: string;
      };
    };

    this.logger.log(
      `[Job ${job.id}] Processing payment journal posting for payment: ${paymentData.paymentNumber}`,
    );

    try {
      // Mark as Processing
      this.logger.debug(`[Job ${job.id}] Setting payment ${paymentId} to Processing state`);
      await this.prisma.paymentReceived.update({
        where: { id: paymentId },
        data: { postingStatus: 'Processing' },
      });

      // Find Accounts Receivable account (credit side)
      const arAccount = await this.prisma.account.findFirst({
        where: {
          code: '1120-01', // Accounts Receivable
          entityId: paymentData.entityId,
        },
        select: { id: true },
      });

      if (!arAccount) {
        throw new BadRequestException(
          'Accounts Receivable account (1120-01) not found for entity',
        );
      }

      // Find bank/cash account (debit side) - passed as depositTo ID
      const bankAccount = await this.prisma.account.findUnique({
        where: { id: paymentData.bankAccountId },
        select: { id: true, code: true },
      });

      if (!bankAccount) {
        throw new BadRequestException('Bank account not found');
      }

      // Build journal lines
      const journalLines: Array<{
        accountId: string;
        debit: number;
        credit: number;
      }> = [
        // Dr Bank/Cash Account
        {
          accountId: bankAccount.id,
          debit: paymentData.amount,
          credit: 0,
        },
        // Cr Accounts Receivable
        {
          accountId: arAccount.id,
          debit: 0,
          credit: paymentData.amount,
        },
      ];

      // Create journal entry in transaction
      await this.prisma.$transaction(async (tx) => {
        const journalRef = generateJournalReference('PAY');
        const postedAt = new Date();

        // Create journal
        await tx.journal.create({
          data: {
            description: `Payment ${paymentData.paymentNumber} received`,
            date: postedAt,
            reference: journalRef,
            entityId: paymentData.entityId,
            lines: journalLines,
          },
        });

        // Get current account balances and update them
        const accountBalances = await Promise.all(
          journalLines.map((line) =>
            tx.account.findUnique({ where: { id: line.accountId }, select: { balance: true } }),
          ),
        );

        const updatedAccounts = await Promise.all(
          journalLines.map((line) =>
            tx.account.update({
              where: { id: line.accountId },
              data: {
                balance: {
                  increment: line.debit - line.credit,
                },
              },
              select: { balance: true },
            }),
          ),
        );

        // Create account transactions for each journal line with running balance
        await Promise.all(
          journalLines.map((line, index) =>
            tx.accountTransaction.create({
              data: {
                date: postedAt,
                description: `Payment ${paymentData.paymentNumber} received and posted to journal`,
                reference: journalRef,
                type: 'PAYMENT_RECEIVED_POSTING',
                status: 'Success',
                accountId: line.accountId,
                debitAmount: line.debit,
                creditAmount: line.credit,
                runningBalance: updatedAccounts[index].balance,
                entityId: paymentData.entityId,
                relatedEntityId: paymentId,
                relatedEntityType: 'PaymentReceived',
                bankAccountId: paymentData.bankAccountId,
                metadata: {
                  paymentNumber: paymentData.paymentNumber,
                  journalReference: journalRef,
                  paymentAmount: paymentData.amount,
                },
              },
            }),
          ),
        );

        // Update payment record with posting status
        this.logger.debug(`[Job ${job.id}] Updating payment ${paymentId} with postingStatus=Success and reference=${journalRef}`);
        
        const paymentUpdateResult = await tx.paymentReceived.update({
          where: { id: paymentId },
          data: {
            postingStatus: 'Success',
            journalReference: journalRef,
            postedAt,
          },
        });

        this.logger.debug(
          `[Job ${job.id}] Payment updated. postingStatus=${paymentUpdateResult.postingStatus}, journalReference=${paymentUpdateResult.journalReference}`,
        );
      });

      this.logger.log(
        `[Job ${job.id}] Successfully posted payment ${paymentData.paymentNumber} to journal`,
      );

      return { success: true, paymentId };
    } catch (error) {
      this.logger.error(
        `[Job ${job.id}] Failed to post payment journal: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Update payment posting status to Failed for retry
      try {
        await this.prisma.paymentReceived.update({
          where: { id: paymentId },
          data: {
            postingStatus: 'Failed',
          },
        });
      } catch (updateError) {
        this.logger.error(
          `[Job ${job.id}] Failed to update payment status to Failed`,
        );
      }

      throw error; // Rethrow to trigger retry
    }
  }

  /**
   * Handle receipt journal posting job
   * Posts sales receipt to journal (immediate cash sale)
   * Dr Cash/Bank Account = total
   * Cr Product Revenue (4110) = product net
   * Cr Service Revenue (4120) = service net
   * Cr Tax Payable (2140) = tax (if tax > 0)
   */
  async handleReceiptJournalPosting(job: Job): Promise<any> {
    const { receiptId, receiptData } = job.data as {
      receiptId: string;
      receiptData: {
        receiptNumber: string;
        entityId: string;
        subtotal: number;
        tax: number;
        total: number;
        depositTo: string;
        items: Array<{
          itemId: string;
          quantity: number;
          rate: number;
          total: number;
        }>;
      };
    };

    this.logger.log(
      `[Job ${job.id}] Processing receipt journal posting for receipt: ${receiptData.receiptNumber}`,
    );

    try {
      // Mark as Processing
      this.logger.debug(`[Job ${job.id}] Setting receipt ${receiptId} to Processing state`);
      await this.prisma.receipt.update({
        where: { id: receiptId },
        data: { postingStatus: 'Processing' },
      });

      // Fetch item details to determine type
      const itemDetails = await this.prisma.items.findMany({
        where: {
          id: { in: receiptData.items.map((i) => i.itemId) },
        },
        select: {
          id: true,
          type: true,
        },
      });

      // Separate items by type
      let productNetTotal = 0;
      let serviceNetTotal = 0;

      for (const item of receiptData.items) {
        const itemDetail = itemDetails.find((i) => i.id === item.itemId);
        if (!itemDetail) continue;

        const netAmount = item.total;

        if (itemDetail.type === 'product') {
          productNetTotal += netAmount;
        } else if (itemDetail.type === 'service') {
          serviceNetTotal += netAmount;
        }
      }

      // Find account codes
      const [
        depositAccount,
        productRevenueAccount,
        serviceRevenueAccount,
        vatAccount,
      ] = await Promise.all([
        this.prisma.account.findUnique({
          where: { id: receiptData.depositTo },
          select: { id: true },
        }),
        this.prisma.account.findFirst({
          where: {
            code: '4110-01',
            entityId: receiptData.entityId,
          },
          select: { id: true },
        }),
        this.prisma.account.findFirst({
          where: {
            code: '4120-01',
            entityId: receiptData.entityId,
          },
          select: { id: true },
        }),
        this.prisma.account.findFirst({
          where: {
            code: '2140-01',
            entityId: receiptData.entityId,
          },
          select: { id: true },
        }),
      ]);

      if (!depositAccount) {
        throw new Error(`Deposit account not found for ID: ${receiptData.depositTo}`);
      }

      // Build journal lines
      const journalLines: Array<{
        accountId: string;
        debit: number;
        credit: number;
      }> = [];

      // Dr Cash/Bank Account
      journalLines.push({
        accountId: depositAccount.id,
        debit: receiptData.total,
        credit: 0,
      });

      // Cr Product Sales Revenue (if any products)
      if (productNetTotal > 0 && productRevenueAccount) {
        journalLines.push({
          accountId: productRevenueAccount.id,
          debit: 0,
          credit: productNetTotal,
        });
      }

      // Cr Service Revenue (if any services)
      if (serviceNetTotal > 0 && serviceRevenueAccount) {
        journalLines.push({
          accountId: serviceRevenueAccount.id,
          debit: 0,
          credit: serviceNetTotal,
        });
      }

      // Cr VAT Payable (if tax > 0)
      if (receiptData.tax > 0 && vatAccount) {
        journalLines.push({
          accountId: vatAccount.id,
          debit: 0,
          credit: receiptData.tax,
        });
      }

      // Validate journal balances
      const totalDebit = journalLines.reduce(
        (sum, line) => sum + line.debit,
        0,
      );
      const totalCredit = journalLines.reduce(
        (sum, line) => sum + line.credit,
        0,
      );

      if (totalDebit !== totalCredit) {
        throw new Error(
          `Journal entry does not balance. Debit: ${totalDebit}, Credit: ${totalCredit}`,
        );
      }

      // Create journal entry in transaction
      await this.prisma.$transaction(async (tx) => {
        const journalRef = generateJournalReference('RCT');
        const postedAt = new Date();

        // Create journal
        await tx.journal.create({
          data: {
            description: `Receipt ${receiptData.receiptNumber} posted`,
            date: postedAt,
            reference: journalRef,
            entityId: receiptData.entityId,
            lines: journalLines,
          },
        });

        // Get current account balances and update them
        const accountBalances = await Promise.all(
          journalLines.map((line) =>
            tx.account.findUnique({ where: { id: line.accountId }, select: { balance: true } }),
          ),
        );

        const updatedAccounts = await Promise.all(
          journalLines.map((line) =>
            tx.account.update({
              where: { id: line.accountId },
              data: {
                balance: {
                  increment: line.debit - line.credit,
                },
              },
              select: { balance: true },
            }),
          ),
        );

        // Create account transactions for each journal line with running balance
        await Promise.all(
          journalLines.map((line, index) =>
            tx.accountTransaction.create({
              data: {
                date: postedAt,
                description: `Receipt ${receiptData.receiptNumber} posted to journal`,
                reference: journalRef,
                type: 'RECEIPT_POSTING',
                status: 'Success',
                accountId: line.accountId,
                debitAmount: line.debit,
                creditAmount: line.credit,
                runningBalance: updatedAccounts[index].balance,
                entityId: receiptData.entityId,
                relatedEntityId: receiptId,
                relatedEntityType: 'Receipt',
                metadata: {
                  receiptNumber: receiptData.receiptNumber,
                  journalReference: journalRef,
                },
              },
            }),
          ),
        );

        // Mark receipt as successfully posted with reference and timestamp
        this.logger.debug(`[Job ${job.id}] Updating receipt ${receiptId} with postingStatus=Success and reference=${journalRef}`);
        
        const receiptUpdateResult = await tx.receipt.update({
          where: { id: receiptId },
          data: {
            postingStatus: 'Success',
            journalReference: journalRef,
            postedAt,
          },
        });

        this.logger.debug(
          `[Job ${job.id}] Receipt updated. postingStatus=${receiptUpdateResult.postingStatus}, journalReference=${receiptUpdateResult.journalReference}`,
        );
      });

      this.logger.log(
        `[Job ${job.id}] Successfully posted receipt ${receiptData.receiptNumber} to journal`,
      );

      return { success: true, receiptId };
    } catch (error) {
      this.logger.error(
        `[Job ${job.id}] Failed to post receipt journal: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Update receipt posting status to Failed for retry
      try {
        await this.prisma.receipt.update({
          where: { id: receiptId },
          data: {
            postingStatus: 'Failed',
          },
        });
      } catch (updateError) {
        this.logger.error(
          `[Job ${job.id}] Failed to update receipt status to Failed`,
        );
      }

      throw error; // Rethrow to trigger retry
    }
  }

}