/**
 * Local-first image handling utilities for storing/referencing images offline.
 */

export interface LocalImage {
  id: string;
  dataUrl: string;
  timestamp: number;
  uploaded: boolean;
  storageUrl?: string;
  storagePath?: string;
}

/**
 * Convert a File or Blob to a data URL for local storage
 */
export async function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a data URL back to a Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Generate a unique ID for a local image
 */
export function generateLocalImageId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a local image object from a file
 */
export async function createLocalImage(file: File): Promise<LocalImage> {
  const dataUrl = await fileToDataUrl(file);
  return {
    id: generateLocalImageId(),
    dataUrl,
    timestamp: Date.now(),
    uploaded: false,
  };
}
