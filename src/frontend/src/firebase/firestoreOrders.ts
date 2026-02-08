/**
 * Firestore order operations with real reads/writes using dynamic imports and clear English errors when unavailable, implementing idempotent write paths that update existing documents when remoteId is provided, and only including present fields in payloads to support role-aware partial updates.
 */

import { getFirebaseFirestore } from './firebaseApp';
import { Order } from '../services/ordersRepository';

export interface FirestoreOrder {
  orderId: string;
  customerName: string;
  bookingDate: string;
  deliveryDate: string;
  measurements: string;
  productDetails: string;
  status: string;
  deliveredAt: string | null;
  createdAt: string;
  priceTotal?: number;
  advancePaid?: number;
  balanceAmount?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  notes?: string;
  paymentHistory?: any[];
  imageUrls?: string[];
  userId: string;
  localId?: number;
  lastSyncedAt: string;
}

/**
 * Upload order to Firestore (idempotent: creates new or updates existing)
 * Only includes fields that are present in the order object
 */
export async function uploadOrderToFirestore(
  order: Partial<Order>,
  userId: string,
  remoteId?: string
): Promise<string> {
  const firestore = getFirebaseFirestore();

  if (!firestore) {
    throw new Error('Firestore is not configured. Please check your Firebase setup.');
  }

  try {
    // Dynamic import of Firestore functions using Function constructor to bypass TypeScript
    const importFirestore = new Function('return import("firebase/firestore")');
    const firestoreModule = await importFirestore().catch(() => null);
    
    if (!firestoreModule) {
      throw new Error('Firebase Firestore module not available. Please install firebase package.');
    }

    const { collection, doc, setDoc, addDoc } = firestoreModule;

    const ordersCollection = collection(firestore, 'orders');

    // Prepare Firestore document data - only include fields that are present
    const firestoreData: Partial<FirestoreOrder> = {
      userId,
      lastSyncedAt: new Date().toISOString(),
    };

    // Add required fields
    if (order.orderId !== undefined) firestoreData.orderId = order.orderId;
    if (order.customerName !== undefined) firestoreData.customerName = order.customerName;
    if (order.bookingDate !== undefined) firestoreData.bookingDate = order.bookingDate;
    if (order.deliveryDate !== undefined) firestoreData.deliveryDate = order.deliveryDate;
    if (order.measurements !== undefined) firestoreData.measurements = order.measurements;
    if (order.productDetails !== undefined) firestoreData.productDetails = order.productDetails;
    if (order.status !== undefined) firestoreData.status = order.status;
    if (order.deliveredAt !== undefined) firestoreData.deliveredAt = order.deliveredAt;
    if (order.createdAt !== undefined) firestoreData.createdAt = order.createdAt;

    // Add optional fields only if present
    if (order.priceTotal !== undefined) firestoreData.priceTotal = order.priceTotal;
    if (order.advancePaid !== undefined) firestoreData.advancePaid = order.advancePaid;
    if (order.balanceAmount !== undefined) firestoreData.balanceAmount = order.balanceAmount;
    if (order.paymentStatus !== undefined) firestoreData.paymentStatus = order.paymentStatus;
    if (order.paymentMethod !== undefined) firestoreData.paymentMethod = order.paymentMethod;
    if (order.notes !== undefined) firestoreData.notes = order.notes;
    if (order.paymentHistory !== undefined) firestoreData.paymentHistory = order.paymentHistory;
    if (order.imageStorageUrls !== undefined) firestoreData.imageUrls = order.imageStorageUrls;
    if (order.id !== undefined) firestoreData.localId = order.id;

    // Idempotent behavior: update existing document if remoteId exists, otherwise create new
    if (remoteId) {
      const docRef = doc(ordersCollection, remoteId);
      await setDoc(docRef, firestoreData, { merge: true });
      return remoteId;
    } else {
      const docRef = await addDoc(ordersCollection, firestoreData);
      return docRef.id;
    }
  } catch (error: any) {
    throw new Error(`Failed to upload order to Firestore: ${error.message}`);
  }
}

/**
 * Download all orders for a user from Firestore
 */
export async function downloadOrdersFromFirestore(
  userId: string
): Promise<FirestoreOrder[]> {
  const firestore = getFirebaseFirestore();

  if (!firestore) {
    throw new Error('Firestore is not configured. Please check your Firebase setup.');
  }

  try {
    // Dynamic import of Firestore functions using Function constructor to bypass TypeScript
    const importFirestore = new Function('return import("firebase/firestore")');
    const firestoreModule = await importFirestore().catch(() => null);
    
    if (!firestoreModule) {
      throw new Error('Firebase Firestore module not available. Please install firebase package.');
    }

    const { collection, query, where, getDocs } = firestoreModule;

    const ordersCollection = collection(firestore, 'orders');
    const q = query(ordersCollection, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const orders: FirestoreOrder[] = [];
    querySnapshot.forEach((doc: any) => {
      orders.push({
        ...(doc.data() as Omit<FirestoreOrder, 'id'>),
        id: doc.id,
      } as any);
    });

    return orders;
  } catch (error: any) {
    throw new Error(`Failed to download orders from Firestore: ${error.message}`);
  }
}

/**
 * Get a single order from Firestore by document ID
 */
export async function getOrderFromFirestore(
  docId: string
): Promise<FirestoreOrder | null> {
  const firestore = getFirebaseFirestore();

  if (!firestore) {
    throw new Error('Firestore is not configured. Please check your Firebase setup.');
  }

  try {
    // Dynamic import of Firestore functions using Function constructor to bypass TypeScript
    const importFirestore = new Function('return import("firebase/firestore")');
    const firestoreModule = await importFirestore().catch(() => null);
    
    if (!firestoreModule) {
      throw new Error('Firebase Firestore module not available. Please install firebase package.');
    }

    const { doc, getDoc } = firestoreModule;

    const docRef = doc(firestore, 'orders', docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        ...(docSnap.data() as Omit<FirestoreOrder, 'id'>),
        id: docSnap.id,
      } as any;
    }

    return null;
  } catch (error: any) {
    throw new Error(`Failed to get order from Firestore: ${error.message}`);
  }
}
