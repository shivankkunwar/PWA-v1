'use client';

import { useState, useEffect } from 'react';
import InstallPWAButton from './components/InstallPWAButton';

export default function Home() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionObj, setSubscriptionObj] = useState<PushSubscription | null>(null);

  // Check notification permission on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  // Check if user is already subscribed to push notifications
  const checkSubscription = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
        setSubscriptionObj(subscription);
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    }
  };

  // Request notification permission and subscribe to push notifications
  const enableNotifications = async () => {
    setIsLoading(true);
    
    try {
      console.log('🔔 Starting notification setup...');
      
      // Request notification permission
      console.log('📋 Requesting notification permission...');
      const permission = await Notification.requestPermission();
      console.log('📋 Permission result:', permission);
      setPermission(permission);

      if (permission === 'granted') {
        // Check browser support
        if (!('serviceWorker' in navigator)) {
          throw new Error('Service Worker not supported');
        }
        if (!('PushManager' in window)) {
          throw new Error('Push Manager not supported');
        }
        
        console.log('🔧 Registering service worker...');
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('🔧 Service worker registered:', registration);
        
        console.log('⏳ Waiting for service worker to be ready...');
        await navigator.serviceWorker.ready;
        console.log('✅ Service worker ready!');

        // Check if already subscribed
        console.log('🔍 Checking existing subscription...');
        let subscription = await registration.pushManager.getSubscription();
        console.log('🔍 Existing subscription:', subscription ? 'Found' : 'None');
        
        if (!subscription) {
          // Get VAPID key
          const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BJCYodv-yqhixo9_SoE68bwivX2NJzb14b5tCJXi5c_m0VswyAwcsn0eqbw8_BChGzhZahWbDx8na3WfKFfXlQk';
          console.log('🔑 Using VAPID key (first 10 chars):', vapidPublicKey.substring(0, 10));
          
          // Convert VAPID key
          console.log('🔄 Converting VAPID key...');
          const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
          console.log('🔄 VAPID key converted, length:', applicationServerKey.length);
          
          // Subscribe to push notifications
          console.log('📤 Creating push subscription...');
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey,
          });
          console.log('📤 Push subscription created:', subscription.endpoint.substring(0, 50) + '...');
        }

        // Send subscription to server
        console.log('📡 Sending subscription to server...');
        const response = await fetch('/api/notify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subscription }),
        });
        
        if (!response.ok) {
          throw new Error(`Server response: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📡 Server response:', result);

        setIsSubscribed(true);
        setSubscriptionObj(subscription);
        console.log('🎉 Notification setup complete!');
        
      } else {
        throw new Error(`Permission ${permission}: User did not grant notification permission`);
      }
    } catch (error) {
      console.error('❌ Error enabling notifications:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Registration failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate different types of notifications
  const simulateNotification = async (type: 'new_match' | 'new_message' | 'chat_expiry') => {
    try {
      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, subscription: subscriptionObj }),
      });

      if (response.ok) {
        alert(`${type.replace('_', ' ')} notification sent!`);
      } else {
        alert('Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    }
  };

  // Helper function to convert VAPID key
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return 'Granted ✅';
      case 'denied':
        return 'Denied ❌';
      default:
        return 'Not Requested ⏳';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            PWA Notification Demo
          </h1>
          
          {/* PWA Install Button */}
          <div className="mb-6 flex justify-center">
            <InstallPWAButton 
              buttonText="📱 Install App"
              onInstallPromptHandled={(outcome) => {
                console.log(`PWA installation ${outcome}`);
                if (outcome === 'accepted') {
                  alert('🎉 App installed successfully!');
                }
              }}
            />
          </div>
          
          {/* Notification Permission Status */}
          <div className="mb-8 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Notification Permission:</p>
            <p className="text-lg font-semibold text-gray-900">
              {getPermissionStatus()}
            </p>
            {isSubscribed && (
              <p className="text-sm text-green-600 mt-2">
                ✅ Subscribed to push notifications
              </p>
            )}
          </div>

          {/* Enable Notifications Button */}
          <button
            onClick={enableNotifications}
            disabled={permission === 'granted' || isLoading}
            className={`w-full mb-8 py-3 px-4 rounded-md text-white font-medium ${
              permission === 'granted' || isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {isLoading ? 'Setting up...' : 'Enable Push Notifications'}
          </button>

          {/* Simulation Section */}
          <div className="border-t pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Simulate Server Events
            </h2>
            
            <div className="space-y-3">
              <button
                onClick={() => simulateNotification('new_match')}
                disabled={!isSubscribed}
                className={`w-full py-3 px-4 rounded-md font-medium ${
                  isSubscribed
                    ? 'bg-green-600 hover:bg-green-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Simulate: New Match
              </button>
              
              <button
                onClick={() => simulateNotification('new_message')}
                disabled={!isSubscribed}
                className={`w-full py-3 px-4 rounded-md font-medium ${
                  isSubscribed
                    ? 'bg-purple-600 hover:bg-purple-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Simulate: New Message
              </button>
              
              <button
                onClick={() => simulateNotification('chat_expiry')}
                disabled={!isSubscribed}
                className={`w-full py-3 px-4 rounded-md font-medium ${
                  isSubscribed
                    ? 'bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Simulate: Chat Expiry Reminder
              </button>
            </div>
            
            {!isSubscribed && (
              <p className="text-sm text-gray-500 mt-4">
                Enable notifications to use simulation buttons
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
