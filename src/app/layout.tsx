
import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { NavMain } from "@/components/nav-main";
import { BottomNav } from "@/components/bottom-nav";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { BusinessProvider } from '@/hooks/use-business-data';
import { SplashScreen } from '@/components/splash-screen';
import { NotificationBell } from '@/components/notification-bell';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'SpecsBiz | Smart Business Manager',
  description: 'AI-powered business management platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        
        {/* OneSignal SDK */}
        <Script 
          src="https://cdn.onesignal.com/sdks/OneSignalSDK.js" 
          strategy="afterInteractive"
        />
        
        {/* OneSignal Initialization Script */}
        <script dangerouslySetInnerHTML={{
          __html: `
            window.OneSignal = window.OneSignal || [];
            OneSignal.push(function() {
              OneSignal.init({
                appId: "YOUR_ONESIGNAL_APP_ID", // <-- আপনার OneSignal App ID এখানে বসাবেন
                safari_web_id: "web.onesignal.auto.0bc6006c-...", 
                notifyButton: {
                  enable: false,
                },
                allowLocalhostAsSecureOrigin: true,
              });
            });
          `
        }} />
      </head>
      <body className="font-body antialiased bg-background text-foreground overflow-x-hidden">
        <SplashScreen />
        
        <FirebaseClientProvider>
          <BusinessProvider>
            <SidebarProvider defaultOpen={true}>
              <NavMain />
              <SidebarInset className="max-w-full overflow-hidden">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10 w-full">
                  <SidebarTrigger className="-ml-1" />
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg md:text-xl font-headline font-semibold text-primary truncate">
                      <span className="hidden sm:inline">SpecsBiz | Smart Business Manager</span>
                      <span className="sm:hidden">SpecsBiz | SBM</span>
                    </h1>
                  </div>
                  <NotificationBell />
                </header>
                <main className="flex-1 p-3 md:p-6 pb-20 md:pb-6 w-full max-w-full overflow-x-hidden">
                  {children}
                </main>
                <BottomNav />
              </SidebarInset>
            </SidebarProvider>
            <Toaster />
          </BusinessProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
