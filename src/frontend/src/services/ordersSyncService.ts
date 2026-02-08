/**
 * Sync service orchestrating upload of unsynced local orders and their images to Firestore and Firebase Storage with role-aware sanitization, STAFF attribution checks, idempotent behavior, and per-order error isolation.
 */

import { Order, readAllOrders, updateOrder } from './ordersRepository';
import {
  uploadOrderToFirestore,
  downloadOrdersFromFirestore,
  FirestoreOrder,
} from '../firebase/firestoreOrders';
import { uploadImageToStorage } from '../firebase/storageImages';
import { dataUrlToBlob } from './orderImagesLocal';
import { updateSyncSuccess, updateSyncError } from './syncStatusStore';

export interface SyncResult {
  success: boolean;
  uploaded: number;
  downloaded: number;
  errors: string[];
}

export interface SyncContext {
  userId: string;
  userRole?: 'STAFF' | 'ADMIN';
}

/**
 * Sanitize order for sync based on user role
 * STAFF: removes financial fields
 * ADMIN: keeps all fields
 */
function sanitizeOrderForSync(order: Order, userRole: 'STAFF' | 'ADMIN'): Partial<Order> {
  if (userRole === 'STAFF') {
    const {
      priceTotal,
      advancePaid,
      balanceAmount,
      paymentStatus,
      paymentMethod,
      ...allowedFields
    } = order;

    return allowedFields; // staff cannot sync financials
  }

  // ADMIN can sync everything
  return order;
}

/**
 * Check if STAFF user can sync this order (must be created by them)
 * Returns true if order is attributable to the user, false otherwise
 */
function canStaffSyncOrder(order: Order, userId: string): boolean {
  // For STAFF, we need to verify attribution
  // Since we don't have a createdBy field, we'll use a heuristic:
  // Check if the order has a remoteId/cloudId that matches the user's namespace
  // or if it's a new order (no remoteId/cloudId)
  
  // If order has never been synced, STAFF can sync it (they created it locally)
  if (!order.remoteId && !order.cloudId) {
    return true;
  }
  
  // If order was previously synced, we cannot verify attribution without a createdBy field
  // For safety, we'll skip it for STAFF
  return false;
}

/**
 * Upload a single order to cloud with role-aware sanitization
 */
async function syncOrderToCloud(
  localOrder: Order,
  context: SyncContext
): Promise<string> {
  const { userId, userRole = 'STAFF' } = context;
  
  // STAFF scope check: only sync orders created by this user
  if (userRole === 'STAFF') {
    if (!canStaffSyncOrder(localOrder, userId)) {
      throw new Error('STAFF users can only sync orders they created');
    }
  }
  
  // Sanitize order based on role
  const sanitizedOrder = sanitizeOrderForSync(localOrder, userRole);
  
  // Upload to Firestore with sanitized data
  const remoteId = await uploadOrderToFirestore(
    sanitizedOrder as Order,
    userId,
    localOrder.remoteId || undefined
  );
  
  return remoteId;
}

/**
 * Perform a full sync: upload local orders with images and download remote orders
 */
export async function syncOrders(
  userId: string,
  userRole: 'STAFF' | 'ADMIN' = 'STAFF'
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    uploaded: 0,
    downloaded: 0,
    errors: [],
  };

  const context: SyncContext = { userId, userRole };

  try {
    // Step 1: Upload local orders that haven't been synced
    const localOrders = await readAllOrders();
    
    for (const order of localOrders) {
      try {
        // Only upload if not already synced or if modified since last sync
        if (!order.remoteId || order.syncState === 'pending') {
          // STAFF scope check before processing
          if (userRole === 'STAFF' && !canStaffSyncOrder(order, userId)) {
            result.errors.push(
              `Skipped order ${order.orderId}: STAFF users can only sync orders they created`
            );
            continue;
          }
          
          // Step 1a: Upload images first
          const imageStorageUrls = order.imageStorageUrls || [];
          const imagesToUpload = order.images || [];
          
          // Determine which images need uploading
          for (let i = 0; i < imagesToUpload.length; i++) {
            // Skip if already uploaded (URL exists at this index)
            if (imageStorageUrls[i]) {
              continue;
            }
            
            const imageDataUrl = imagesToUpload[i];
            
            try {
              // Convert data URL to blob
              const imageBlob = dataUrlToBlob(imageDataUrl);
              
              // Upload to Firebase Storage
              const uploadResult = await uploadImageToStorage(
                imageBlob,
                userId,
                order.orderId,
                i
              );
              
              if (uploadResult.success && uploadResult.url) {
                // Store the uploaded URL
                imageStorageUrls[i] = uploadResult.url;
              } else {
                throw new Error(uploadResult.error || 'Image upload failed');
              }
            } catch (imageError: any) {
              result.errors.push(
                `Failed to upload image ${i} for order ${order.orderId}: ${imageError.message}`
              );
              // Don't mark order as synced if image upload fails
              throw imageError;
            }
          }
          
          // Step 1b: Update local order with uploaded image URLs before uploading to Firestore
          if (order.id && imageStorageUrls.length > 0) {
            await updateOrder(order.id, {
              imageStorageUrls,
            });
          }
          
          // Step 1c: Upload order to Firestore with role-aware sanitization
          const orderWithImages = { ...order, imageStorageUrls };
          const remoteId = await syncOrderToCloud(orderWithImages, context);
          
          // Step 1d: Update local order with sync metadata
          if (order.id) {
            await updateOrder(order.id, {
              remoteId,
              lastSyncedAt: new Date().toISOString(),
              syncState: 'synced',
            });
          }
          
          result.uploaded++;
        }
      } catch (error: any) {
        result.errors.push(`Failed to sync order ${order.orderId}: ${error.message}`);
        // Continue with other orders
      }
    }

    // Step 2: Download remote orders (optional - only if needed)
    // This is commented out to focus on upload-only sync as per requirements
    // Uncomment if bidirectional sync is needed
    /*
    try {
      const remoteOrders = await downloadOrdersFromFirestore(userId);
      
      for (const remoteOrder of remoteOrders) {
        try {
          const remoteDocId = (remoteOrder as any).id as string | undefined;
          
          const existingOrder = localOrders.find(
            (o) => o.remoteId === remoteDocId
          );

          if (!existingOrder && remoteDocId) {
            const newOrder: Omit<Order, 'id'> = {
              orderId: remoteOrder.orderId,
              customerName: remoteOrder.customerName,
              bookingDate: remoteOrder.bookingDate,
              deliveryDate: remoteOrder.deliveryDate,
              measurements: remoteOrder.measurements,
              productDetails: remoteOrder.productDetails,
              images: [],
              status: remoteOrder.status as 'Pending' | 'Delivered',
              deliveredAt: remoteOrder.deliveredAt,
              createdAt: remoteOrder.createdAt,
              priceTotal: remoteOrder.priceTotal,
              advancePaid: remoteOrder.advancePaid,
              balanceAmount: remoteOrder.balanceAmount,
              paymentStatus: remoteOrder.paymentStatus as 'Unpaid' | 'Partial' | 'Paid',
              paymentMethod: remoteOrder.paymentMethod as 'Cash' | 'UPI' | 'Card' | 'Other',
              notes: remoteOrder.notes,
              paymentHistory: remoteOrder.paymentHistory || [],
              remoteId: remoteDocId,
              lastSyncedAt: new Date().toISOString(),
              syncState: 'synced',
              imageStorageUrls: remoteOrder.imageUrls || [],
            };

            await createOrder(newOrder);
            result.downloaded++;
          }
        } catch (error: any) {
          result.errors.push(`Failed to download order ${remoteOrder.orderId}: ${error.message}`);
        }
      }
    } catch (error: any) {
      result.errors.push(`Failed to download orders: ${error.message}`);
    }
    */

    result.success = result.errors.length === 0;

    if (result.success) {
      updateSyncSuccess(
        `Successfully synced ${result.uploaded} order${result.uploaded !== 1 ? 's' : ''}`
      );
    } else {
      updateSyncError(result.errors.join('; '));
    }

    return result;
  } catch (error: any) {
    result.errors.push(`Sync failed: ${error.message}`);
    updateSyncError(error.message);
    return result;
  }
}
