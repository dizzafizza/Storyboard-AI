/**
 * Service Worker Registration Utility
 * 
 * This module handles the registration of the appropriate service worker
 * based on the current environment (development or production).
 */

// Determine if we're in development mode
const isDevelopment = import.meta.env.DEV || false;

// Get the base URL for the service worker
const baseUrl = import.meta.env.BASE_URL || '/';

/**
 * Register the appropriate service worker based on the environment
 */
export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      // Choose the appropriate service worker file
      const swFile = isDevelopment ? 'sw-dev.js' : 'sw.js';
      
      console.log(`🔧 Registering service worker: ${baseUrl}${swFile}`);
      
      const registration = await navigator.serviceWorker.register(
        `${baseUrl}${swFile}`,
        { scope: baseUrl }
      );
      
      if (registration.installing) {
        console.log('🚀 Service worker installing');
      } else if (registration.waiting) {
        console.log('⏳ Service worker installed and waiting');
      } else if (registration.active) {
        console.log('✅ Service worker active');
      }
      
      // Handle updates
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('🔄 New service worker available, reloading...');
                // Reload to activate the new service worker
                window.location.reload();
              } else {
                console.log('🔧 Service worker installed for the first time');
              }
            }
          };
        }
      };
    } catch (error) {
      console.error('❌ Service worker registration failed:', error);
    }
  } else {
    console.warn('⚠️ Service workers are not supported in this browser');
  }
};

/**
 * Unregister all service workers
 */
export const unregisterServiceWorkers = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('🗑️ Service worker unregistered');
      }
    } catch (error) {
      console.error('❌ Service worker unregistration failed:', error);
    }
  }
};

/**
 * Send a message to the service worker
 */
export const sendMessageToServiceWorker = async (
  message: any
): Promise<any> => {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
    return Promise.reject('No active service worker found');
  }
  
  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      if (event.data.error) {
        reject(event.data.error);
      } else {
        resolve(event.data);
      }
    };
    
    // We've already checked that controller is not null above
    navigator.serviceWorker.controller!.postMessage(message, [
      messageChannel.port2,
    ]);
  });
}; 