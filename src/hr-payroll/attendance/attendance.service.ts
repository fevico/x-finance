import { PrismaService } from '@/prisma/prisma.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  BatchCreateAttendanceDto,
  UpdateAttendanceDto,
} from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async markAttendanceBatch(body: BatchCreateAttendanceDto, entityId: string) {
    try {
      const attendanceDate = new Date(body.date);
      attendanceDate.setHours(0, 0, 0, 0);

      // Start transaction to create AttendanceLog and multiple Attendance records
      const result = await this.prisma.$transaction(async (tx) => {
        // Create or get AttendanceLog for the date
        const attendanceLog = await tx.attendanceLog.upsert({
          where: {
            date_entityId: {
              date: attendanceDate,
              entityId,
            },
          },
          update: {},
          create: {
            date: attendanceDate,
            entityId,
          },
        });

        // Create attendance records for each employee
        const attendances = await Promise.all(
          body.attendances.map((attendance) =>
            tx.attendance.create({
              data: {
                employeeId: attendance.employeeId,
                status: attendance.status,
                checkInTime: attendance.checkInTime
                  ? new Date(attendance.checkInTime)
                  : null,
                checkOutTime: attendance.checkOutTime
                  ? new Date(attendance.checkOutTime)
                  : null,
                notes: attendance.note,
                attendanceLogId: attendanceLog.id,
                entityId,
              },
              include: {
                employee: true,
              },
            }),
          ),
        );

        return {
          attendanceLog,
          attendances,
        };
      });

      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(`${error instanceof Error ? error.message : String(error)}`, HttpStatus.BAD_REQUEST);
    }
  }

  async getAttendanceLogByDate(date: string, entityId: string) {
    try {
      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);

      const attendanceLog = await this.prisma.attendanceLog.findUnique({
        where: {
          date_entityId: {
            date: attendanceDate,
            entityId,
          },
        },
        include: {
          attendances: {
            include: {
              employee: true,
            },
          },
        },
      });

      if (!attendanceLog) {
        throw new HttpException(
          'No attendance records found for this date',
          HttpStatus.NOT_FOUND,
        );
      }

      return attendanceLog;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(`${error instanceof Error ? error.message : String(error)}`, HttpStatus.BAD_REQUEST);
    }
  }

  async getEmployeeAttendanceHistory(
    employeeId: string,
    entityId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;

      const [attendances, totalCount] = await Promise.all([
        this.prisma.attendance.findMany({
          where: { employeeId, entityId },
          include: {
            employee: true,
            attendanceLog: true,
          },
          skip,
          take: limit,
          orderBy: { attendanceLog: { date: 'desc' } },
        }),
        this.prisma.attendance.count({ where: { employeeId, entityId } }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        attendances,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          limit,
        },
      };
    } catch (error) {
      throw new HttpException(`${error instanceof Error ? error.message : String(error)}`, HttpStatus.BAD_REQUEST);
    }
  }

  async getAttendanceById(attendanceId: string, entityId: string) {
    try {
      const attendance = await this.prisma.attendance.findUnique({
        where: { id: attendanceId },
        include: {
          employee: true,
          attendanceLog: true,
        },
      });

      if (!attendance) {
        throw new HttpException(
          'Attendance record not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (attendance.entityId !== entityId) {
        throw new HttpException(
          'You do not have permission to access this attendance record',
          HttpStatus.FORBIDDEN,
        );
      }

      return attendance;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(`${error instanceof Error ? error.message : String(error)}`, HttpStatus.BAD_REQUEST);
    }
  }

  async updateAttendance(
    attendanceId: string,
    entityId: string,
    body: UpdateAttendanceDto,
  ) {
    try {
      const attendance = await this.prisma.attendance.findUnique({
        where: { id: attendanceId },
      });

      if (!attendance) {
        throw new HttpException(
          'Attendance record not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (attendance.entityId !== entityId) {
        throw new HttpException(
          'You do not have permission to update this attendance record',
          HttpStatus.FORBIDDEN,
        );
      }

      const updatedAttendance = await this.prisma.attendance.update({
        where: { id: attendanceId },
        data: {
          status: body.status,
          checkInTime: body.checkInTime
            ? new Date(body.checkInTime)
            : undefined,
          checkOutTime: body.checkOutTime
            ? new Date(body.checkOutTime)
            : undefined,
          notes: body.note,
        },
        include: {
          employee: true,
          attendanceLog: true,
        },
      });

      return updatedAttendance;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(`${error instanceof Error ? error.message : String(error)}`, HttpStatus.BAD_REQUEST);
    }
  }

  async deleteAttendanceLog(attendanceLogId: string, entityId: string) {
    try {
      const attendanceLog = await this.prisma.attendanceLog.findUnique({
        where: { id: attendanceLogId },
      });

      if (!attendanceLog) {
        throw new HttpException(
          'Attendance log not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (attendanceLog.entityId !== entityId) {
        throw new HttpException(
          'You do not have permission to delete this attendance log',
          HttpStatus.FORBIDDEN,
        );
      }

      await this.prisma.attendanceLog.delete({
        where: { id: attendanceLogId },
      });

      return { success: true, message: 'Attendance log deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(`${error instanceof Error ? error.message : String(error)}`, HttpStatus.BAD_REQUEST);
    }
  }

  private calculateHours(
    checkInTime: Date | null,
    checkOutTime: Date | null,
  ): number {
    if (!checkInTime || !checkOutTime) return 0;
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Hours with 2 decimal places
  }

  private enrichAttendanceWithHours(attendances: any[]) {
    return attendances.map((att) => ({
      ...att,
      hoursWorked: this.calculateHours(att.checkInTime, att.checkOutTime),
    }));
  }

  async getAllEntityAttendance(
    entityId: string,
    date?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: any = { entityId };
      if (date) {
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(attendanceDate);
        nextDay.setDate(nextDay.getDate() + 1);

        whereClause.attendanceLog = {
          date: {
            gte: attendanceDate,
            lt: nextDay,
          },
        };
      }

      // Get paginated attendance records
      const [attendances, totalCount] = await Promise.all([
        this.prisma.attendance.findMany({
          where: whereClause,
          include: {
            employee: true,
            attendanceLog: true,
          },
          skip,
          take: limit,
          orderBy: { attendanceLog: { date: 'desc' } },
        }),
        this.prisma.attendance.count({ where: whereClause }),
      ]);

      // Enrich with hoursWorked
      const enrichedAttendances = this.enrichAttendanceWithHours(attendances);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextDay = new Date(today);
      nextDay.setDate(nextDay.getDate() + 1);

      // Today's attendance stats
      const todayAttendances = await this.prisma.attendance.findMany({
        where: {
          entityId,
          attendanceLog: {
            date: {
              gte: today,
              lt: nextDay,
            },
          },
        },
      });

      const totalPresentToday = todayAttendances.filter(
        (a) => a.status?.toLowerCase() === 'present',
      ).length;
      const totalEmployees = await this.prisma.employee.count({
        where: { entityId, status: 'Active' },
      });
      const presentPercentage =
        totalEmployees > 0
          ? Math.round((totalPresentToday / totalEmployees) * 100)
          : 0;

      // Total on leave
      const totalOnLeave = await this.prisma.attendance.count({
        where: {
          entityId,
          status: { in: ['Leave', 'leave', 'LEAVE'] },
        },
      });

      // Total absent
      const totalAbsent = await this.prisma.attendance.count({
        where: {
          entityId,
          status: { in: ['Absent', 'absent', 'ABSENT'] },
        },
      });

      // Average hours for current month
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

      const monthAttendances = await this.prisma.attendance.findMany({
        where: {
          entityId,
          attendanceLog: {
            date: {
              gte: monthStart,
              lt: monthEnd,
            },
          },
          checkInTime: { not: null },
          checkOutTime: { not: null },
        },
      });

      const totalHoursMonth = monthAttendances.reduce((sum, att) => {
        return sum + this.calculateHours(att.checkInTime, att.checkOutTime);
      }, 0);

      const averageHoursMonth =
        monthAttendances.length > 0
          ? Math.round((totalHoursMonth / monthAttendances.length) * 100) / 100
          : 0;

      const totalPages = Math.ceil(totalCount / limit);

      return {
        attendances: enrichedAttendances,
        stats: {
          todayStats: {
            totalPresentToday,
            totalEmployees,
            presentPercentage,
          },
          overallStats: {
            totalOnLeave,
            totalAbsent,
            averageHoursMonth,
          },
        },
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          limit,
        },
      };
    } catch (error) {
      throw new HttpException(`${error instanceof Error ? error.message : String(error)}`, HttpStatus.BAD_REQUEST);
    }
  }
}
