# PWA Notification Demo

A complete proof-of-concept Next.js Progressive Web App demonstrating push notifications for anonymous chat applications. This project serves as both a learning tool and a client demo for understanding how notifications work in modern web applications.

## 🎯 Project Purpose

This PoC demonstrates:

1. **Privacy-first notifications** - Generic notification text that doesn't reveal sensitive content
2. **Actionable notifications** - Buttons that deep-link users to specific app sections
3. **Event-driven system** - Different notification types for various chat events
4. **End-to-end PWA implementation** - Complete service worker and push notification setup

## 🏗️ Architecture Overview

The notification system consists of four main components:

### 1. **Frontend (React Component)**
- Handles notification permission requests
- Manages push subscription lifecycle
- Provides simulation interface for testing

### 2. **Service Worker (`/public/sw.js`)**
- Receives push events from push services
- Displays notifications with custom actions
- Handles notification clicks and deep-linking

### 3. **API Route (`/app/api/notify/route.ts`)**
- Stores push subscriptions (in-memory for PoC)
- Sends notifications using the web-push library
- Manages notification payloads for different event types

### 4. **PWA Configuration**
- Manifest file for app installation
- Icon assets and branding
- Service worker registration

## 📊 Data Flow Diagram

```
User Action → Frontend → API Route → Push Service → Service Worker → Browser Notification

1. User enables notifications
2. Browser requests permission
3. If granted, creates push subscription
4. Frontend sends subscription to API
5. API stores subscription
6. User simulates notification
7. API crafts notification payload
8. API sends to push service (FCM/Mozilla/etc.)
9. Push service delivers to device
10. Service worker receives push event
11. Service worker shows notification
12. User clicks notification
13. Service worker opens/focuses app
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Modern browser with push notification support
- HTTPS environment (required for push notifications)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Generate VAPID keys:**
   ```bash
   npx web-push generate-vapid-keys
   ```

3. **Configure environment variables:**
   
   Copy the content from `env-template.txt` to create `.env.local`:
   ```bash
   # Create .env.local file
   cp env-template.txt .env.local
   ```
   
   Then edit `.env.local` and replace the placeholder values with your generated VAPID keys:
   ```env
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
   VAPID_PRIVATE_KEY=your_private_key_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Access the app:**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 🧪 Testing the Notifications

1. **Enable Notifications:**
   - Click "Enable Push Notifications"
   - Accept the browser permission prompt
   - Verify the status shows "Granted ✅"

2. **Simulate Events:**
   - Use the three simulation buttons to test different notification types
   - Each button represents a different chat event:
     - **New Match**: Simulates matching with someone
     - **New Message**: Simulates receiving a message
     - **Chat Expiry**: Simulates a time-sensitive reminder

3. **Test Notification Interactions:**
   - Click notifications to see deep-linking behavior
   - Test action buttons ("View Match", "Read Now", etc.)
   - Observe how the app focuses/opens when clicked

## 📱 PWA Features

### Installation
- Visit the app in a modern browser
- Look for the "Install App" prompt in the address bar
- Once installed, the app works offline and feels native

### Offline Support
- Basic caching for core app resources
- Service worker handles offline scenarios
- Notifications work even when the app is closed

## 🔧 Configuration Options

### Notification Types

The demo supports three event types, each with customized:

- **Title and Body**: Privacy-focused, generic messaging
- **Icons**: App-branded notification icons
- **Actions**: Contextual buttons for user interaction
- **Deep Links**: Direct navigation to relevant app sections

### VAPID Keys

VAPID (Voluntary Application Server Identification) keys provide:
- **Security**: Authenticates your server with push services
- **Rate Limiting**: Prevents abuse of push services
- **Contact Info**: Allows push services to contact you if needed

## 🎓 Learning Concepts

### Key Web APIs Used

1. **Notification API** (`Notification.requestPermission()`)
   - Requests user permission for notifications
   - Checks current permission status

2. **Push API** (`registration.pushManager.subscribe()`)
   - Creates push subscriptions
   - Manages subscription lifecycle

3. **Service Worker API** (`navigator.serviceWorker.register()`)
   - Registers background script
   - Handles push events when app is closed

4. **Fetch API** (Frontend ↔ Backend communication)
   - Sends subscriptions to server
   - Triggers notification simulations

### Security Considerations

- **HTTPS Required**: Push notifications only work over secure connections
- **User Consent**: Always require explicit permission before subscribing
- **VAPID Keys**: Keep private keys secure and never expose them client-side
- **Subscription Validation**: Verify subscriptions before sending notifications

### Real-World Implementation Tips

1. **Database Storage**: Replace in-memory storage with a proper database
2. **User Management**: Associate subscriptions with user accounts
3. **Rate Limiting**: Implement limits to prevent notification spam
4. **Analytics**: Track notification open rates and user engagement
5. **A/B Testing**: Test different notification styles and timing
6. **Segmentation**: Send targeted notifications based on user behavior

## 🛠️ Development

### Project Structure
```
/app
  /api/notify/route.ts    # Backend notification handler
  layout.tsx              # App layout with PWA metadata
  page.tsx               # Main demo interface
/public
  sw.js                  # Service worker
  manifest.json          # PWA manifest
  icon-*.svg            # App icons
next.config.ts           # Next.js + PWA configuration
```

### Adding New Notification Types

1. **Update the API route** (`/app/api/notify/route.ts`):
   ```typescript
   const notificationPayloads = {
     // Add your new type here
     new_type: {
       title: 'Your Title',
       body: 'Your message',
       data: { url: '/your-route' }
     }
   };
   ```

2. **Update the frontend** (`/app/page.tsx`):
   ```typescript
   // Add new simulation button
   <button onClick={() => simulateNotification('new_type')}>
     Simulate: Your New Type
   </button>
   ```

### Deployment Considerations

- **HTTPS**: Deploy to a platform with SSL/TLS support
- **Environment Variables**: Secure your VAPID keys in production
- **Caching**: Configure appropriate cache headers for PWA assets
- **Monitoring**: Set up logging for push notification delivery

## 🐛 Troubleshooting

### Common Issues

1. **"Notifications not working"**
   - Check if HTTPS is enabled
   - Verify VAPID keys are correctly set
   - Ensure notification permission is granted

2. **"Service worker not registering"**
   - Check browser console for errors
   - Verify `/sw.js` is accessible
   - Clear browser cache and try again

3. **"Push subscription fails"**
   - Confirm VAPID public key format
   - Check if browser supports push notifications
   - Verify service worker is active

### Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support  
- **Safari**: iOS 16.4+ / macOS 13+
- **Mobile**: Progressive enhancement recommended

## 📈 Next Steps

To evolve this PoC into a production system:

1. **Database Integration**: Implement persistent subscription storage
2. **User Authentication**: Associate notifications with user accounts
3. **Real-time Events**: Connect to actual chat events
4. **Advanced Targeting**: Implement user segmentation
5. **Analytics Dashboard**: Track notification performance
6. **Multi-platform**: Extend to mobile apps with Firebase

## 📚 Additional Resources

- [Web Push Protocol RFC](https://tools.ietf.org/html/rfc8030)
- [MDN Push API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Google's Web Push Guide](https://developers.google.com/web/fundamentals/push-notifications)
- [PWA Best Practices](https://web.dev/pwa/)

---

**Built with Next.js 15, TypeScript, Tailwind CSS, and lots of ☕**
