"use client"

import { useState, useEffect } from "react"
import { Bot } from "lucide-react"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { cn } from "@/lib/utils"

/**
 * @fileOverview Splash Screen component that displays instantly during the initial app load.
 * Optimised to show before React hydration completes.
 */
export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const logoUrl = PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl

  useEffect(() => {
    // Start fading out after 2.2 seconds
    const timer = setTimeout(() => {
      setIsFadingOut(true)
      // Completely remove from DOM after fade transition (800ms)
      setTimeout(() => setIsVisible(false), 800)
    }, 2200)

    return () => clearTimeout(timer)
  }, [])

  // We don't use a 'mounted' check here to allow SSR to include this HTML
  // so it's visible the moment the browser paints.
  if (!isVisible) return null

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#191970] transition-opacity duration-800 ease-in-out",
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      <div className="flex flex-col items-center gap-6 animate-in zoom-in-95 fade-in duration-700">
        <div className="bg-white/10 p-5 rounded-[2.5rem] backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative">
          <div className="absolute inset-0 rounded-[2.5rem] bg-accent/20 animate-pulse" />
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="SpecsBiz Logo" 
              className="w-28 h-28 object-contain relative z-10" 
              // Added priority loading hint
              loading="eager"
            />
          ) : (
            <Bot className="w-24 h-24 text-white relative z-10" />
          )}
        </div>
        
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-black text-white font-headline tracking-tighter drop-shadow-2xl">
            SpecsBiz
          </h1>
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-accent/40" />
            <p className="text-[11px] font-bold text-accent uppercase tracking-[0.5em] opacity-90 drop-shadow-md">
              by SpecsXR
            </p>
            <span className="h-px w-10 bg-accent/40" />
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-16 flex flex-col items-center gap-4">
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
        </div>
        <span className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] animate-pulse">
          Intelligence Starting...
        </span>
      </div>
    </div>
  )
}
