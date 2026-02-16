
"use client"

import Script from 'next/script'
import { cn } from "@/lib/utils"

interface CryptoAdProps {
  className?: string
}

/**
 * @fileOverview Updated to use Adsterra Social Bar script.
 * The Social Bar is a high-earning ad format that appears automatically.
 */
export function CryptoAd({ className }: CryptoAdProps) {
  return (
    <div className={cn("w-full flex flex-col items-center", className)}>
      <div className="text-[8px] font-black uppercase text-muted-foreground/30 tracking-[0.4em] mb-2">
        SpecsBiz Official Partner
      </div>
      
      {/* 
        Adsterra Social Bar Script 
        Note: This is a high-performance script that loads the ad automatically.
      */}
      <Script 
        src="https://pl28723496.effectivegatecpm.com/d6/33/01/d6330149d0bc87e70e5ea439b64ec493.js" 
        strategy="afterInteractive"
      />
    </div>
  )
}
