
'use client';

import { usePathname } from 'next/navigation';
import './globals.css';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { NavMain } from "@/components/nav-main";
import { BottomNav } from "@/components/bottom-nav";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { BusinessProvider, useBusinessData } from '@/hooks/use-business-data';
import { NotificationBell } from '@/components/notification-bell';
import { FloatingCalculator } from '@/components/floating-calculator';
import { useUser } from '@/firebase';
import AuthPage from './auth/page';
import Script from 'next/script';

// Internal component to handle the conditional layout based on auth and route
function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const isShopPage = pathname?.startsWith('/shop/');
  const isAuthPage = pathname === '/auth';

  // If loading user state, show a simple loader
  if (isUserLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="h-12 w-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // PUBLIC SHOP VIEW: No sidebar, no header, no protection
  if (isShopPage) {
    return <main className="w-full h-full min-h-screen">{children}</main>;
  }

  // PRIVACY SHIELD: If not logged in and not on a shop page, show the login screen only
  // This prevents anyone from "cutting the URL" and seeing the app interface
  if (!user && !isAuthPage) {
    return <AuthPage />;
  }

  // AUTHENTICATED APP VIEW
  return (
    <SidebarProvider defaultOpen={true}>
      <NavMain />
      <SidebarInset className="max-w-full overflow-hidden">
        <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b px-2 md:px-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10 w-full">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1 min-w-0">
            <h1 className="text-base md:text-xl font-headline font-bold text-primary truncate">
              <span className="hidden xs:inline">SpecsBiz | Smart Manager</span>
              <span className="xs:hidden">SpecsBiz</span>
            </h1>
          </div>
          <NotificationBell />
        </header>
        <main className="flex-1 p-2 md:p-6 pb-20 md:pb-6 w-full max-w-full overflow-x-hidden">
          {children}
        </main>
        <BottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isShopPage = pathname?.startsWith('/shop/');

  return (
    <html lang="en">
      <head>
        <title>SpecsBiz | Smart Business Manager</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        
        {/* OneSignal SDK */}
        <Script 
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" 
          strategy="afterInteractive"
        />
        
        <script dangerouslySetInnerHTML={{
          __html: `
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            OneSignalDeferred.push(async function(OneSignal) {
              const currentHost = window.location.hostname;
              const isProd = currentHost === "starlit-figolla-73c2bb.netlify.app";
              
              if (isProd) {
                try {
                  await OneSignal.init({
                    appId: "39316530-c197-4734-94f1-e6aae18dc20c",
                    notifyButton: { enable: false },
                    allowLocalhostAsSecureOrigin: true,
                  });
                } catch (e) {
                  console.warn("OneSignal init error:", e.message);
                }
              }
            });
          `
        }} />
      </head>
      <body className="font-body antialiased bg-background text-foreground overflow-x-hidden">
        <FirebaseClientProvider>
          <BusinessProvider>
            <LayoutContent>{children}</LayoutContent>
            {!isShopPage && <FloatingCalculator />}
            <Toaster />
          </BusinessProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
