import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateIssueHistoryDto, BulkIssueHistoryDto, UpdateIssueHistoryDto } from './issue-history.dto';

@Injectable()
export class IssueHistoryService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateIssueHistoryDto, entityId: string) {
    try {
      const supply = await this.prisma.storeSupply.findFirst({ where: { id: createDto.supplyId, entityId } });
      if (!supply) throw new HttpException('Supply not found', HttpStatus.NOT_FOUND);
      if (supply.quantity < createDto.quantity) throw new HttpException('Insufficient quantity in stock', HttpStatus.BAD_REQUEST);

      let employeeId: string | null = null;
      let issuedTo = createDto.issuedTo;
      if (createDto.type === 'employee') {
        const employee = await this.prisma.employee.findFirst({ where: { id: createDto.issuedTo, entityId } });
        if (!employee) throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
        employeeId = createDto.issuedTo;
        issuedTo = `${employee.firstName} ${employee.lastName}`;
      }

      const issue = await this.prisma.$transaction(async (tx) => {
        const created = await tx.supplyIssueHistory.create({
          data: {
            supplyId: createDto.supplyId,
            quantity: createDto.quantity,
            issuedTo,
            type: createDto.type,
            purpose: createDto.purpose,
            issuedById: createDto.issuedById,
            notes: createDto.notes,
            issueDate: createDto.issueDate,
            entityId,
            employeeId,
          },
        });

        await tx.storeSupply.update({
          where: { id: createDto.supplyId },
          data: { quantity: supply.quantity - createDto.quantity },
        });

        return created;
      });

      return issue;
    } catch (error) {
      throw new HttpException(
        `${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async bulkCreate(bulkDto: BulkIssueHistoryDto, entityId: string) {
    try {
      const { items, ...rest } = bulkDto;

      // Validate issuedTo if type is employee
      let employeeId: string | null = null;
      let issuedTo = rest.issuedTo;
      if (rest.type === 'employee') {
        const employee = await this.prisma.employee.findFirst({ where: { id: rest.issuedTo, entityId } });
        if (!employee) throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
        employeeId = rest.issuedTo;
        issuedTo = employee.firstName + ' ' + employee.lastName;
      }
      // For department and project, issuedTo remains as the string provided
      // add department and project checks herre when model is added

      // Use transaction for atomicity
      const results = await this.prisma.$transaction(async (tx) => {
        const createdIssues = [] as any[];
        for (const item of items) {
          // Check if supply exists and has enough quantity
          const supply = await tx.storeSupply.findFirst({ where: { id: item.supplyId, entityId } });
          if (!supply) throw new HttpException(`Supply not found for ID: ${item.supplyId}`, HttpStatus.NOT_FOUND);
          if (supply.quantity < item.quantity) throw new HttpException(`Insufficient quantity in stock for supply ID: ${item.supplyId}`, HttpStatus.BAD_REQUEST);

          // Create the issue history
          const issue = await tx.supplyIssueHistory.create({
            data: {
              supplyId: item.supplyId,
              quantity: item.quantity,
              issuedTo,
              type: rest.type,
              purpose: rest.purpose,
              issuedById: rest.issuedById,
              notes: rest.notes,
              issueDate: rest.issueDate,
              entityId,
              employeeId,
            },
          });

          // Update supply quantity
          await tx.storeSupply.update({
            where: { id: item.supplyId },
            data: { quantity: supply.quantity - item.quantity },
          });

          createdIssues.push(issue);
        }
        return createdIssues;
      });

      return results;
    } catch (error) {
      throw new HttpException(
        `${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(entityId: string, query: { page?: number; limit?: number; search?: string }) {
    try {
      const { page = 1, limit = 10, search } = query;
      const skip = (page - 1) * limit;

      const where: any = { entityId };
      if (search) {
        const textFilter = { contains: search, mode: 'insensitive' };
        where.OR = [
          { issuedTo: textFilter },
          { type: textFilter },
          { purpose: textFilter },
          { issueDate: { equals: search } },
          { supply: { name: textFilter } },
        ];
      }

      const [data, total] = await Promise.all([
        this.prisma.supplyIssueHistory.findMany({
          where,
          skip: Number(skip),
          take: Number(limit),
          orderBy: { issueDate: 'desc' },
          include: {
            supply: true,
            employee: true,
            issuedBy: true,
            updatedBy: true,
          },
        }),
        this.prisma.supplyIssueHistory.count({ where }),
      ]);

      return {
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      };
    } catch (error) {
      throw new HttpException(
        `${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string, entityId: string) {
    try {
      const issue = await this.prisma.supplyIssueHistory.findFirst({ where: { id, entityId } });
      if (!issue) throw new HttpException('Issue not found', HttpStatus.NOT_FOUND);
      return issue;
    } catch (error) {
      throw new HttpException(
        `${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateDto: UpdateIssueHistoryDto, entityId: string) {
    try {
      const issue = await this.prisma.supplyIssueHistory.findFirst({ where: { id, entityId } });
      if (!issue) throw new HttpException('Issue not found', HttpStatus.NOT_FOUND);

      let employeeId: string | null = issue.employeeId;
      let issuedTo = updateDto.issuedTo || issue.issuedTo;
      if (updateDto.type === 'employee' && updateDto.issuedTo) {
        const employee = await this.prisma.employee.findFirst({ where: { id: updateDto.issuedTo, entityId } });
        if (!employee) throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
        employeeId = updateDto.issuedTo;
        issuedTo = employee.firstName + ' ' + employee.lastName;
      }

      // Handle quantity change
      let quantityAdjustment = 0;
      if (updateDto.quantity !== undefined && updateDto.quantity !== issue.quantity) {
        quantityAdjustment = issue.quantity - updateDto.quantity; // positive means return to stock, negative means take more
        const supply = await this.prisma.storeSupply.findFirst({ where: { id: issue.supplyId, entityId } });
        if (!supply) throw new HttpException('Supply not found', HttpStatus.NOT_FOUND);
        const newQuantity = supply.quantity + quantityAdjustment;
        if (newQuantity < 0) throw new HttpException('Insufficient quantity in stock for the updated quantity', HttpStatus.BAD_REQUEST);
        await this.prisma.storeSupply.update({
          where: { id: issue.supplyId },
          data: { quantity: newQuantity },
        });
      }

      return await this.prisma.supplyIssueHistory.update({
        where: { id },
        data: {
          ...updateDto,
          issuedTo,
          employeeId,
        },
      });
    } catch (error) {
      throw new HttpException(
        `${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string, entityId: string) {
    try {
      const issue = await this.prisma.supplyIssueHistory.findFirst({ where: { id, entityId } });
      if (!issue) throw new HttpException('Issue not found', HttpStatus.NOT_FOUND);
      await this.prisma.supplyIssueHistory.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      throw new HttpException(
        `${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
