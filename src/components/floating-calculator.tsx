
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
      className={cn(
        "h-14 md:h-16 w-full text-2xl md:text-3xl font-black rounded-2xl transition-all active:scale-90 floating-calc-element shadow-sm",
        className
      )}
    >
      {children}
    </Button>
  )

  const calculatorContent = (
    <>
      {/* Floating Toggle Button */}
      <div 
        className="fixed bottom-40 md:bottom-48 right-6 md:right-8 z-[10001] print:hidden pointer-events-auto floating-calc-element"
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
          className="h-16 w-16 md:h-20 md:w-20 rounded-full shadow-[0_20px_50px_rgba(0,128,128,0.6)] bg-accent hover:bg-accent/90 border-4 border-white animate-in zoom-in duration-300 floating-calc-element transition-all active:scale-90"
          size="icon"
        >
          {isOpen ? <X className="w-8 h-8 md:w-10 md:h-10 text-white" /> : <CalcIcon className="w-8 h-8 md:w-10 md:h-10 text-white" />}
        </Button>
      </div>

      {/* Calculator Popup - Optimized for Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 floating-calc-element"
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).classList.contains('bg-black/70')) {
              setIsOpen(false);
            }
          }}
        >
          <div 
            className="w-[92vw] max-w-[380px] p-5 md:p-8 rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.6)] border-2 border-accent/20 animate-in zoom-in-95 duration-300 relative pointer-events-auto floating-calc-element"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-accent/10 rounded-xl">
                  <CalcIcon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-sm md:text-base font-black uppercase tracking-widest text-primary">SpecsBiz Calc</h3>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-10 w-10 md:h-12 md:w-12 hover:bg-red-50 hover:text-red-500 transition-colors" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
              >
                <X className="w-6 h-6 md:w-8 md:h-8" />
              </Button>
            </div>

            <div className="space-y-6 md:space-y-8">
              <div className="bg-muted/40 p-6 md:p-8 rounded-3xl border-2 border-accent/10 text-right overflow-hidden shadow-inner flex flex-col justify-end min-h-[120px]">
                <p className="text-[14px] md:text-[16px] font-bold text-accent uppercase tracking-widest h-6 truncate opacity-70 mb-2">
                  {equation || "Master Calculator"}
                </p>
                <p className="text-5xl md:text-6xl font-black text-primary truncate tracking-tighter">
                  {display}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-3 md:gap-4">
                <CalcButton onClick={handleClear} variant="ghost" className="text-destructive bg-red-50 hover:bg-red-100 border-none">C</CalcButton>
                <CalcButton onClick={handleBackspace} variant="ghost" className="bg-muted/50 border-none"><Eraser className="w-6 h-6 md:w-8 md:h-8" /></CalcButton>
                <CalcButton onClick={() => handleOperator("/")} className="bg-accent text-white hover:bg-accent/90 border-none">÷</CalcButton>
                <CalcButton onClick={() => handleOperator("*")} className="bg-accent text-white hover:bg-accent/90 border-none">×</CalcButton>

                {[7, 8, 9].map(n => (
                  <CalcButton key={n} onClick={() => handleNumber(n.toString())} className="bg-white border-2 border-muted/30 text-primary shadow-sm">{n}</CalcButton>
                ))}
                <CalcButton onClick={() => handleOperator("-")} className="bg-accent text-white hover:bg-accent/90 border-none">−</CalcButton>

                {[4, 5, 6].map(n => (
                  <CalcButton key={n} onClick={() => handleNumber(n.toString())} className="bg-white border-2 border-muted/30 text-primary shadow-sm">{n}</CalcButton>
                ))}
                <CalcButton onClick={() => handleOperator("+")} className="bg-accent text-white hover:bg-accent/90 border-none">+</CalcButton>

                {[1, 2, 3].map(n => (
                  <CalcButton key={n} onClick={() => handleNumber(n.toString())} className="bg-white border-2 border-muted/30 text-primary shadow-sm">{n}</CalcButton>
                ))}
                <CalcButton onClick={calculate} className="bg-primary hover:bg-primary/90 text-white row-span-2 h-full text-4xl md:text-5xl border-none shadow-lg">=</CalcButton>

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
