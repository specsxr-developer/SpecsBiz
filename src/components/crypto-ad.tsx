
"use client"

import Script from 'next/script'
import { cn } from "@/lib/utils"

interface CryptoAdProps {
  className?: string
}

/**
 * @fileOverview Ad container component.
 * This component now handles both:
 * 1. The Social Bar (floating overlay)
 * 2. The 320x50 Banner (fixed inside the slot)
 */
export function CryptoAd({ className }: CryptoAdProps) {
  return (
    <div className={cn("w-full flex flex-col items-center justify-center min-h-[110px] border-2 border-dashed border-accent/20 rounded-[2.5rem] bg-accent/5 transition-all hover:bg-accent/10 relative overflow-hidden", className)}>
      <div className="text-[9px] font-black uppercase text-accent/30 tracking-[0.5em] mb-2">
        SpecsBiz Partner Slot
      </div>
      
      {/* 
        1. ADSTERRA SOCIAL BAR (Floating Ad)
        This will appear as an overlay on the screen.
      */}
      <Script 
        src="https://pl28723496.effectivegatecpm.com/d6/33/01/d6330149d0bc87e70e5ea439b64ec493.js" 
        strategy="afterInteractive"
      />

      {/* 
        2. ADSTERRA 320x50 BANNER (Fixed Ad)
        This will appear specifically inside this box.
      */}
      <div className="flex items-center justify-center min-h-[50px] w-full">
        <Script id="adsterra-banner-config" strategy="afterInteractive">
          {`
            window.atOptions = {
              'key' : '9c3305cef38420408885e0c5935d7716',
              'format' : 'iframe',
              'height' : 50,
              'width' : 320,
              'params' : {}
            };
          `}
        </Script>
        <Script 
          src="https://www.highperformanceformat.com/9c3305cef38420408885e0c5935d7716/invoke.js" 
          strategy="afterInteractive"
        />
      </div>
      
      <div className="mt-2 text-[7px] font-bold text-muted-foreground/30 uppercase tracking-widest">
        Live Verified Revenue Stream
      </div>
    </div>
  )
}
