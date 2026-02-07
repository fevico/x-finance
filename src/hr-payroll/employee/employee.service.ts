import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { FileuploadService } from '@/fileupload/fileupload.service';
import {
  CreateEmployeeDto,
  EmployeeResponseDto,
  EmployeeStatsDto,
} from './dto/employee.dto';

@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileuploadService: FileuploadService,
  ) {}

  async create(
    employeeData: CreateEmployeeDto,
    profileImage: Express.Multer.File,
    entityId: string,
  ): Promise<EmployeeResponseDto> {
    try {
      let profileImageData: { publicId: any; secureUrl: any } | null = null;

      if (profileImage) {
        const uploadResult = await this.fileuploadService.uploadFile(
          profileImage,
          'employee-profiles',
        );
        profileImageData = {
          publicId: uploadResult.publicId,
          secureUrl: uploadResult.secureUrl,
        };
      }

      const employee = await this.prisma.employee.create({
        data: {
          ...employeeData,
          addressInfo: employeeData.addressInfo as any,
          emergencyContact: employeeData.emergencyContact as any,
          profileImage: profileImageData as any,
          entityId,
        },
      });

      return employee as EmployeeResponseDto;
    } catch (error) {
      throw new HttpException(
        `${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(
    entityId: string,
  ): Promise<{ employees: EmployeeResponseDto[]; stats: EmployeeStatsDto }> {
    try {
      const employees = await this.prisma.employee.findMany({
        where: { entityId },
      });

      // Calculate stats
      const totalEmployees = employees.length;
      const totalActive = employees.filter(
        (emp) =>
          emp.status === 'Active',
      ).length; // Assuming 'Active' status
      const totalOnLeave = employees.filter((emp) =>
        emp.status === 'On_Leave',
      ).length; // Assuming status indicates leave

      // Hired this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const totalHiredThisMonth = employees.filter(
        (emp) => emp.dateOfHire >= startOfMonth,
      ).length; 

      const stats: EmployeeStatsDto = {               
        totalEmployees,
        totalActive,
        totalOnLeave,
        totalHiredThisMonth,
      };

      return { employees: employees as EmployeeResponseDto[], stats }; 
    } catch (error) {
      throw new HttpException( 
        `${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
