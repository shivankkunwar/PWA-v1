import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

declare global {
  // eslint-disable-next-line no-var
  var pushSubscriptions: webpush.PushSubscription[] | undefined;
}

// Use a global variable so subscriptions persist across hot reloads / serverless invocations
const pushSubscriptions: webpush.PushSubscription[] = global.pushSubscriptions || [];
if (!global.pushSubscriptions) {
  global.pushSubscriptions = pushSubscriptions;
}

// Configure VAPID keys for web-push
// These should be stored in environment variables in a real application
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BJCYodv-yqhixo9_SoE68bwivX2NJzb14b5tCJXi5c_m0VswyAwcsn0eqbw8_BChGzhZahWbDx8na3WfKFfXlQk',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'HTaM3wa6t9rIM5Xn5ey2I1blg44PhdpKzJzkvxGrDZo',
};

// Set VAPID details for web-push
webpush.setVapidDetails(
  'mailto:shivankkunwar100@gmail.com', // Your email from env
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// POST handler for both subscription storage and notification sending
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 API Request received:', JSON.stringify(body, null, 2));

    // Check if this is a subscription registration request (ONLY subscription, no type)
    if (body.subscription && !body.type) {
      console.log('💾 Storing push subscription...');
      // Store the push subscription
      const subscription = body.subscription as webpush.PushSubscription;
      
      // Check if subscription already exists to avoid duplicates
      const existingIndex = pushSubscriptions.findIndex(
        sub => sub.endpoint === subscription.endpoint
      );
      
      if (existingIndex >= 0) {
        // Update existing subscription
        pushSubscriptions[existingIndex] = subscription;
      } else {
        // Add new subscription
        pushSubscriptions.push(subscription);
      }

      console.log('Subscription stored:', subscription.endpoint);
      console.log(`💾 Total subscriptions in memory: ${pushSubscriptions.length}`);
      
      return NextResponse.json({ 
        message: 'Subscription stored successfully',
        subscriptionsCount: pushSubscriptions.length 
      });
    }

    // Check if this is a notification simulation request
    if (body.type) {
      const notificationType = body.type as 'new_match' | 'new_message' | 'chat_expiry';

      // If no subscriptions stored and client sends a subscription along with type, store it
      if (pushSubscriptions.length === 0 && body.subscription) {
        console.log('💾 Storing subscription provided in simulation request');
        pushSubscriptions.push(body.subscription as webpush.PushSubscription);
      }

      console.log(`🔔 Attempting to send ${notificationType} notification to ${pushSubscriptions.length} subscribers`);
      
      if (pushSubscriptions.length === 0) {
        console.log('❌ No subscriptions found in memory');
        return NextResponse.json(
          { error: 'No subscriptions found' },
          { status: 400 }
        );
      }

      // Create notification payload based on type
      const notificationPayloads = {
        new_match: {
          title: 'A New Spark! ✨',
          body: "You've matched with someone special!",
          icon: '/icon-192x192.svg',
          badge: '/icon-192x192.svg',
          tag: 'new_match',
          data: {
            url: '/chats?new_match=true',
            type: 'new_match'
          },
          actions: [
            {
              action: 'view',
              title: 'View Match',
              icon: '/icon-192x192.svg'
            },
            {
              action: 'dismiss',
              title: 'Later'
            }
          ]
        },
        new_message: {
          title: 'New Message 💬',
          body: 'Someone sent you a message.',
          icon: '/icon-192x192.svg',
          badge: '/icon-192x192.svg',
          tag: 'new_message',
          data: {
            url: '/chats/123',
            type: 'new_message'
          },
          actions: [
            {
              action: 'view',
              title: 'Read Now',
              icon: '/icon-192x192.svg'
            },
            {
              action: 'dismiss',
              title: 'Later'
            }
          ]
        },
        chat_expiry: {
          title: "Time's Ticking! ⏰",
          body: 'A chat is about to expire. Don\'t miss out!',
          icon: '/icon-192x192.svg',
          badge: '/icon-192x192.svg',
          tag: 'chat_expiry',
          data: {
            url: '/chats/456',
            type: 'chat_expiry'
          },
          actions: [
            {
              action: 'view',
              title: 'Open Chat',
              icon: '/icon-192x192.svg'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ]
        }
      };

      const payload = notificationPayloads[notificationType];
      
      // Send notifications to all subscribed users
      const sendPromises = pushSubscriptions.map(async (subscription, index) => {
        try {
          const result = await webpush.sendNotification(
            subscription,
            JSON.stringify(payload)
          );
          console.log(`Notification sent to subscription ${index + 1}:`, result);
          return { success: true, index };
        } catch (error) {
          console.error(`Failed to send notification to subscription ${index + 1}:`, error);
          
          // Remove invalid subscriptions (e.g., expired, unsubscribed)
          if (error instanceof Error && 
              (error.message.includes('410') || error.message.includes('expired'))) {
            console.log(`Removing invalid subscription ${index + 1}`);
            return { success: false, index, shouldRemove: true };
          }
          
          return { success: false, index };
        }
      });

      const results = await Promise.all(sendPromises);
      
      // Remove invalid subscriptions
      const invalidIndices = results
        .filter(result => result.shouldRemove)
        .map(result => result.index)
        .sort((a, b) => b - a); // Sort in descending order to avoid index shifting
      
      invalidIndices.forEach(index => {
        pushSubscriptions.splice(index, 1);
      });

      const successCount = results.filter(result => result.success).length;
      const failureCount = results.length - successCount;

      console.log(`Notification batch complete: ${successCount} sent, ${failureCount} failed`);

      return NextResponse.json({
        message: `Notification sent successfully`,
        type: notificationType,
        sent: successCount,
        failed: failureCount,
        totalSubscriptions: pushSubscriptions.length
      });
    }

    console.log('❌ Invalid request body - neither subscription nor type found');
    return NextResponse.json(
      { error: 'Invalid request body - neither subscription nor type found' },
      { status: 400 }
    );

  } catch (error) {
    console.error('API Error:', error);
    // Extra granularity for web-push errors and fetch-style errors
    if (typeof error === 'object' && error !== null) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore – non-standard fields are present on some error objects
      const statusCode = error.statusCode ?? error.status ?? 'unknown';
      // @ts-ignore
      const body = error.body || error.responseBody || undefined;
      console.error('Error statusCode:', statusCode);
      if (body) console.error('Error body:', body);
    }

    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET handler to check API status and subscription count
export async function GET() {
  return NextResponse.json({
    message: 'Notification API is running',
    subscriptionsCount: pushSubscriptions.length,
    vapidConfigured: vapidKeys.publicKey !== 'YOUR_VAPID_PUBLIC_KEY',
    publicKeyLength: vapidKeys.publicKey?.length || 0,
    publicKeyPreview: vapidKeys.publicKey?.substring(0, 10) || 'undefined',
    privateKeyLength: vapidKeys.privateKey?.length || 0,
    privateKeyPreview: vapidKeys.privateKey?.substring(0, 10) || 'undefined',
    envVarsRaw: {
      public: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.substring(0, 10) || 'undefined',
      private: process.env.VAPID_PRIVATE_KEY?.substring(0, 10) || 'undefined'
    }
  });
}
 