import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateJournalDto, UpdateJournalDto } from './dto/journal.dto';
import { generateJournalReference } from '@/auth/utils/helper';
import { PrismaService } from '@/prisma/prisma.service';
import { Journal } from 'prisma/generated/client';

@Injectable()
export class JournalService {
  constructor(private prisma: PrismaService) {} 

//   async create(createJournalDto: CreateJournalDto, entityId: string) {
//     const reference = createJournalDto.reference || generateJournalReference();

//     // Optional: validate that total debit === total credit 
//     const totalDebit = createJournalDto.lines.reduce(
//       (sum, line) => sum + (line.debit || 0),
//       0,
//     );     
//     const totalCredit = createJournalDto.lines.reduce(
//       (sum, line) => sum + (line.credit || 0),
//       0,
//     );

//     if (totalDebit !== totalCredit) {
//       throw new BadRequestException(
//         'Journal must balance: total debit ≠ total credit',
//       );
//     }

//     return this.prisma.journal.create({
//       data: {
//         ...createJournalDto,
//         date: new Date(createJournalDto.date), // convert string → Date
//         reference,
//         entityId,
//         lines: createJournalDto.lines as Prisma.JsonObject, // or Prisma.JsonArray
//       },   
//     });
//   }  

async create(dto: CreateJournalDto): Promise<Journal> {
    // Optional: you can add business validation here
    // e.g. check that total debit == total credit
    const totalDebit = dto.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = dto.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new BadRequestException('Journal is not balanced: debit ≠ credit');
    }

    const reference = generateJournalReference();

    return this.prisma.journal.create({
      data: {
        description: dto.description,
        date: new Date(dto.date),
        lines: dto.lines as any, // Ensure lines are of type Prisma.JsonObject
        reference,
        entityId: dto.entityId,
      },
    });
  }

  async findAll(entityId: string): Promise<Journal[]> {
    return this.prisma.journal.findMany({
      where:{ entityId },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string, entityId: string): Promise<Journal> {
    const journal = await this.prisma.journal.findFirst({
      where: {
        id,
        entityId ,
      },
    });

    if (!journal) {
      throw new NotFoundException(`Journal with ID ${id} not found`);
    }

    return journal;
  }

  async update(id: string, dto: UpdateJournalDto, entityId: string): Promise<Journal> {
   const journal =  await this.findOne(id, entityId); // check existence

    return this.prisma.journal.update({
      where: { id },
      data: {
        description: dto.description,
        date: dto.date ? new Date(dto.date) : journal.date,
        lines: dto.lines ? (dto.lines as any) : journal.lines,
      },
    });
  }

  async remove(id: string, entityId: string): Promise<void> {
    await this.findOne(id, entityId);
    await this.prisma.journal.delete({ where: { id } });
  }

  // Optional: get journals by reference
  async findByReference(reference: string, entityId?: string): Promise<Journal[]> {
    return this.prisma.journal.findMany({
      where: {
        reference,
        ...(entityId && { entityId }),
      },
    });
  }
}
