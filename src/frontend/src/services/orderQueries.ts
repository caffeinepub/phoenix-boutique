/**
 * Pure helper functions for computing Dashboard metrics from orders.
 * Includes local-timezone safe date helpers and filtering utilities for exports.
 */

import type { Order } from './ordersRepository';

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
 * Parse DD-MM-YYYY format to Date object
 */
function parseDeliveryDate(dateStr: string): Date | null {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
  const year = parseInt(parts[2], 10);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  
  return new Date(year, month, day);
}

/**
 * Check if delivery date matches today (local timezone)
 */
function isToday(deliveryDateStr: string): boolean {
  const deliveryDate = parseDeliveryDate(deliveryDateStr);
  if (!deliveryDate) return false;
  
  const today = new Date();
  return getLocalDateString(deliveryDate) === getLocalDateString(today);
}

/**
 * Check if delivery date is within next 7 days (inclusive)
 */
function isWithinNext7Days(deliveryDateStr: string): boolean {
  const deliveryDate = parseDeliveryDate(deliveryDateStr);
  if (!deliveryDate) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);
  
  deliveryDate.setHours(0, 0, 0, 0);
  
  return deliveryDate >= today && deliveryDate <= sevenDaysFromNow;
}

/**
 * Check if delivery date falls within the current audit week.
 * Audit week: Monday 00:00:00 through Sunday 23:59:59.999 (local time).
 */
function isInAuditWeek(deliveryDateStr: string): boolean {
  const deliveryDate = parseDeliveryDate(deliveryDateStr);
  if (!deliveryDate) return false;
  
  const now = new Date();
  
  // Find the Monday of the current week (local time)
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday is 6 days from Monday
  
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysFromMonday);
  weekStart.setHours(0, 0, 0, 0);
  
  // Find the Sunday of the current week (local time)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  deliveryDate.setHours(0, 0, 0, 0);
  
  return deliveryDate >= weekStart && deliveryDate <= weekEnd;
}

/**
 * Check if delivery date falls within the current audit month.
 * Audit month: 1st 00:00:00 through last day 23:59:59.999 (local time).
 */
function isInAuditMonth(deliveryDateStr: string): boolean {
  const deliveryDate = parseDeliveryDate(deliveryDateStr);
  if (!deliveryDate) return false;
  
  const now = new Date();
  
  // First day of current month (local time)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);
  
  // Last day of current month (local time)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);
  
  deliveryDate.setHours(0, 0, 0, 0);
  
  return deliveryDate >= monthStart && deliveryDate <= monthEnd;
}

/**
 * Compute Dashboard metrics from orders array
 */
export function computeDashboardMetrics(orders: Order[]) {
  const deliverToday = orders.filter(
    (order) => order.status === 'Pending' && isToday(order.deliveryDate)
  ).length;

  const pendingOrders = orders.filter(
    (order) => order.status === 'Pending'
  ).length;

  const thisWeekDeliveries = orders.filter(
    (order) => isWithinNext7Days(order.deliveryDate)
  ).length;

  const totalOrders = orders.length;

  return {
    deliverToday,
    pendingOrders,
    thisWeekDeliveries,
    totalOrders,
  };
}

/**
 * Format delivery date for display (DD-MM-YYYY to readable format)
 */
export function formatDeliveryDate(dateStr: string): string {
  const date = parseDeliveryDate(dateStr);
  if (!date) return dateStr;
  
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Filter orders for today's deliveries
 */
export function filterOrdersForToday(orders: Order[]): Order[] {
  return orders.filter((order) => isToday(order.deliveryDate));
}

/**
 * Filter orders for this week's deliveries (next 7 days inclusive)
 */
export function filterOrdersForThisWeek(orders: Order[]): Order[] {
  return orders.filter((order) => isWithinNext7Days(order.deliveryDate));
}

/**
 * Filter orders for the current audit week (Monday-Sunday, local time).
 * Excludes orders with invalid/unparseable deliveryDate.
 */
export function filterOrdersForAuditWeek(orders: Order[]): Order[] {
  return orders.filter((order) => isInAuditWeek(order.deliveryDate));
}

/**
 * Filter orders for the current audit month (1st through last day, local time).
 * Excludes orders with invalid/unparseable deliveryDate.
 */
export function filterOrdersForAuditMonth(orders: Order[]): Order[] {
  return orders.filter((order) => isInAuditMonth(order.deliveryDate));
}
