/**
 * Local persistence adapter using IndexedDB for offline-first storage with version 5 schema migration that adds sync tracking fields (cloudId, syncStatus, lastSyncedAt) while preserving all original data.
 */

const DB_NAME = 'phoenix_boutique_db';
const DB_VERSION = 5; // Bumped for sync tracking fields migration
const STORE_NAME = 'orders';

let db: IDBDatabase | null = null;

export async function initDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      const transaction = (event.target as IDBOpenDBRequest).transaction;
      
      // Create object store for orders if it doesn't exist
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
      
      // Migration for version 2: Add pricing/payment fields to existing orders
      if (event.oldVersion < 2 && transaction) {
        const store = transaction.objectStore(STORE_NAME);
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          const orders = getAllRequest.result;
          
          // Update each existing order with default pricing/payment fields
          orders.forEach((order: any) => {
            // Only add fields if they don't exist
            if (order.priceTotal === undefined) {
              order.priceTotal = 0;
            }
            if (order.advancePaid === undefined) {
              order.advancePaid = 0;
            }
            if (order.balanceAmount === undefined) {
              order.balanceAmount = 0;
            }
            if (order.paymentStatus === undefined) {
              order.paymentStatus = 'Unpaid';
            }
            if (order.paymentMethod === undefined) {
              order.paymentMethod = 'Cash';
            }
            if (order.notes === undefined) {
              order.notes = '';
            }
            
            // Update the record in the store
            store.put(order);
          });
          
          console.log(`Migrated ${orders.length} orders to version 2 with pricing/payment fields`);
        };
        
        getAllRequest.onerror = () => {
          console.error('Failed to migrate orders during upgrade');
        };
      }
      
      // Migration for version 3: Add paymentHistory field to existing orders
      if (event.oldVersion < 3 && transaction) {
        const store = transaction.objectStore(STORE_NAME);
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          const orders = getAllRequest.result;
          
          // Update each existing order with default empty paymentHistory
          orders.forEach((order: any) => {
            // Only add field if it doesn't exist
            if (!Array.isArray(order.paymentHistory)) {
              order.paymentHistory = [];
            }
            
            // Update the record in the store
            store.put(order);
          });
          
          console.log(`Migrated ${orders.length} orders to version 3 with paymentHistory field`);
        };
        
        getAllRequest.onerror = () => {
          console.error('Failed to migrate orders to version 3');
        };
      }
      
      // Migration for version 4: Add optional sync metadata fields
      if (event.oldVersion < 4 && transaction) {
        const store = transaction.objectStore(STORE_NAME);
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          const orders = getAllRequest.result;
          
          // Update each existing order with default sync metadata
          orders.forEach((order: any) => {
            // Only add fields if they don't exist
            if (order.remoteId === undefined) {
              order.remoteId = null;
            }
            if (order.lastSyncedAt === undefined) {
              order.lastSyncedAt = null;
            }
            if (order.syncState === undefined) {
              order.syncState = 'pending';
            }
            if (order.imageStorageUrls === undefined) {
              order.imageStorageUrls = [];
            }
            
            // Update the record in the store
            store.put(order);
          });
          
          console.log(`Migrated ${orders.length} orders to version 4 with sync metadata fields`);
        };
        
        getAllRequest.onerror = () => {
          console.error('Failed to migrate orders to version 4');
        };
      }
      
      // Migration for version 5: Add sync tracking fields (cloudId, syncStatus, lastSyncedAt)
      if (event.oldVersion < 5 && transaction) {
        const store = transaction.objectStore(STORE_NAME);
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          const orders = getAllRequest.result;
          
          // Update each existing order with default sync tracking fields
          orders.forEach((order: any) => {
            // Only add fields if they don't exist (idempotent)
            if (order.cloudId === undefined) {
              order.cloudId = null;
            }
            if (order.syncStatus === undefined) {
              order.syncStatus = 'pending';
            }
            // Note: lastSyncedAt may already exist from version 4 migration
            // Only set if it doesn't exist to avoid overwriting
            if (order.lastSyncedAt === undefined) {
              order.lastSyncedAt = null;
            }
            
            // Update the record in the store
            store.put(order);
          });
          
          console.log(`Migrated ${orders.length} orders to version 5 with sync tracking fields`);
        };
        
        getAllRequest.onerror = () => {
          console.error('Failed to migrate orders to version 5');
        };
      }
    };
  });
}

export async function writeData(storeName: string, data: unknown): Promise<void> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(data);

    request.onsuccess = () => {
      // Broadcast change event
      window.dispatchEvent(new CustomEvent('db-change', { detail: { store: storeName } }));
      resolve();
    };
    request.onerror = () => reject(new Error('Failed to write data'));
  });
}

export async function readData(storeName: string): Promise<unknown[]> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to read data'));
  });
}

export function getDb(): IDBDatabase | null {
  return db;
}
