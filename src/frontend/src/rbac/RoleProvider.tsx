/**
 * Role context provider that manages user role state offline-first.
 * Defaults to STAFF (fail-closed) and supports optional localStorage persistence.
 */

import { createContext, useState, useEffect, type ReactNode } from 'react';
import { type Role, getPermissions, type Permissions } from './roleTypes';

interface RoleContextValue {
  role: Role;
  permissions: Permissions;
  setRoleOverride: (role: Role) => void;
  clearRoleOverride: () => void;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

const ROLE_STORAGE_KEY = 'phoenix-boutique-role';

export function RoleProvider({ children }: { children: ReactNode }) {
  // Default to STAFF (fail-closed)
  const [role, setRole] = useState<Role>('STAFF');

  // Load role from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ROLE_STORAGE_KEY);
      if (stored === 'ADMIN' || stored === 'STAFF') {
        setRole(stored);
      }
    } catch (error) {
      console.error('Failed to load role from storage:', error);
    }
  }, []);

  const setRoleOverride = (newRole: Role) => {
    setRole(newRole);
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, newRole);
    } catch (error) {
      console.error('Failed to save role to storage:', error);
    }
  };

  const clearRoleOverride = () => {
    setRole('STAFF');
    try {
      localStorage.removeItem(ROLE_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear role from storage:', error);
    }
  };

  const permissions = getPermissions(role);

  return (
    <RoleContext.Provider value={{ role, permissions, setRoleOverride, clearRoleOverride }}>
      {children}
    </RoleContext.Provider>
  );
}

export { RoleContext };
