/**
 * Hook to consume role and permissions from RoleProvider.
 */

import { useContext } from 'react';
import { RoleContext } from './RoleProvider';

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return context;
}
