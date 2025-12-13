import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Permission } from 'prisma/generated/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        groupRole: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(pass, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const permissions: string[] | null =
      user.groupRole &&
      user.groupRole.permissions.map(
        (permission: Permission) => permission.name,
      );

    const uniquePermissions = [...new Set(permissions)];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      permissions: uniquePermissions,
    };
  }
}
