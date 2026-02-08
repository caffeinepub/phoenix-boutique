/**
 * Offline audit calculation utilities for computing financial aggregates from Order arrays.
 * Provides pure functions for revenue, collected, outstanding, and order counts with date filtering support.
 */

import type { Order } from './ordersRepository';

/**
 * Date filter modes
 */
export type DateFilterMode = 'today' | 'thisWeek' | 'thisMonth' | 'custom';

/**
 * Date basis for filtering (which timestamp field to use)
 */
export type DateBasis = 'bookingDate' | 'deliveredAt';

/**
 * Custom date range (inclusive, local timezone)
 */
export interface CustomDateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Filter configuration
 */
export interface AuditFilterConfig {
  mode: DateFilterMode;
  dateBasis: DateBasis;
  customRange?: CustomDateRange;
}

/**
 * Audit calculation results
 */
export interface AuditResults {
  totalRevenue: number;
  totalCollected: number;
  totalOutstanding: number;
  ordersCount: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
}

/**
 * Get local date string in YYYY-MM-DD format
 */
function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get start and end of day in local timezone
 */
function getLocalDayBoundaries(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Get start and end of current week (Monday to Sunday) in local timezone
 */
function getLocalWeekBoundaries(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate days to subtract to get to Monday (start of week)
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const start = new Date(now);
  start.setDate(now.getDate() - daysToMonday);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Sunday
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Get start and end of current month in local timezone
 */
function getLocalMonthBoundaries(): { start: Date; end: Date } {
  const now = new Date();
  
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Parse timestamp string (milliseconds) to Date, returns null if invalid
 */
function parseTimestamp(timestampStr: string | null | undefined): Date | null {
  if (!timestampStr) return null;
  
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp) || timestamp < 0) return null;
  
  return new Date(timestamp);
}

/**
 * Extract date from order based on configured date basis
 */
function extractOrderDate(order: Order, dateBasis: DateBasis): Date | null {
  if (dateBasis === 'bookingDate') {
    return parseTimestamp(order.bookingDate);
  } else {
    // deliveredAt can be null for pending orders
    return parseTimestamp(order.deliveredAt);
  }
}

/**
 * Check if date falls within range (inclusive)
 */
function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

/**
 * Filter orders by date configuration
 */
function filterOrdersByDate(orders: Order[], config: AuditFilterConfig): Order[] {
  let boundaries: { start: Date; end: Date } | null = null;
  
  switch (config.mode) {
    case 'today': {
      const today = new Date();
      boundaries = getLocalDayBoundaries(today);
      break;
    }
    case 'thisWeek': {
      boundaries = getLocalWeekBoundaries();
      break;
    }
    case 'thisMonth': {
      boundaries = getLocalMonthBoundaries();
      break;
    }
    case 'custom': {
      if (!config.customRange) {
        return orders; // No filtering if custom range not provided
      }
      const start = new Date(config.customRange.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(config.customRange.endDate);
      end.setHours(23, 59, 59, 999);
      boundaries = { start, end };
      break;
    }
  }
  
  if (!boundaries) return orders;
  
  return orders.filter((order) => {
    const orderDate = extractOrderDate(order, config.dateBasis);
    
    // Exclude orders with invalid/null dates
    if (!orderDate) return false;
    
    return isDateInRange(orderDate, boundaries.start, boundaries.end);
  });
}

/**
 * Calculate total collected amount for a single order
 * Uses advancePaid as the current collected amount (already reflects payment history)
 */
function calculateOrderCollected(order: Order): number {
  const advancePaid = Number(order.advancePaid) || 0;
  return Math.max(0, advancePaid);
}

/**
 * Compute audit aggregates from filtered orders
 */
function computeAggregates(orders: Order[]): AuditResults {
  let totalRevenue = 0;
  let totalCollected = 0;
  let totalOutstanding = 0;
  let paidCount = 0;
  let partialCount = 0;
  let unpaidCount = 0;
  
  for (const order of orders) {
    // Total Revenue: sum of priceTotal
    const priceTotal = Number(order.priceTotal) || 0;
    totalRevenue += Math.max(0, priceTotal);
    
    // Total Collected: sum of advancePaid (which reflects payment history)
    const collected = calculateOrderCollected(order);
    totalCollected += collected;
    
    // Total Outstanding: sum of balanceAmount
    const balanceAmount = Number(order.balanceAmount) || 0;
    totalOutstanding += Math.max(0, balanceAmount);
    
    // Paid/Partial/Unpaid breakdown
    if (order.paymentStatus === 'Paid') {
      paidCount++;
    } else if (order.paymentStatus === 'Partial') {
      partialCount++;
    } else {
      // 'Unpaid'
      unpaidCount++;
    }
  }
  
  return {
    totalRevenue,
    totalCollected,
    totalOutstanding,
    ordersCount: orders.length,
    paidCount,
    partialCount,
    unpaidCount,
  };
}

/**
 * Calculate audit metrics for orders with optional date filtering
 * 
 * @param orders - Array of Order objects to analyze
 * @param config - Optional filter configuration (if omitted, includes all orders)
 * @returns Audit results with financial aggregates and counts
 * 
 * @example
 * // All orders
 * const allResults = calculateAuditMetrics(orders);
 * 
 * @example
 * // Today's orders based on booking date
 * const todayResults = calculateAuditMetrics(orders, {
 *   mode: 'today',
 *   dateBasis: 'bookingDate'
 * });
 * 
 * @example
 * // This week's delivered orders
 * const weekResults = calculateAuditMetrics(orders, {
 *   mode: 'thisWeek',
 *   dateBasis: 'deliveredAt'
 * });
 * 
 * @example
 * // Custom date range
 * const customResults = calculateAuditMetrics(orders, {
 *   mode: 'custom',
 *   dateBasis: 'bookingDate',
 *   customRange: {
 *     startDate: new Date('2026-01-01'),
 *     endDate: new Date('2026-01-31')
 *   }
 * });
 */
export function calculateAuditMetrics(
  orders: Order[],
  config?: AuditFilterConfig
): AuditResults {
  // Handle empty or invalid input
  if (!Array.isArray(orders) || orders.length === 0) {
    return {
      totalRevenue: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      ordersCount: 0,
      paidCount: 0,
      partialCount: 0,
      unpaidCount: 0,
    };
  }
  
  // Apply date filtering if config provided
  const filteredOrders = config ? filterOrdersByDate(orders, config) : orders;
  
  // Compute aggregates
  return computeAggregates(filteredOrders);
}

/**
 * Helper: Calculate metrics for today based on booking date
 */
export function calculateTodayMetrics(orders: Order[]): AuditResults {
  return calculateAuditMetrics(orders, {
    mode: 'today',
    dateBasis: 'bookingDate',
  });
}

/**
 * Helper: Calculate metrics for this week based on booking date
 */
export function calculateThisWeekMetrics(orders: Order[]): AuditResults {
  return calculateAuditMetrics(orders, {
    mode: 'thisWeek',
    dateBasis: 'bookingDate',
  });
}

/**
 * Helper: Calculate metrics for this month based on booking date
 */
export function calculateThisMonthMetrics(orders: Order[]): AuditResults {
  return calculateAuditMetrics(orders, {
    mode: 'thisMonth',
    dateBasis: 'bookingDate',
  });
}

/**
 * Helper: Calculate metrics for today's deliveries
 */
export function calculateTodayDeliveriesMetrics(orders: Order[]): AuditResults {
  return calculateAuditMetrics(orders, {
    mode: 'today',
    dateBasis: 'deliveredAt',
  });
}

/**
 * Helper: Calculate metrics for this week's deliveries
 */
export function calculateThisWeekDeliveriesMetrics(orders: Order[]): AuditResults {
  return calculateAuditMetrics(orders, {
    mode: 'thisWeek',
    dateBasis: 'deliveredAt',
  });
}

/**
 * Helper: Calculate metrics for this month's deliveries
 */
export function calculateThisMonthDeliveriesMetrics(orders: Order[]): AuditResults {
  return calculateAuditMetrics(orders, {
    mode: 'thisMonth',
    dateBasis: 'deliveredAt',
  });
}
