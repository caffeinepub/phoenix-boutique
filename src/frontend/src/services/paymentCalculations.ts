/**
 * Shared frontend-only helpers for pricing and payment calculations.
 * Provides derived field computation and validation logic used by New Order and Edit Order screens.
 */

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Other';
export type PaymentStatus = 'Unpaid' | 'Partial' | 'Paid';

export const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'UPI', 'Card', 'Other'];

/**
 * Calculate balance amount from total price and advance paid
 */
export function calculateBalance(priceTotal: number, advancePaid: number): number {
  return Math.max(0, priceTotal - advancePaid);
}

/**
 * Derive payment status based on total price and advance paid
 * Rules:
 * - 0 paid → Unpaid
 * - Partial paid → Partial
 * - Fully paid → Paid
 */
export function derivePaymentStatus(priceTotal: number, advancePaid: number): PaymentStatus {
  if (priceTotal === 0 || advancePaid === 0) {
    return 'Unpaid';
  }
  if (advancePaid >= priceTotal) {
    return 'Paid';
  }
  return 'Partial';
}

/**
 * Validation helper for pricing fields
 * Returns error message or null if valid
 */
export function validatePricing(priceTotal: number, advancePaid: number): {
  priceTotalError: string | null;
  advancePaidError: string | null;
} {
  let priceTotalError: string | null = null;
  let advancePaidError: string | null = null;

  if (priceTotal < 0) {
    priceTotalError = 'Total price must be 0 or greater';
  }

  if (advancePaid < 0) {
    advancePaidError = 'Advance paid must be 0 or greater';
  }

  if (advancePaid > priceTotal) {
    advancePaidError = 'Advance paid cannot exceed total price';
  }

  return { priceTotalError, advancePaidError };
}
