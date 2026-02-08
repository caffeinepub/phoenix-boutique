/**
 * React hook that uses React Query to fetch local orders and subscribes
 * to local-db change notifications for automatic refresh.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { readAllOrders, readRecentOrders, readOrderById, type Order } from '../services/ordersRepository';

/**
 * Hook to fetch all orders with live updates
 */
export function useAllOrders() {
  const queryClient = useQueryClient();

  const query = useQuery<Order[]>({
    queryKey: ['orders', 'all'],
    queryFn: async () => {
      return await readAllOrders();
    },
    staleTime: 0,
  });

  useEffect(() => {
    const handleDbChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.store === 'orders') {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      }
    };

    window.addEventListener('db-change', handleDbChange);
    return () => window.removeEventListener('db-change', handleDbChange);
  }, [queryClient]);

  return query;
}

/**
 * Hook to fetch recent orders with live updates
 */
export function useRecentOrders(limit: number = 5) {
  const queryClient = useQueryClient();

  const query = useQuery<Order[]>({
    queryKey: ['orders', 'recent', limit],
    queryFn: async () => {
      return await readRecentOrders(limit);
    },
    staleTime: 0,
  });

  useEffect(() => {
    const handleDbChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.store === 'orders') {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      }
    };

    window.addEventListener('db-change', handleDbChange);
    return () => window.removeEventListener('db-change', handleDbChange);
  }, [queryClient]);

  return query;
}

/**
 * Hook to fetch a single order by ID with live updates
 */
export function useSingleOrder(id: number | null) {
  const queryClient = useQueryClient();

  const query = useQuery<Order | null>({
    queryKey: ['orders', 'single', id],
    queryFn: async () => {
      if (id === null) return null;
      return await readOrderById(id);
    },
    enabled: id !== null,
    staleTime: 0,
  });

  useEffect(() => {
    const handleDbChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.store === 'orders') {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      }
    };

    window.addEventListener('db-change', handleDbChange);
    return () => window.removeEventListener('db-change', handleDbChange);
  }, [queryClient]);

  return query;
}
