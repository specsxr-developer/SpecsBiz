
"use client"

import { useEffect, useRef } from 'react'
import { cn } from "@/lib/utils"

interface InventoryAdProps {
  className?: string
}

/**
 * @fileOverview Ad container specifically for Inventory page.
 * Optimized for 320x50 Banner.
 */
export function InventoryAd({ className }: InventoryAdProps) {
  const bannerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Manual injection to force the banner script to execute within this specific container
    if (bannerRef.current && bannerRef.current.childNodes.length === 0) {
      const atOptions = document.createElement('script')
      atOptions.innerHTML = `
        atOptions = {
          'key' : '9c3305cef38420408885e0c5935d7716',
          'format' : 'iframe',
          'height' : 50,
          'width' : 320,
          'params' : {}
        };
      `
      const invoke = document.createElement('script')
      invoke.type = 'text/javascript'
      invoke.src = 'https://www.highperformanceformat.com/9c3305cef38420408885e0c5935d7716/invoke.js'
      
      bannerRef.current.appendChild(atOptions)
      bannerRef.current.appendChild(invoke)
    }
  }, [])

  return (
    <div className={cn("w-full flex flex-col items-center justify-center min-h-[80px] border border-accent/10 rounded-2xl bg-white/30 backdrop-blur-sm relative overflow-hidden", className)}>
      <div className="text-[8px] font-black uppercase text-accent/20 tracking-[0.3em] mb-1">
        Inventory Sponsored Slot
      </div>
      
      <div ref={bannerRef} className="flex items-center justify-center min-h-[50px] w-full overflow-x-auto no-scrollbar" />
    </div>
  )
}
