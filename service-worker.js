// Service Worker for PWA Notification Demo
// This handles push events, caching, and notification interactions

// Workbox precaching - next-pwa will inject the manifest here
import { precacheAndRoute } from 'workbox-precaching';
precacheAndRoute(self.__WB_MANIFEST);

const CACHE_NAME = 'pwa-notification-demo-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.svg',
  '/icon-512x512.svg'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received (raw):', event);

  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  try {
    // Parse the push payload
    const data = event.data.json();
    console.log('Push data parsed:', data);
    // Extra diagnostics: timestamp + tag
    console.log('SW push @', new Date().toISOString(), 'tag=', data.tag, 'title=', data.title);

    // Default notification options
    const defaultOptions = {
      icon: '/icon-192x192.svg',
      badge: '/icon-192x192.svg',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      renotify: true,
    };

    // Merge with received data
    const options = {
      ...defaultOptions,
      ...data,
      // Ensure data is preserved for click handling
      data: {
        url: data.data?.url || '/',
        type: data.data?.type || 'unknown',
        ...data.data,
      },
    };

    // Show the notification
    event.waitUntil(
      self.registration.showNotification(
        data.title || 'New Notification',
        options
      )
    );
  } catch (error) {
    console.error('Error handling push event:', error);

    // Fallback notification if parsing fails
    event.waitUntil(
      self.registration.showNotification('New Notification', {
        body: 'You have a new notification',
        icon: '/icon-192x192.svg',
        badge: '/icon-192x192.svg',
        data: { url: '/' },
      })
    );
  }
});

// Notification click event - handle user interactions
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  // Close the notification
  notification.close();

  // Handle action buttons
  if (action === 'dismiss') {
    console.log('User dismissed notification');
    return;
  }

  // Default action or 'view' action - open the app
  const urlToOpen = data.url || '/';

  event.waitUntil(
    // Check if the app is already open
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        console.log('Current clients:', clientList.length);

        // Look for an existing window to focus
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];

          // If we find a window, focus it and navigate to the URL
          if ('focus' in client) {
            console.log('Focusing existing window and navigating to:', urlToOpen);
            client.focus();

            // Navigate to the specific URL if different
            if (client.url !== urlToOpen) {
              return client.navigate(urlToOpen);
            }
            return client;
          }
        }

        // If no window is open, open a new one
        console.log('Opening new window at:', urlToOpen);
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
      .catch((error) => {
        console.error('Error handling notification click:', error);
      })
  );
});

// Notification close event - handle when user closes notification
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.data);

  // You can track analytics here
  // For example, send data about which notifications are being dismissed
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled promise rejection:', event.reason);
});

console.log('Service Worker loaded successfully'); 