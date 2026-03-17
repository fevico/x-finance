import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get active subscription for a group
   * Returns subscription with tier and tier's modules included
   */
  async getActiveSubscription(groupId: string) {
    return this.prisma.subscription.findFirst({
      where: {
        groupId,
        isActive: true,
      },
      include: {
        tier: {
          include: {
            subscriptionModules: {
              include: {
                module: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get subscription tier details with all modules
   */
  async getSubscriptionTier(tierId: string) {
    return this.prisma.subscriptionTier.findUnique({
      where: { id: tierId },
      include: {
        subscriptionModules: {
          include: {
            module: true,
          },
        },
      },
    });
  }

  /**
   * Check if a group has access to a specific module
   * Returns true if module is in active subscription tier
   */
  async hasModuleAccess(groupId: string, moduleKey: string): Promise<boolean> {
    const subscription = await this.getActiveSubscription(groupId);

    if (!subscription) {
      return false;
    }

    // Check if module is in subscription tier
    const hasModule = subscription.tier.subscriptionModules.some(
      (sm) => sm.module.moduleKey === moduleKey,
    );

    return hasModule;
  }

  /**
   * Get all available modules for a group based on active subscription
   */
  async getAvailableModules(groupId: string) {
    const subscription = await this.getActiveSubscription(groupId);

    if (!subscription) {
      return [];
    }

    return subscription.tier.subscriptionModules.map((sm) => sm.module);
  }

  /**
   * Get all available ENTITY-scope modules for a group
   */
  async getAvailableEntityModules(groupId: string) {
    const modules = await this.getAvailableModules(groupId);
    return modules.filter((m) => m.scope === 'ENTITY');
  }

  /**
   * Get all available GROUP-scope (admin) modules for a group
   */
  async getAvailableGroupModules(groupId: string) {
    const modules = await this.getAvailableModules(groupId);
    return modules.filter((m) => m.scope === 'GROUP');
  }

  /**
   * Create or update group subscription to a tier
   */
  async subscribeToTier(groupId: string, tierId: string) {
    // Verify tier exists
    const tier = await this.prisma.subscriptionTier.findUnique({
      where: { id: tierId },
    });

    if (!tier) {
      throw new Error(`Subscription tier ${tierId} not found`);
    }

    // Deactivate existing subscription if any
    await this.prisma.subscription.updateMany({
      where: { groupId },
      data: { isActive: false },
    });

    // Create new subscription
    return this.prisma.subscription.create({
      data: {
        groupId,
        subscriptionTierId: tierId,
        isActive: true,
      },
      include: {
        tier: {
          include: {
            subscriptionModules: {
              include: {
                module: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Upgrade subscription to a different tier
   */
  async upgradeTier(groupId: string, newTierId: string) {
    return this.subscribeToTier(groupId, newTierId);
  }

  /**
   * Cancel active subscription for a group
   */
  async cancelSubscription(groupId: string) {
    return this.prisma.subscription.updateMany({
      where: {
        groupId,
        isActive: true,
      },
      data: {
        isActive: false,
        endDate: new Date(),
      },
    });
  }

  /**
   * Renew subscription (extend endDate)
   */
  async renewSubscription(groupId: string, newEndDate: Date) {
    return this.prisma.subscription.updateMany({
      where: {
        groupId,
        isActive: true,
      },
      data: {
        endDate: newEndDate,
      },
    });
  }

  /**
   * Check if module should be visible in menu
   * Rule: If group has subscription and module is in tier, menu shows
   */
  async isModuleVisibleInMenu(
    groupId: string,
    moduleKey: string,
  ): Promise<boolean> {
    return this.hasModuleAccess(groupId, moduleKey);
  }

  /**
   * Get all subscription tiers
   */
  async getAllTiers() {
    return this.prisma.subscriptionTier.findMany({
      include: {
        subscriptionModules: {
          include: {
            module: true,
          },
        },
      },
    });
  }
}
