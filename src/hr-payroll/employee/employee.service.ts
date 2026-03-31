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
      // Step 1: File upload (if any)
      if (profileImage) {
        try {
          const uploadResult = await this.fileuploadService.uploadFile(
            profileImage,
            'employee-profiles',
          );
          profileImageData = {
            publicId: uploadResult.publicId,
            secureUrl: uploadResult.secureUrl,
          };
        } catch (uploadErr) {
          console.error('File upload failed, skipping image:', uploadErr);
          // Continue without profileImageData
        }
      }

      // Step 2: Generate employeeId
      const employeeId = `EMP${Date.now()}${Math.floor(Math.random() * 1000)}`;

      // Step 3: Create employee in DB
      let employee;
      try {
        // const { ...rest } = employeeData as any;
        employee = await this.prisma.employee.create({
          data: {
            ...employeeData,
            anualLeave: Number(employeeData.anualLeave) || 0,
            salary: Number(employeeData.salary) || 0,
            allowances: Number(employeeData.allowances) || 0,
            employeeId,
            addressInfo: employeeData.addressInfo as any,
            emergencyContact: employeeData.emergencyContact as any,
            profileImage: profileImageData as any,
            entityId,
          },
        });
      } catch (dbErr) {
        console.error('DB create failed:', dbErr);
        throw new HttpException(
          `DB create failed: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return employee as EmployeeResponseDto;
    } catch (error) {
      console.error('EmployeeService.create error:', error);
      throw new HttpException(
        `${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string, entityId: string): Promise<EmployeeResponseDto> {
    try {
      const employee = await this.prisma.employee.findFirst({ where: { id, entityId } });
      if (!employee) throw new HttpException('Employee not found', HttpStatus.NOT_FOUND);
      return employee as any;
    } catch (error) {
      throw new HttpException(
        `${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    id: string,
    entityId: string,
    updateData: Partial<CreateEmployeeDto>,
    profileImage?: Express.Multer.File,
  ): Promise<EmployeeResponseDto> {
    try {
      console.log('Updating employee with data:', { id});
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
      const data: any = {
        ...updateData,
          anualLeave: updateData.anualLeave ? Number(updateData.anualLeave) : undefined,
        salary: updateData.salary ? Number(updateData.salary) : undefined,
        allowances: updateData.allowances ? Number(updateData.allowances) : undefined,
        addressInfo: updateData.addressInfo as any,
        emergencyContact: updateData.emergencyContact as any,
      };
      if (profileImageData) data.profileImage = profileImageData;
      // Use id only for unique lookup (entityId can be checked in logic if needed)
      const employee = await this.prisma.employee.update({
        where: { id },
        data,
      });
      return employee as any;
    } catch (error) {
      throw new HttpException(
        `${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string, entityId: string): Promise<{ deleted: boolean }> {
    try {
      await this.prisma.employee.delete({ where: { id } });
      return { deleted: true };
    } catch (error) {
      throw new HttpException(
        `${error instanceof Error ? error.message : String(error)}`,
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

      // Parse addressInfo and emergencyContact for each employee
      const employeesData = employees.map((emp) => ({
        ...emp,
        addressInfo: typeof emp.addressInfo === 'string' ? JSON.parse(emp.addressInfo || '{}') : emp.addressInfo,
        emergencyContact: typeof emp.emergencyContact === 'string' ? JSON.parse(emp.emergencyContact || '{}') : emp.emergencyContact,
      }));

      // Calculate stats
      const totalEmployees = employees.length;
      const totalActive = employees.filter(
        (emp) => emp.status === 'Active',
      ).length; // Assuming 'Active' status
      const totalOnLeave = employees.filter(
        (emp) => emp.status === 'On_Leave',
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

      return { employees: employeesData as any[], stats };
    } catch (error) {
      throw new HttpException(
        `${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
