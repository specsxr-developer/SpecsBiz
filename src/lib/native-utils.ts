
/**
 * @fileOverview Utility to communicate with native mobile wrappers like Median.co or GoNative.
 * This bridge allows the web app to trigger hardware features like Push Notifications.
 */

export const NativeBridge = {
  /**
   * Sends a native local notification to the phone's notification tray.
   * Works when the app is wrapped in a native container (Median/GoNative).
   */
  sendNotification: (title: string, message: string) => {
    if (typeof window !== 'undefined') {
      // 1. Check for Median.co (GoNative) bridge
      if ((window as any).gonative) {
        try {
          (window as any).gonative.notifications.create({
            title: title,
            message: message,
          });
        } catch (e) {
          console.error("Median notification failed", e);
        }
      } 
      // 2. Fallback to browser-based OneSignal direct push if available
      else if ((window as any).OneSignal) {
        console.log("Using OneSignal Web Bridge for:", title);
      }
      else {
        console.log("Not in a native environment. Notification:", title, message);
      }
    }
  },

  /**
   * Sets OneSignal external user ID for targeted push notifications.
   * This allows the shop owner to receive alerts specific to their shop.
   */
  setExternalUserId: (userId: string) => {
    if (typeof window !== 'undefined' && (window as any).OneSignal) {
      (window as any).OneSignal.push(() => {
        (window as any).OneSignal.setExternalUserId(userId);
      });
    }
  }
};
