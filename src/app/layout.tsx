
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
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import AuthPage from './auth/page';
import Script from 'next/script';
import { ShieldAlert, LogOut, Clock } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';

// Component to handle account suspension and deletion check
function ShieldGuard({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const db = useFirestore();
  
  // 1. Fetch User Profile to get their linked code
  const userProfileRef = useMemoFirebase(() => {
    if (!user?.uid || !db) return null;
    return doc(db, 'users', user.uid);
  }, [user?.uid, db]);
  const { data: profile } = useDoc(userProfileRef);

  // 2. Fetch Code Status
  const codeRef = useMemoFirebase(() => {
    if (!profile?.usedCode || !db) return null;
    return doc(db, 'registrationCodes', profile.usedCode);
  }, [profile?.usedCode, db]);
  const { data: codeData } = useDoc(codeRef);

  // Allow developer account always
  if (user?.email === 'specsxr@gmail.com') return <>{children}</>;

  // If account is marked inactive or deleted
  if (codeData && (codeData.status === 'inactive' || codeData.status === 'deleted')) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#191970] p-6 text-white text-center">
        <div className="max-w-md space-y-6 animate-in zoom-in-95 duration-500">
          <div className="mx-auto w-24 h-24 bg-red-500/20 rounded-[2.5rem] border border-red-500/30 flex items-center justify-center">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              {codeData.status === 'deleted' ? 'Account Wiped' : 'Access Denied'}
            </h1>
            <p className="text-sm font-medium opacity-60">
              {codeData.status === 'deleted' 
                ? 'Sir, this account and its data have been permanently removed from our cloud.' 
                : 'Sir, your account has been suspended by the developer. Please contact specsxr@gmail.com to reactivate your cloud space.'}
            </p>
          </div>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 h-12 px-8 rounded-xl font-black uppercase" onClick={() => signOut(getAuth())}>
            Logout Session
          </Button>
        </div>
      </div>
    );
  }

  // Handle Pending Deletion Warning
  if (codeData && codeData.status === 'pending_deletion') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#191970] p-6 text-white text-center">
        <div className="max-w-md space-y-6 animate-in zoom-in-95 duration-500">
          <div className="mx-auto w-24 h-24 bg-amber-500/20 rounded-[2.5rem] border border-amber-500/30 flex items-center justify-center">
            <Clock className="w-12 h-12 text-amber-500 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-tighter">Deletion Pending</h1>
            <p className="text-sm font-medium opacity-60">
              Sir, you have requested to delete this account. It will be permanently wiped in 3 days. 
              Please contact the developer if you wish to cancel this request.
            </p>
          </div>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 h-12 px-8 rounded-xl font-black uppercase" onClick={() => signOut(getAuth())}>
            Logout for now
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const isShopPage = pathname?.startsWith('/shop/');
  const isAuthPage = pathname === '/auth';

  if (isUserLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="h-12 w-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isShopPage) {
    return <main className="w-full h-full min-h-screen">{children}</main>;
  }

  if (!user && !isAuthPage) {
    return <AuthPage />;
  }

  return (
    <ShieldGuard>
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
    </ShieldGuard>
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
        <Script 
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" 
          strategy="afterInteractive"
        />
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
