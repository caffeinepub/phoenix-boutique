/**
 * Typed repository for order operations using IndexedDB with extended Order interface including sync tracking fields (cloudId, syncStatus, lastSyncedAt) and optional Firebase sync metadata, automatic normalization of pricing/payment fields, and payment history tracking.
 */

import { getDb } from './localDb';

export interface PaymentHistoryEntry {
  timestamp: string;
  changeType: 'add-payment' | 'set-advance';
  amountChanged?: number;
  resultingAdvancePaid: number;
  paymentMethod?: string;
  auditNote?: string;
}

export interface Order {
  id?: number;
  orderId: string;
  customerName: string;
  bookingDate: string;
  deliveryDate: string;
  measurements: string;
  productDetails: string;
  images: string[];
  status: 'Pending' | 'Delivered';
  deliveredAt: string | null;
  createdAt: string;
  // Pricing and payment fields
  priceTotal: number;
  advancePaid: number;
  balanceAmount: number;
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Other';
  notes?: string;
  paymentHistory: PaymentHistoryEntry[];
  // Sync tracking fields
  cloudId: string | null;
  syncStatus: 'pending' | 'synced';
  lastSyncedAt: string | null;
  // Optional Firebase sync metadata fields (legacy)
  remoteId?: string | null;
  syncState?: 'pending' | 'synced' | 'conflict';
  imageStorageUrls?: string[];
}

const STORE_NAME = 'orders';

/**
 * Normalize order pricing and payment fields to ensure consistency
 */
function normalizeOrder(order: any): Order {
  // Ensure numeric fields are valid numbers (not NaN, Infinity, or negative)
  const priceTotal = Math.max(0, Number(order.priceTotal) || 0);
  const advancePaid = Math.max(0, Number(order.advancePaid) || 0);
  
  // Calculate balance amount
  const balanceAmount = Math.max(0, priceTotal - advancePaid);
  
  // Determine payment status based on amounts
  let paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
  if (priceTotal === 0 || advancePaid === 0) {
    paymentStatus = 'Unpaid';
  } else if (advancePaid >= priceTotal) {
    paymentStatus = 'Paid';
  } else {
    paymentStatus = 'Partial';
  }
  
  // Validate payment method
  const validPaymentMethods = ['Cash', 'UPI', 'Card', 'Other'];
  const paymentMethod = validPaymentMethods.includes(order.paymentMethod) 
    ? order.paymentMethod 
    : 'Cash';
  
  // Ensure paymentHistory is always an array
  const paymentHistory = Array.isArray(order.paymentHistory) ? order.paymentHistory : [];
  
  // Ensure sync tracking fields have defaults
  const cloudId = order.cloudId !== undefined ? order.cloudId : null;
  const syncStatus = order.syncStatus || 'pending';
  const lastSyncedAt = order.lastSyncedAt !== undefined ? order.lastSyncedAt : null;
  
  // Ensure legacy sync metadata fields have defaults
  const remoteId = order.remoteId !== undefined ? order.remoteId : null;
  const syncState = order.syncState || 'pending';
  const imageStorageUrls = Array.isArray(order.imageStorageUrls) ? order.imageStorageUrls : [];
  
  return {
    ...order,
    priceTotal,
    advancePaid,
    balanceAmount,
    paymentStatus,
    paymentMethod,
    notes: order.notes || '',
    paymentHistory,
    cloudId,
    syncStatus,
    lastSyncedAt,
    remoteId,
    syncState,
    imageStorageUrls,
  };
}

/**
 * Read all orders from IndexedDB
 */
export async function readAllOrders(): Promise<Order[]> {
  const db = getDb();
  if (!db) {
    throw new Error('Database not initialized');
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const orders = request.result as Order[];
      // Normalize all orders before returning
      const normalized = (orders || []).map(normalizeOrder);
      resolve(normalized);
    };
    request.onerror = () => reject(new Error('Failed to read orders'));
  });
}

/**
 * Read most recent orders sorted by createdAt descending
 */
export async function readRecentOrders(limit: number): Promise<Order[]> {
  const allOrders = await readAllOrders();
  
  // Sort by createdAt descending (most recent first)
  const sorted = allOrders.sort((a, b) => {
    const timeA = parseInt(a.createdAt, 10);
    const timeB = parseInt(b.createdAt, 10);
    return timeB - timeA;
  });

  return sorted.slice(0, limit);
}

/**
 * Read a single order by ID
 */
export async function readOrderById(id: number): Promise<Order | null> {
  const db = getDb();
  if (!db) {
    throw new Error('Database not initialized');
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const order = request.result;
      // Normalize order before returning
      resolve(order ? normalizeOrder(order) : null);
    };
    request.onerror = () => reject(new Error('Failed to read order'));
  });
}

/**
 * Create a new order in IndexedDB
 */
export async function createOrder(order: Omit<Order, 'id'>): Promise<void> {
  const db = getDb();
  if (!db) {
    throw new Error('Database not initialized');
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(order);

    request.onsuccess = () => {
      // Broadcast change event
      window.dispatchEvent(new CustomEvent('db-change', { detail: { store: STORE_NAME } }));
      resolve();
    };
    request.onerror = () => reject(new Error('Failed to create order'));
  });
}

/**
 * Update an existing order in IndexedDB
 */
export async function updateOrder(
  id: number,
  updates: Partial<Omit<Order, 'id' | 'createdAt' | 'images' | 'deliveredAt'>>
): Promise<void> {
  const db = getDb();
  if (!db) {
    throw new Error('Database not initialized');
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // First, get the existing order
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const existingOrder = getRequest.result;
      if (!existingOrder) {
        reject(new Error('Order not found'));
        return;
      }
      
      // Merge updates with existing order
      const updatedOrder = {
        ...existingOrder,
        ...updates,
        id, // Ensure ID is preserved
        // Update deliveredAt if status changed to Delivered
        deliveredAt: updates.status === 'Delivered' && existingOrder.status !== 'Delivered'
          ? Date.now().toString()
          : existingOrder.deliveredAt,
        // Mark as pending sync if data changed
        syncStatus: 'pending' as const,
        syncState: 'pending' as const,
      };
      
      // Put the updated order back
      const putRequest = store.put(updatedOrder);
      
      putRequest.onsuccess = () => {
        // Broadcast change event
        window.dispatchEvent(new CustomEvent('db-change', { detail: { store: STORE_NAME } }));
        resolve();
      };
      
      putRequest.onerror = () => reject(new Error('Failed to update order'));
    };
    
    getRequest.onerror = () => reject(new Error('Failed to read order for update'));
  });
}

/**
 * Update payment for an order and append to payment history
 */
export async function updateOrderPayment(
  id: number,
  paymentUpdate: {
    advancePaid: number;
    balanceAmount: number;
    paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
    paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Other';
    historyEntry: PaymentHistoryEntry;
  }
): Promise<void> {
  const db = getDb();
  if (!db) {
    throw new Error('Database not initialized');
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // First, get the existing order
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const existingOrder = getRequest.result;
      if (!existingOrder) {
        reject(new Error('Order not found'));
        return;
      }
      
      // Ensure paymentHistory exists
      const currentHistory = Array.isArray(existingOrder.paymentHistory) 
        ? existingOrder.paymentHistory 
        : [];
      
      // Append new history entry
      const updatedHistory = [...currentHistory, paymentUpdate.historyEntry];
      
      // Merge payment updates with existing order
      const updatedOrder = {
        ...existingOrder,
        advancePaid: paymentUpdate.advancePaid,
        balanceAmount: paymentUpdate.balanceAmount,
        paymentStatus: paymentUpdate.paymentStatus,
        paymentMethod: paymentUpdate.paymentMethod,
        paymentHistory: updatedHistory,
        id, // Ensure ID is preserved
        syncStatus: 'pending' as const, // Mark as pending sync
        syncState: 'pending' as const, // Mark as pending sync (legacy)
      };
      
      // Put the updated order back
      const putRequest = store.put(updatedOrder);
      
      putRequest.onsuccess = () => {
        // Broadcast change event
        window.dispatchEvent(new CustomEvent('db-change', { detail: { store: STORE_NAME } }));
        resolve();
      };
      
      putRequest.onerror = () => reject(new Error('Failed to update order payment'));
    };
    
    getRequest.onerror = () => reject(new Error('Failed to read order for payment update'));
  });
}
