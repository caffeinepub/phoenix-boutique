/**
 * Currency formatting utilities for INR (₹) display.
 * Provides safe formatting that handles invalid/undefined inputs gracefully.
 */

/**
 * Format a number as INR currency with ₹ symbol
 * Falls back to 0 for invalid inputs (NaN, Infinity, undefined, null)
 */
export function formatINR(value: number | undefined | null): string {
  // Coerce to safe finite number
  const safeValue = Number.isFinite(value) ? Number(value) : 0;
  const absoluteValue = Math.abs(safeValue);
  
  // Format with 2 decimal places and thousands separators
  const formatted = absoluteValue.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return `₹${formatted}`;
}

/**
 * Format a number as INR currency without decimal places
 */
export function formatINRWhole(value: number | undefined | null): string {
  const safeValue = Number.isFinite(value) ? Number(value) : 0;
  const absoluteValue = Math.abs(safeValue);
  
  const formatted = absoluteValue.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return `₹${formatted}`;
}
