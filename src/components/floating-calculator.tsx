"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Calculator as CalcIcon, Eraser, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function FloatingCalculator() {
  const [isOpen, setIsOpen] = useState(false)
  const [display, setDisplay] = useState("0")
  const [equation, setEquation] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleNumber = (num: string) => {
    if (display === "0") {
      setDisplay(num)
    } else {
      setDisplay(display + num)
    }
  }

  const handleOperator = (op: string) => {
    setEquation(display + " " + op + " ")
    setDisplay("0")
  }

  const handleClear = () => {
    setDisplay("0")
    setEquation("")
  }

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1))
    } else {
      setDisplay("0")
    }
  }

  const calculate = () => {
    try {
      const fullEquation = equation + display
      const result = new Function(`return ${fullEquation}`)()
      setDisplay(Number(result.toFixed(4)).toString())
      setEquation("")
    } catch (e) {
      setDisplay("Error")
    }
  }

  const CalcButton = ({ children, onClick, variant = "outline", className = "" }: any) => (
    <Button
      variant={variant}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className={cn("h-12 w-full text-xl font-black rounded-xl transition-all active:scale-95 floating-calc-element", className)}
    >
      {children}
    </Button>
  )

  const calculatorContent = (
    <>
      {/* Floating Toggle Button - MOVED HIGHER to bottom-48 to avoid overlapping input bars */}
      <div 
        className="fixed bottom-48 right-8 z-[10001] print:hidden pointer-events-auto floating-calc-element"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="h-16 w-16 rounded-full shadow-[0_20px_50px_rgba(0,128,128,0.6)] bg-accent hover:bg-accent/90 border-4 border-white animate-in zoom-in duration-300 floating-calc-element transition-all active:scale-90"
          size="icon"
        >
          {isOpen ? <X className="w-8 h-8 text-white" /> : <CalcIcon className="w-8 h-8 text-white" />}
        </Button>
      </div>

      {/* Calculator Popup - Top Layer Priority */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 floating-calc-element"
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).classList.contains('bg-black/60')) {
              setIsOpen(false);
            }
          }}
        >
          <div 
            className="w-full max-w-[340px] p-6 rounded-[3rem] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.5)] border-2 border-accent/20 animate-in zoom-in-95 duration-300 relative pointer-events-auto floating-calc-element"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-accent/10 rounded-xl">
                  <CalcIcon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-base font-black uppercase tracking-tight text-primary">SpecsBiz Master Calc</h3>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-10 w-10 hover:bg-red-50 hover:text-red-500 transition-colors" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            <div className="space-y-5">
              <div className="bg-muted/40 p-6 rounded-2xl border-2 border-accent/10 text-right overflow-hidden shadow-inner">
                <p className="text-[12px] font-bold text-accent uppercase tracking-widest h-5 truncate opacity-70">
                  {equation || "Ready to calculate"}
                </p>
                <p className="text-5xl font-black text-primary truncate tracking-tighter mt-2">
                  {display}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <CalcButton onClick={handleClear} variant="ghost" className="text-destructive bg-red-50 hover:bg-red-100 border-none font-black">C</CalcButton>
                <CalcButton onClick={handleBackspace} variant="ghost" className="bg-muted/50 border-none"><Eraser className="w-5 h-5" /></CalcButton>
                <CalcButton onClick={() => handleOperator("/")} className="bg-accent text-white hover:bg-accent/90 border-none text-2xl">÷</CalcButton>
                <CalcButton onClick={() => handleOperator("*")} className="bg-accent text-white hover:bg-accent/90 border-none text-2xl">×</CalcButton>

                {[7, 8, 9].map(n => (
                  <CalcButton key={n} onClick={() => handleNumber(n.toString())} className="bg-white border-2 border-muted/30 text-primary shadow-sm">{n}</CalcButton>
                ))}
                <CalcButton onClick={() => handleOperator("-")} className="bg-accent text-white hover:bg-accent/90 border-none text-2xl">−</CalcButton>

                {[4, 5, 6].map(n => (
                  <CalcButton key={n} onClick={() => handleNumber(n.toString())} className="bg-white border-2 border-muted/30 text-primary shadow-sm">{n}</CalcButton>
                ))}
                <CalcButton onClick={() => handleOperator("+")} className="bg-accent text-white hover:bg-accent/90 border-none text-2xl">+</CalcButton>

                {[1, 2, 3].map(n => (
                  <CalcButton key={n} onClick={() => handleNumber(n.toString())} className="bg-white border-2 border-muted/30 text-primary shadow-sm">{n}</CalcButton>
                ))}
                <CalcButton onClick={calculate} className="bg-primary hover:bg-primary/90 text-white row-span-2 h-full text-3xl border-none">=</CalcButton>

                <CalcButton onClick={() => handleNumber("0")} className="col-span-2 bg-white border-2 border-muted/30 text-primary shadow-sm">0</CalcButton>
                <CalcButton onClick={() => handleNumber(".")} className="bg-white border-2 border-muted/30 text-primary shadow-sm">.</CalcButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return typeof document !== 'undefined' ? createPortal(calculatorContent, document.body) : null;
}
