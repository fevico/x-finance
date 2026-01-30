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

  async update(id: string, account: UpdateAccountDto) {}

  async findOne(id: string) {}
}
