/**
 * Best-effort Firestore audit logging service that writes order action logs to /auditLogs without breaking offline-first behavior, using dynamic imports consistent with existing Firebase modules.
 */

import { getFirebaseFirestore } from './firebaseApp';
import { getFirebaseAuth } from './firebaseApp';

export type AuditAction = 
  | 'order_created'
  | 'order_updated'
  | 'payment_updated'
  | 'order_deleted';

export interface AuditLogEntry {
  action: AuditAction;
  orderId: string;
  localId?: number;
  actorUid: string;
  actorEmail?: string;
  actorRole: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface AuditLogDocument extends AuditLogEntry {
  id?: string;
}

/**
 * Write an audit log entry to Firestore (best-effort, non-blocking)
 * Returns success status without throwing to UI
 */
export async function writeAuditLog(
  action: AuditAction,
  orderId: string,
  actorUid: string,
  actorRole: string,
  details?: Record<string, any>,
  localId?: number
): Promise<{ success: boolean; error?: string }> {
  const firestore = getFirebaseFirestore();
  const auth = getFirebaseAuth();

  // Best-effort: if Firestore is not configured, return gracefully
  if (!firestore || !auth) {
    return { success: false, error: 'Firestore not configured' };
  }

  try {
    // Dynamic import of Firestore functions using Function constructor
    const importFirestore = new Function('return import("firebase/firestore")');
    const firestoreModule = await importFirestore().catch(() => null);
    
    if (!firestoreModule) {
      return { success: false, error: 'Firestore module not available' };
    }

    const { collection, addDoc, serverTimestamp } = firestoreModule;

    const auditLogsCollection = collection(firestore, 'auditLogs');

    // Get current user email if available
    const currentUser = auth.currentUser;
    const actorEmail = currentUser?.email || undefined;

    const logEntry: Partial<AuditLogDocument> = {
      action,
      orderId,
      localId,
      actorUid,
      actorEmail,
      actorRole,
      timestamp: new Date().toISOString(),
      details: details || {},
    };

    await addDoc(auditLogsCollection, {
      ...logEntry,
      serverTimestamp: serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    // Best-effort: log error but don't throw to UI
    console.warn('Failed to write audit log:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Read recent audit logs from Firestore (for ADMIN viewing)
 * Returns empty array if Firestore is unavailable
 */
export async function readAuditLogs(
  limit: number = 100
): Promise<AuditLogDocument[]> {
  const firestore = getFirebaseFirestore();

  if (!firestore) {
    return [];
  }

  try {
    // Dynamic import of Firestore functions using Function constructor
    const importFirestore = new Function('return import("firebase/firestore")');
    const firestoreModule = await importFirestore().catch(() => null);
    
    if (!firestoreModule) {
      return [];
    }

    const { collection, query, orderBy, limit: limitFn, getDocs } = firestoreModule;

    const auditLogsCollection = collection(firestore, 'auditLogs');
    const q = query(
      auditLogsCollection,
      orderBy('timestamp', 'desc'),
      limitFn(limit)
    );

    const querySnapshot = await getDocs(q);

    const logs: AuditLogDocument[] = [];
    querySnapshot.forEach((doc: any) => {
      logs.push({
        id: doc.id,
        ...doc.data(),
      } as AuditLogDocument);
    });

    return logs;
  } catch (error: any) {
    console.error('Failed to read audit logs:', error.message);
    return [];
  }
}
