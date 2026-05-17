import { auth } from '@/lib/firebase';
import { toast } from 'sonner';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function getFriendlyErrorMessage(error: any, operation: OperationType): { title: string, message: string } {
  const message = error instanceof Error ? error.message : String(error);
  
  if (message.includes('permission-denied') || message.includes('insufficient permissions')) {
    return {
      title: "Clearance Level Insufficient",
      message: `Security Protocol Violation: Your terminal does not have the required authorization to perform ${operation} on this matrix node.`
    };
  }
  
  if (message.includes('not-found')) {
    return {
      title: "Data Integrity Alert",
      message: "Entity Retrieval Failure: The requested node does not exist in the current grid sector."
    };
  }

  if (message.includes('quota-exceeded')) {
    return {
      title: "Matrix Saturation",
      message: "System Capacity Error: Matrix resource limits reached. Synchronization cycle required."
    };
  }

  if (message.includes('network-request-failed') || message.includes('unavailable') || message.includes('offline')) {
    return {
      title: "Uplink Interrupted",
      message: "Connection Alert: Signal lost. Checking terminal connectivity to central hub..."
    };
  }

  return {
    title: "Protocol Fault",
    message: `A system exception occurred during the ${operation} sequence.`
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const { title, message } = getFriendlyErrorMessage(error, operationType);

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }

  // Developer-focused telemetry groups
  console.group('🔷 MiraTech System Telemetry');
  console.error('Sequence:', operationType.toUpperCase());
  console.error('Logic Path:', path);
  console.error('Raw Signal:', errorMessage);
  console.error('Full Metadata:', errInfo);
  console.groupEnd();

  // User-facing holographic notification
  toast.error(title, {
    description: message,
    duration: 6000,
  });

  // Re-throw for internal system diagnostics
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Creates a system notification in Firestore
 */
export async function createNotification(
  title: string, 
  message: string, 
  type: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS' = 'INFO'
) {
  const { db } = await import('@/lib/firebase');
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
  
  try {
    await addDoc(collection(db, 'notifications'), {
      title,
      message,
      type,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating system notification:', error);
  }
}
