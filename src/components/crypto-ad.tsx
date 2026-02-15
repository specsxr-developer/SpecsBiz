
"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface CryptoAdProps {
  className?: string
}

/**
 * @fileOverview Dedicated component to display Crypto Ads.
 * It uses a placeholder until the user provides the actual script/iframe code.
 */
export function CryptoAd({ className }: CryptoAdProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className={cn("w-full flex flex-col items-center gap-1", className)}>
      <div className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] mb-1">
        SpecsBiz Partner Ad
      </div>
      <div className="w-full min-h-[50px] bg-accent/5 border border-dashed border-accent/20 rounded-lg flex items-center justify-center overflow-hidden">
        {/* 
          IMPORTANT: Replace the comment below with your A-Ads code.
          Example: <iframe data-aa='12345' src='//ad.a-ads.com/12345?size=320x50' style='width:320px; height:50px; border:0px; padding:0; overflow:hidden; background-color: transparent;'></iframe>
        */}
        <div className="text-[10px] font-bold text-accent/40 italic p-2 text-center leading-tight">
          Waiting for your Ad Code...<br/>
          (Your income starts here)
        </div>
      </div>
    </div>
  )
}
