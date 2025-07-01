'use client';

import { useState, useEffect } from 'react';

// Custom TypeScript interface for the BeforeInstallPromptEvent
// This event is not included in standard TypeScript definitions
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPWAButtonProps {
  /**
   * Custom button text (default: "Install App")
   */
  buttonText?: string;
  /**
   * Custom CSS classes for styling
   */
  className?: string;
  /**
   * Callback function called after installation prompt is handled
   */
  onInstallPromptHandled?: (outcome: 'accepted' | 'dismissed') => void;
}

/**
 * InstallPWAButton Component
 * 
 * A reusable React component that provides a user-friendly "Install App" experience
 * for Progressive Web Apps. Handles the beforeinstallprompt event and provides
 * graceful degradation for unsupported browsers (like iOS Safari).
 */
export default function InstallPWAButton({ 
  buttonText = "Install App",
  className = "",
  onInstallPromptHandled
}: InstallPWAButtonProps) {
  // State to store the captured beforeinstallprompt event
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  
  // State to track if the component is running on iOS Safari
  const [isIOS, setIsIOS] = useState<boolean>(false);
  
  // State to control button visibility after installation attempt
  const [isInstallPromptUsed, setIsInstallPromptUsed] = useState<boolean>(false);

  useEffect(() => {
    /**
     * Detect iOS Safari
     * iOS Safari doesn't support beforeinstallprompt, so we need to handle it differently
     */
    const detectIOS = (): boolean => {
      if (typeof window === 'undefined') return false;
      
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /ipad|iphone|ipod/.test(userAgent);
      const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
      
      return isIOSDevice && isSafari;
    };

    setIsIOS(detectIOS());

    /**
     * Event handler for the beforeinstallprompt event
     * This event is fired when the browser determines the app is installable
     */
    const handleBeforeInstallPrompt = (event: Event) => {
      console.log('📱 PWA install prompt available');
      
      // Prevent the default browser install prompt from showing immediately
      event.preventDefault();
      
      // Capture the event so we can trigger it later with our custom button
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    /**
     * Event handler for the appinstalled event
     * This fires when the PWA has been successfully installed
     */
    const handleAppInstalled = () => {
      console.log('🎉 PWA was successfully installed');
      
      // Clean up: remove the deferred prompt since app is now installed
      setDeferredPrompt(null);
      setIsInstallPromptUsed(true);
    };

    // Only listen for events if not on iOS (iOS doesn't support these events)
    if (!detectIOS()) {
      // Add event listeners for install-related events
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
    }

    // Cleanup event listeners on component unmount
    return () => {
      if (!detectIOS()) {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      }
    };
  }, []);

  /**
   * Handle the install button click
   * Triggers the native installation prompt and handles the user's response
   */
  const handleInstallClick = async (): Promise<void> => {
    if (!deferredPrompt) {
      console.warn('⚠️ No install prompt available');
      return;
    }

    try {
      console.log('🚀 Triggering PWA install prompt');
      
      // Show the native installation prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice;
      
      console.log(`👤 User choice: ${choiceResult.outcome}`);
      
      // Call the optional callback with the user's choice
      if (onInstallPromptHandled) {
        onInstallPromptHandled(choiceResult.outcome);
      }
      
      // Clean up: clear the deferred prompt since it can only be used once
      setDeferredPrompt(null);
      // Hide button only if the app was installed successfully.
      // If the user dismissed the prompt, keep the button so they can try again
      if (choiceResult.outcome === 'accepted') {
        setIsInstallPromptUsed(true);
      }
      
    } catch (error) {
      console.error('❌ Error during PWA installation:', error);
    }
  };

  /**
   * Render Logic
   */
  
  // Don't render anything on iOS Safari (no PWA install support)
  if (isIOS) {
    // Alternative UI for iOS Safari could go here
    // For example, you could show instructions to "Add to Home Screen" manually
    
    /* 
    // Uncomment this section if you want to show iOS-specific instructions
    return (
      <div className="ios-install-hint p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          To install this app on iOS: tap the Share button 
          <span className="inline-block mx-1">📤</span> 
          then "Add to Home Screen"
        </p>
      </div>
    );
    */
    
    return null;
  }

  // Don't render if no install prompt is available or already used
  if (!deferredPrompt || isInstallPromptUsed) {
    return null;
  }

  // Render the install button
  return (
    <button
      onClick={handleInstallClick}
      className={`
        install-pwa-button
        inline-flex items-center justify-center
        px-4 py-2 
        bg-blue-600 hover:bg-blue-700 
        text-white font-medium text-sm
        rounded-md shadow-sm
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      aria-label="Install this app on your device"
    >
      {/* Install icon */}
      <svg
        className="w-4 h-4 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      {buttonText}
    </button>
  );
} 