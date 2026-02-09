import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { NavMain } from "@/components/nav-main";
import { Toaster } from "@/components/ui/toaster";

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
      <body className="font-body antialiased bg-background text-foreground">
        <SidebarProvider defaultOpen={true}>
          <NavMain />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
              <SidebarTrigger className="-ml-1" />
              <div className="flex-1">
                <h1 className="text-xl font-headline font-semibold text-primary">Smart Dashboard</h1>
              </div>
            </header>
            <main className="flex-1 p-6 overflow-x-hidden">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}