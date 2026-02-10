
/**
 * @fileOverview Utility to communicate with native mobile wrappers like Median.co or GoNative.
 */

export const NativeBridge = {
  /**
   * Sends a native local notification to the phone's notification tray.
   * Works when the app is wrapped in a native container (Median/GoNative).
   */
  sendNotification: (title: string, message: string) => {
    if (typeof window !== 'undefined' && (window as any).gonative) {
      try {
        (window as any).gonative.notifications.create({
          title: title,
          message: message,
        });
      } catch (e) {
        console.error("Native notification failed", e);
      }
    } else {
      console.log("Not in a native environment. Notification:", title, message);
    }
  },

  /**
   * Sets OneSignal external user ID for targeted push notifications.
   */
  setExternalUserId: (userId: string) => {
    if (typeof window !== 'undefined' && (window as any).OneSignal) {
      (window as any).OneSignal.push(() => {
        (window as any).OneSignal.setExternalUserId(userId);
      });
    }
  }
};
