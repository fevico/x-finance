import { JWTPayload } from 'jose';

import { User as PrismaUser } from 'prisma/generated/client';

declare global {
  namespace Express {
    export interface Request {
      user?: Omit<PrismaUser, 'password'> & { permissions: string[] };
      groupImpersonation?: {
        groupId: unknown;
        groupName: unknown;
      };
      entityImpersonation?: {
        entityId: unknown;
        entityName: unknown;
      };
    }
  }
}
