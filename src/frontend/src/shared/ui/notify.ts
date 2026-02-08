/**
 * Simple internal notification helper for user feedback.
 * Provides success and error notifications without external dependencies.
 */

interface NotifyOptions {
  description?: string;
}

function notify(message: string, type: 'success' | 'error', options?: NotifyOptions) {
  const prefix = type === 'success' ? '✓' : '✗';
  const fullMessage = options?.description 
    ? `${prefix} ${message}: ${options.description}`
    : `${prefix} ${message}`;
  
  console.log(`[${type.toUpperCase()}]`, fullMessage);
  
  // Optional: Show a brief alert for critical errors
  if (type === 'error') {
    // Could be enhanced with a custom toast UI component in the future
  }
}

export const notifyHelper = {
  success: (message: string, options?: NotifyOptions) => notify(message, 'success', options),
  error: (message: string, options?: NotifyOptions) => notify(message, 'error', options),
};
