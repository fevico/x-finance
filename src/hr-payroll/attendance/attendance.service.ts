import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AttendanceService {
        constructor(private prisma: PrismaService){} 
}
