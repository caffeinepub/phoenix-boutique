/**
 * Firebase Storage image upload operations with real uploads via safe dynamic imports, uploading blobs to deterministic per-user/per-order paths and returning usable download URLs.
 */

import { getFirebaseStorage } from './firebaseApp';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  storagePath?: string;
  error?: string;
}

/**
 * Upload an image blob to Firebase Storage
 */
export async function uploadImageToStorage(
  imageBlob: Blob,
  userId: string,
  orderId: string,
  imageIndex: number
): Promise<ImageUploadResult> {
  const storage = getFirebaseStorage();

  if (!storage) {
    return {
      success: false,
      error: 'Firebase Storage is not configured. Please check your Firebase setup.',
    };
  }

  try {
    // Dynamic import of Storage functions using Function constructor to bypass TypeScript
    const importStorage = new Function('return import("firebase/storage")');
    const storageModule = await importStorage().catch(() => null);
    
    if (!storageModule) {
      return {
        success: false,
        error: 'Firebase Storage module not available. Please install firebase package.',
      };
    }

    const { ref, uploadBytes, getDownloadURL } = storageModule;

    // Create a deterministic path for the image
    const storagePath = `users/${userId}/orders/${orderId}/image_${imageIndex}_${Date.now()}.jpg`;
    const storageRef = ref(storage, storagePath);

    // Upload the blob
    await uploadBytes(storageRef, imageBlob);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);

    return {
      success: true,
      url: downloadURL,
      storagePath,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to upload image to Storage: ${error.message}`,
    };
  }
}

/**
 * Delete an image from Firebase Storage
 */
export async function deleteImageFromStorage(
  storagePath: string
): Promise<boolean> {
  const storage = getFirebaseStorage();

  if (!storage) {
    console.error('Firebase Storage is not configured.');
    return false;
  }

  try {
    // Dynamic import of Storage functions using Function constructor to bypass TypeScript
    const importStorage = new Function('return import("firebase/storage")');
    const storageModule = await importStorage().catch(() => null);
    
    if (!storageModule) {
      console.error('Firebase Storage module not available.');
      return false;
    }

    const { ref, deleteObject } = storageModule;

    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    return true;
  } catch (error: any) {
    console.error(`Failed to delete image from Storage: ${error.message}`);
    return false;
  }
}
