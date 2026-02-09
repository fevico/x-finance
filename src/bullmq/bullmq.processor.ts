import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { systemRole } from 'prisma/generated/enums';

@Processor('default')
@Injectable()
export class BullmqProcessor extends WorkerHost {
  private readonly logger = new Logger(BullmqProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.debug(`[Job ${job.id}] Starting job: ${job.name}`);
    if (job.name === 'create-group-user') {
      return this.handleCreateGroupDefaults(job);
    } else if (job.name === 'create-entity-user') {
      return this.handleCreateEntityUser(job);
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

      // TODO: send email with group user password

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
    const { groupId, email, entityName, legalName } = job.data as {
      groupId: string;
      email: string;
      entityName?: string;
      legalName?: string;
    };

    this.logger.log(
      `[Job ${job.id}] Running create-entity-user for groupId: ${groupId}, email: ${email}, entityName: ${entityName}`,
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
      console.log("entity password", plainPassword)
      const hashed = await bcrypt.hash(plainPassword, 10);    

      this.logger.debug(`[Job ${job.id}] Generated password for entity user`);

      // 3. Create user with systemRole 'user' and the entityAdmin groupRoleId
      await this.prisma.user.create({
        data: {
          email,
          firstName: entityName ? entityName.split(' ')[0] : 'Entity',
          lastName: 'Admin',
          password: hashed,
          groupId,
          groupRoleId: entityAdminRole.id,
          systemRole: systemRole.user,
        },
      });

      this.logger.debug(
        `[Job ${job.id}] Created entity user with email: ${email}`,
      );

      // TODO: send email with password to user

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
}
