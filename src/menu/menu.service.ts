import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleScope, RoleScope } from '../../prisma/generated/enums';

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  children?: MenuItem[];
  module?: string;
  menu?: string; // Menu category from Module model (e.g., "Income", "Accounting")
  actions?: string[];
}

export interface ModuleMenu {
  moduleKey: string;
  displayName: string;
  actions: string[];
}

export interface MenuGroup {
  groupName: string;
  modules: ModuleMenu[];
}

export interface ComputedMenu {
  adminMenus: MenuGroup[];
  entityMenus: MenuGroup[];
}

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  /**
   * Compute effective menu for a user based on:
   * - Role scope (ADMIN | USER)
   * - Permissions (explicit + role permissions)
   * - Subscription (modules available in their tier)
   *
   * Rules:
   * 1. ADMIN role users see GROUP-scope modules
   * 2. USER role users see ENTITY-scope modules  
   * 3. ADMIN role can also see ENTITY modules if assigned to entity
   * 4. User must have permission for module to see it
   * 5. Module must be in subscription tier
   */
  // async computeMenuForUser(
  //   userId: string,
  //   groupId: string,
  //   entityId?: string,
  // ): Promise<ComputedMenu> {
  //   // Fetch user with all relationships
  //   const user = await this.prisma.user.findUnique({
  //     where: { id: userId },
  //     include: {
  //       role: true,
  //       explicitPermissions: {
  //         include: {
  //           permission: {
  //             include: {
  //               action: {
  //                 include: {
  //                   module: true,
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });

  //   if (!user || user.groupId !== groupId) {
  //     throw new Error(`User ${userId} not found or unauthorized`);
  //   }

  //   if (!user.role) {
  //     throw new Error(`User ${userId} has no role assigned`);
  //   }

  //   // Get subscription modules
  //   const subscription = await this.prisma.subscription.findUnique({
  //     where: { groupId },
  //     include: {
  //       tier: {
  //         include: {
  //           subscriptionModules: {
  //             include: {
  //               module: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });

  //   const subscriptionModuleKeys = new Set(
  //     subscription?.tier.subscriptionModules.map((sm) => sm.module.moduleKey) || [],
  //   );

  //   // Get role permissions
  //   const rolePermissions = await this.prisma.rolePermission.findMany({
  //     where: { roleId: user.role.id },
  //     include: {
  //       permission: {
  //         include: {
  //           action: {
  //             include: {
  //               module: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });

  //   // Determine accessible modules
  //   const accessibleModulesMap = new Map<string, { scope: ModuleScope; displayName: string }>();

  //   // Add role-based permissions
  //   rolePermissions.forEach((rp) => {
  //     const module = rp.permission.action.module;
  //     const scopeMatches =
  //       (user.role!.scope === RoleScope.ADMIN && module.scope === ModuleScope.GROUP) ||
  //       (user.role!.scope === RoleScope.USER && module.scope === ModuleScope.ENTITY) ||
  //       (user.role!.scope === RoleScope.ADMIN && module.scope === ModuleScope.ENTITY);

  //     // if (scopeMatches && subscriptionModuleKeys.has(module.moduleKey)) {
  //           if (scopeMatches && subscriptionModuleKeys.has(module.moduleKey)) {
  
  //     accessibleModulesMap.set(module.moduleKey, {
  //         scope: module.scope,
  //         displayName: module.displayName,
  //       });
  //     }
  //   });

  //   // Add explicit permissions
  //   user.explicitPermissions.forEach((ep) => {
  //     accessibleModulesMap.set(ep.permission.action.module.moduleKey, {
  //       scope: ep.permission.action.module.scope,
  //       displayName: ep.permission.action.module.displayName,
  //     });
  //   });

  //   // Separate by scope
  //   const adminModuleKeys = Array.from(accessibleModulesMap.entries())
  //     .filter(([, m]) => m.scope === ModuleScope.GROUP)
  //     .map(([k]) => k);

  //   const entityModuleKeys = Array.from(accessibleModulesMap.entries())
  //     .filter(([, m]) => m.scope === ModuleScope.ENTITY)
  //     .map(([k]) => k);

  //   // Fetch full module details
  //   const [adminModules, entityModules] = await Promise.all([
  //     adminModuleKeys.length > 0
  //       ? this.prisma.module.findMany({
  //           where: { moduleKey: { in: adminModuleKeys } },
  //         })
  //       : Promise.resolve([]),
  //     entityModuleKeys.length > 0
  //       ? this.prisma.module.findMany({
  //           where: { moduleKey: { in: entityModuleKeys } },
  //         })
  //       : Promise.resolve([]),
  //   ]);

  //   return {
  //     adminMenus:
  //       adminModules.length > 0
  //         ? [
  //             {
  //               groupName: 'Admin',
  //               modules: adminModules.map((m) => ({
  //                 moduleKey: m.moduleKey,
  //                 displayName: m.displayName,
  //                 actions: [],
  //               })),
  //             },
  //           ]
  //         : [],
  //     entityMenus:
  //       entityModules.length > 0
  //         ? [
  //             {
  //               groupName: 'Entity',
  //               modules: entityModules.map((m) => ({
  //                 moduleKey: m.moduleKey,
  //                 displayName: m.displayName,
  //                 actions: [],
  //               })),
  //             },
  //           ]
  //         : [],
  //   };
  // }

  /**
   * Get user's permissions by module
   * Returns map of moduleKey -> actionNames[]
   */
  async getUserPermissions(user: any): Promise<Record<string, string[]>> {
    // const user = await this.prisma.user.findUnique({
    //   where: { id: userId },
    //   include: {
    //     role: true,
    //     explicitPermissions: {
    //       where: entityId ? { entityId } : undefined,
    //       include: {
    //         permission: {
    //           include: {
    //             action: {
    //               include: {
    //                 module: true,
    //               },
    //             },
    //           },
    //         },
    //       },
    //     },
    //   },
    // });

    if (!user) {
      throw new Error(`User ${user.id} not found`);
    }

    const permissions: Record<string, string[]> = {};

    // Add explicit permissions (if they exist)
    (user.explicitPermissions || []).forEach((ep) => {
      const moduleKey = ep.permission.action.module.moduleKey;
      const actionName = ep.permission.action.actionName;

      if (!permissions[moduleKey]) {
        permissions[moduleKey] = [];
      }
      if (ep.allowed && !permissions[moduleKey].includes(actionName)) {
        permissions[moduleKey].push(actionName);
      }
    });

    // Add role permissions
    if (user.role) {
      const rolePerms = await this.prisma.rolePermission.findMany({
        where: { roleId: user.role.id },
        include: {
          permission: {
            include: {
              action: {
                include: {
                  module: true,
                },
              },
            },
          },
        },
      });

      rolePerms.forEach((rp) => {
        const moduleKey = rp.permission.action.module.moduleKey;
        const actionName = rp.permission.action.actionName;

        if (!permissions[moduleKey]) {
          permissions[moduleKey] = [];
        }
        if (!permissions[moduleKey].includes(actionName)) {
          permissions[moduleKey].push(actionName);
        }
      });
    }

    return permissions;
  }

  /**
   * Get complete organized menu for a user
   * Returns hierarchical menu structure with subgroups
   */
  async getMenuForUser(user: any, entityId?: string, groupId?: string): Promise<MenuItem[]> {
    if (!user) {
      return [];
    }

    const isSuperadmin = user.systemRole === 'superadmin';
    const isAdmin = user.systemRole === 'admin';

    // SUPERADMIN with no group/entity context: show superadmin menu
    if (isSuperadmin && !entityId && !groupId) {
      return await this.buildSuperAdminMenu(await this.prisma.module.findMany());
    }

    // All other contexts require groupId
    if (!groupId) {
      return [];
    }


    // start for subscription enabling


    // Get available modules from subscription
    // const subscription = await this.prisma.subscription.findFirst({
    //   where: { groupId, isActive: true },
    //   include: {
    //     tier: {
    //       include: {
    //         subscriptionModules: {
    //           include: {
    //             module: true,
    //           },
    //         },
    //       },
    //     },
    //   },
    // });

    // const availableModules = subscription?.tier?.subscriptionModules?.map((sm) => sm.module) || [];

// end for subscription checkiing

// start fir overrride
    const availableModules = await this.prisma.module.findMany();
// end for override

    // console.log(availableModules.length, "available modules (subscription bypassed)");

    // SUPERADMIN: Show all subscription modules (no permission filtering)
    if (isSuperadmin) {
      if (entityId) {
        // SUPERADMIN with entity context: show ENTITY scope modules
        return await this.buildEntityMenu(availableModules, {});
      } else {
        // SUPERADMIN with group context: show GROUP scope modules
        return await this.buildAdminMenu(availableModules, {});
      }
    }

    // For non-superadmin: need permissions check
    if (!user.role) {
      return [];
    }

    // Get user permissions (entity-scoped or admin-scoped based on context)
    const userPermissions = await this.getUserPermissions(user);

    // Build menu based on role scope and context
    if (isAdmin) {

       if (entityId) {
        // ADMIN with entity context: show ENTITY scope modules
      return await this.buildEntityMenu(availableModules, userPermissions);
      } else {
        // SUPERADMIN with group context: show GROUP scope modules
      return await this.buildAdminMenu(availableModules, userPermissions);
      }
    }     
          return await this.buildEntityMenu(availableModules, userPermissions);
 
  }

  /**
   * Build admin menu (GROUP-scope modules)
   * For SUPERADMIN: Shows all GROUP-scope modules (no permission check)
   * For ADMIN: Shows GROUP-scope modules where user has ANY permission
   */
  private async buildAdminMenu(
    availableModules: any[],
    permissions: Record<string, string[]>,
  ): Promise<MenuItem[]> {
    const groupModules = availableModules.filter((m) => m.scope === 'GROUP');

    const menu: MenuItem[] = [];

    for (const module of groupModules) {
      // Show menu item if: permissions is empty (SUPERADMIN bypass) OR user has permission
      const hasModuleAccess =
        Object.keys(permissions).length === 0 || // SUPERADMIN: no permission filtering
        (permissions[module.moduleKey] &&
          permissions[module.moduleKey].length > 0); // ADMIN: check permission

      if (!hasModuleAccess) {
        continue;
      }

      // Build menu item (no menuCategory yet - will be determined during organization)
      const menuItem = await this.createMenuItemFromModule(module, permissions);
      menu.push(menuItem);
    }

    return this.organizeAdminMenu(menu);
  }

  /**
   * Build entity menu (ENTITY-scope modules)
   * For SUPERADMIN: Shows all ENTITY-scope modules (no permission check)
   * For others: Shows ENTITY-scope modules where user has ANY permission
   */
  private async buildEntityMenu(
    availableModules: any[],
    permissions: Record<string, string[]>,
  ): Promise<MenuItem[]> {
    const entityModules = availableModules.filter((m) => m.scope === 'ENTITY');

    const menu: MenuItem[] = [];

    for (const module of entityModules) {
      // Show menu item if: permissions is empty (SUPERADMIN bypass) OR user has permission
      const hasModuleAccess =
        Object.keys(permissions).length === 0 || // SUPERADMIN: no permission filtering
        (permissions[module.moduleKey] &&
          permissions[module.moduleKey].length > 0); // Regular user: check permission

      if (!hasModuleAccess) {
        continue;
      }

      // Build menu item (no menuCategory yet - will be determined during organization)
      const menuItem = await this.createMenuItemFromModule(module, permissions);
      menu.push(menuItem);
    }

    return this.organizeEntityMenu(menu);
  }


  /**
   * Build superadmin menu (superadmin-scope modules)
   * for superadmin dashboard
   */
  private async buildSuperAdminMenu(
    availableModules: any[],
  ): Promise<MenuItem[]> {
    console.log(availableModules.length, "available modules for superadmin menu");
    const superAdminModules = availableModules.filter((m) => m.scope === 'SUPERADMIN');

    const menu: MenuItem[] = [];

    for (const module of superAdminModules) {
     

      // Build menu item (no menuCategory yet - will be determined during organization)
      const menuItem = await this.createMenuItemFromModule(module, {});
      menu.push(menuItem);
    }

    return this.organizeEntityMenu(menu);
  }

  /**
   * Convert camelCase or snake_case to kebab-case
   * Examples:
   * - auditTrail → audit-trail
   * - master_chart_of_accounts → master-chart-of-accounts
   * - Master Data → master-data (spaces to hyphens)
   * - Sales & Purchases → sales-and-purchases (& to and)
   */
  private convertToKebabCase(str: string): string {
    return str
      // Replace & with "and"
      .replace(/&/g, 'and')
      // Handle camelCase: insert hyphen before uppercase letters
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      // Handle snake_case: replace underscores with hyphens
      .replace(/_/g, '-')
      // Handle spaces: replace with hyphens
      .replace(/\s+/g, '-')
      // Convert to lowercase
      .toLowerCase()
      // Remove any duplicate hyphens
      .replace(/-+/g, '-');
  }

  /**
   * Generate route based on module structure
   * Single module: /audit-trail
   * Grouped modules: /accounting/master-chart-of-accounts
   */
  private generateMenuRoute(module: any, menuCategory?: string): string {
    const moduleKeySlug = this.convertToKebabCase(module.moduleKey);

    // If no menu category or only one child, use just moduleKey
    if (!menuCategory) {
      return `/${moduleKeySlug}`;
    }

    // Multiple children: use menu/moduleKey format
    const menuSlug = this.convertToKebabCase(menuCategory);
    return `/${menuSlug}/${moduleKeySlug}`;
  }

  /**
   * Create menu item from module + available actions
   * For SUPERADMIN (empty permissions object): show all module actions
   * For others: show only their permitted actions
   */
  private async createMenuItemFromModule(
    module: any,
    permissions: Record<string, string[]>,
    menuCategory?: string,
  ): Promise<MenuItem> {
    let actions = permissions[module.moduleKey] || [];

    // If superadmin (empty permissions), get ALL available actions for this module
    if (Object.keys(permissions).length === 0) {
      const allModuleActions = await this.prisma.action.findMany({
        where: { moduleId: module.id },
      });
      actions = allModuleActions.map((a) => a.actionName);
    }

    return {
      id: module.id,
      label: module.displayName,
      icon: module.icon,
      route: this.generateMenuRoute(module, menuCategory),
      module: module.moduleKey,
      menu: module.menu,
      actions,
    };
  }

  /**
   * Organize ENTITY menus into groups/submenus based on Module.menu field
   * Updates routes based on whether items are single or grouped
   */
  private organizeEntityMenu(items: MenuItem[]): MenuItem[] {
    // Group items by their menu category
    const menuGroups = new Map<string, MenuItem[]>();
    
    for (const item of items) {
      const menuCategory = item.menu || 'Other';
      if (!menuGroups.has(menuCategory)) {
        menuGroups.set(menuCategory, []);
      }
      menuGroups.get(menuCategory)!.push(item);
    }

    // Convert map to organized menu structure
    const organized: MenuItem[] = [];
    for (const [groupName, groupItems] of menuGroups) {
      // If only one item in this group, use single route; otherwise use grouped route
      if (groupItems.length === 1) {
        // Single item: use just the moduleKey route
        groupItems[0].route = this.generateMenuRoute({
          moduleKey: groupItems[0].module,
        });
        organized.push(groupItems[0]);
      } else {
        // Multiple items: group them with category route
        const updatedItems = groupItems.map((item) => ({
          ...item,
          route: this.generateMenuRoute(
            { moduleKey: item.module },
            groupName,
          ),
        }));
        organized.push({
          id: groupName,
          label: groupName,
          children: updatedItems,
        });
      }
    }

    return organized;
  }

  /**
   * Organize GROUP (admin) menus into groups/submenus based on Module.menu field
   * Updates routes based on whether items are single or grouped
   */
  private organizeAdminMenu(items: MenuItem[]): MenuItem[] {
    // Group items by their menu category from Module.menu
    const menuGroups = new Map<string, MenuItem[]>();
    
    for (const item of items) {
      const menuCategory = item.menu || 'Other';
      if (!menuGroups.has(menuCategory)) {
        menuGroups.set(menuCategory, []);
      }
      menuGroups.get(menuCategory)!.push(item);
    }

    // Convert map to organized menu structure
    const organized: MenuItem[] = [];
    for (const [groupName, groupItems] of menuGroups) {
      // If only one item in this group, use single route; otherwise use grouped route
      if (groupItems.length === 1) {
        // Single item: use just the moduleKey route
        groupItems[0].route = this.generateMenuRoute({
          moduleKey: groupItems[0].module,
        });
        organized.push(groupItems[0]);
      } else {
        // Multiple items: group them with category route
        const updatedItems = groupItems.map((item) => ({
          ...item,
          route: this.generateMenuRoute(
            { moduleKey: item.module },
            groupName,
          ),
        }));
        organized.push({
          id: groupName,
          label: groupName,
          children: updatedItems,
        });
      }
    }

    return organized;
  }

  /**
   * Get available actions for a module that user can perform
   */
  async getAvailableActionsForModule(
    user: any,
    moduleKey: string,
  ): Promise<string[]> {
    const permissions = await this.getUserPermissions(user);
    return permissions[moduleKey] || [];
  }
}
