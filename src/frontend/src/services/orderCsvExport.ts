/**
 * Offline CSV generation utilities for order exports.
 * Creates CSV files from order data and triggers browser downloads.
 */

import type { Order } from './ordersRepository';

/**
 * Escape CSV field value
 */
function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Format timestamp for CSV (convert milliseconds to readable date)
 */
function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return '';
  const date = new Date(parseInt(timestamp, 10));
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Compute paid amount from order (using advancePaid field).
 * Ensures the result is always a finite, non-negative number.
 */
function computePaidAmount(order: Order): number {
  const paid = Number(order.advancePaid) || 0;
  if (!isFinite(paid) || paid < 0) return 0;
  return paid;
}

/**
 * Convert orders array to CSV string
 */
function ordersToCsv(orders: Order[]): string {
  const headers = [
    'Order ID',
    'Customer Name',
    'Booking Date',
    'Delivery Date',
    'Status',
    'Delivered At',
    'Created At',
    'Price Total',
    'Advance Paid',
    'Balance Amount',
    'Payment Status',
    'Payment Method',
    'Notes',
    'Measurements',
    'Product Details',
  ];

  const rows = orders.map((order) => [
    escapeCsvField(order.orderId),
    escapeCsvField(order.customerName),
    escapeCsvField(order.bookingDate),
    escapeCsvField(order.deliveryDate),
    escapeCsvField(order.status),
    escapeCsvField(formatTimestamp(order.deliveredAt)),
    escapeCsvField(formatTimestamp(order.createdAt)),
    escapeCsvField(order.priceTotal),
    escapeCsvField(order.advancePaid),
    escapeCsvField(order.balanceAmount),
    escapeCsvField(order.paymentStatus),
    escapeCsvField(order.paymentMethod),
    escapeCsvField(order.notes || ''),
    escapeCsvField(order.measurements),
    escapeCsvField(order.productDetails),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Convert orders array to audit CSV string with specific columns.
 * Header: "Order ID,Customer Name,Total Price,Paid Amount,Balance Amount,Payment Status,Payment Method,Delivery Date"
 */
function ordersToAuditCsv(orders: Order[]): string {
  const headers = [
    'Order ID',
    'Customer Name',
    'Total Price',
    'Paid Amount',
    'Balance Amount',
    'Payment Status',
    'Payment Method',
    'Delivery Date',
  ];

  const rows = orders.map((order) => {
    const paidAmount = computePaidAmount(order);
    const totalPrice = Number(order.priceTotal) || 0;
    const balanceAmount = Number(order.balanceAmount) || 0;

    return [
      escapeCsvField(order.orderId),
      escapeCsvField(order.customerName),
      escapeCsvField(totalPrice),
      escapeCsvField(paidAmount),
      escapeCsvField(balanceAmount),
      escapeCsvField(order.paymentStatus),
      escapeCsvField(order.paymentMethod),
      escapeCsvField(order.deliveryDate),
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Trigger browser download of CSV file
 */
function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export orders as CSV file
 */
export function exportOrdersAsCsv(orders: Order[], filename: string): void {
  const csvContent = ordersToCsv(orders);
  downloadCsv(csvContent, filename);
}

/**
 * Export orders as audit CSV file (with specific audit columns)
 */
export function exportAuditCsv(orders: Order[], filename: string): void {
  const csvContent = ordersToAuditCsv(orders);
  downloadCsv(csvContent, filename);
}

/**
 * Generate filename for CSV export
 */
export function generateCsvFilename(period: 'today' | 'week' | 'audit-week' | 'audit-month'): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  return `phoenix-orders-${period}-${dateStr}.csv`;
}
