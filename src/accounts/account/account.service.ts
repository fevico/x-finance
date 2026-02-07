import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  AccountResponseDto,
  CreateAccountDto,
  OpeningBalanceDto,
  UpdateAccountDto,
} from './dto/account.dto';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  async create(accounts: CreateAccountDto, entityId: string) {
    try {
      const entity = await this.prisma.entity.findUnique({
        where: { id: entityId },
      });
      if (!entity) throw new UnauthorizedException('Access denied!');
      const account = await this.prisma.account.create({
        data: { ...accounts, entityId },
      });
      return account;
    } catch (error) {
      throw new HttpException(
        `${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(entityId: string): Promise<AccountResponseDto[]> {
    try {
      return this.prisma.account.findMany({ where: { entityId } });
    } catch (error) {
      throw new HttpException(
        `${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

async setOpeningBalances(
    entityId: string,
    dto: OpeningBalanceDto,
  ) {
    try {
      // Process each line independently as a separate record update for its account
      for (const line of dto.lines) {
        const { accountId, debit = 0, credit = 0 } = line;

        // Validate and fetch the account
        const account = await this.prisma.account.findFirst({
          where: { id: accountId, entityId },
        });
        if (!account) {
          throw new UnauthorizedException(`Access denied for account ${accountId}!`);
        }

        // Calculate the balance for this specific record (per account)
        // Assuming balance = credit - debit for opening balance; adjust based on account type if needed
        // e.g., if (account.type === 'asset') balance = debit - credit; else balance = credit - debit;
        const balance = credit - debit;

        // Update this account's record with its own debit, credit, and calculated balance
        // This assumes setting/replacing the opening values; if additive (e.g., adjustments), use account.debit + debit, etc.
        await this.prisma.account.update({
          where: { id: accountId },
          data: {
            debit,
            credit,
            balance,
            date: new Date(), // Optional: Timestamp the update
          },
        });
      }

      // Return a success message
      return { message: 'Opening balances set successfully for all provided accounts.' };
    } catch (error) {
      // Handle errors (log or rethrow as needed)
      throw error;
    }
  }

  async update(id: string, account: UpdateAccountDto) {}

  async findOne(id: string) {}
}
