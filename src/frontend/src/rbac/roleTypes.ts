/**
 * RBAC types and permission helpers for Phoenix Boutique.
 * Defines roles (ADMIN | STAFF) and permission checks used across the app.
 */

export type Role = 'ADMIN' | 'STAFF';

export interface Permissions {
  canViewFinancials: boolean;
  canEditFinancials: boolean;
  canViewReports: boolean;
  canViewAudit: boolean;
  canExportData: boolean;
  canDeleteOrders: boolean;
  canManageStaff: boolean;
}

/**
 * Get permissions for a given role
 */
export function getPermissions(role: Role): Permissions {
  if (role === 'ADMIN') {
    return {
      canViewFinancials: true,
      canEditFinancials: true,
      canViewReports: true,
      canViewAudit: true,
      canExportData: true,
      canDeleteOrders: true,
      canManageStaff: true,
    };
  }

  // STAFF permissions (restricted)
  return {
    canViewFinancials: false,
    canEditFinancials: false,
    canViewReports: false,
    canViewAudit: false,
    canExportData: false,
    canDeleteOrders: false,
    canManageStaff: false,
  };
}
