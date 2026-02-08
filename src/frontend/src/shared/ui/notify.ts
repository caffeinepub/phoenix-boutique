/**
 * Simple internal notification helper providing success and error feedback via console logging without external dependencies, enabling offline-first operation with support for Firebase auth errors.
 */

interface NotifyOptions {
  description?: string;
}

export const notifyHelper = {
  success: (title: string, options?: NotifyOptions) => {
    console.log(`✅ ${title}`, options?.description || '');
  },
  error: (title: string, options?: NotifyOptions) => {
    console.error(`❌ ${title}`, options?.description || '');
  },
};
