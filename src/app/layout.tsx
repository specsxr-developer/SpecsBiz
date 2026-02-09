import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { NavMain } from "@/components/nav-main";
import { BottomNav } from "@/components/bottom-nav";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { BusinessProvider } from '@/hooks/use-business-data';
import { SplashScreen } from '@/components/splash-screen';

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
      </head>
      <body className="font-body antialiased bg-background text-foreground overflow-x-hidden">
        {/* SplashScreen is placed here to be the first thing rendered in the body */}
        <SplashScreen />
        
        <FirebaseClientProvider>
          <BusinessProvider>
            <SidebarProvider defaultOpen={true}>
              <NavMain />
              <SidebarInset className="max-w-full overflow-hidden">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10 w-full">
                  <SidebarTrigger className="-ml-1" />
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg md:text-xl font-headline font-semibold text-primary truncate">Smart Dashboard</h1>
                  </div>
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
