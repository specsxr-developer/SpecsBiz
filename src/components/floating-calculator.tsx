
"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Calculator as CalcIcon, Eraser, X, ChevronLeft, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

export function FloatingCalculator() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [expression, setExpression] = useState("0")
  const [history, setHistory] = useState("")
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // CRITICAL FIX: Blur any active input to hide the keyboard when calculator opens
  useEffect(() => {
    if (isOpen && typeof document !== 'undefined') {
      const activeEl = document.activeElement as HTMLElement;
      if (activeEl && typeof activeEl.blur === 'function') {
        activeEl.blur();
      }
    }
  }, [isOpen]);

  if (!mounted || pathname?.startsWith('/shop/')) return null

  const handleNumber = (num: string) => {
    if (expression === "Error" || expression === "0") {
      setExpression(num)
    } else {
      setExpression(expression + num)
    }
  }

  const handleOperator = (op: string) => {
    if (expression === "Error") return
    const lastChar = expression.slice(-1)
    if (["+", "-", "*", "/"].includes(lastChar)) {
      setExpression(expression.slice(0, -1) + op)
    } else {
      setExpression(expression + op)
    }
  }

  const handleAns = () => {
    if (lastResult) {
      if (expression === "0" || expression === "Error") {
        setExpression(lastResult)
      } else {
        const lastChar = expression.slice(-1)
        // If last char is a number, multiply it with Ans automatically for convenience
        if (!["+", "-", "*", "/"].includes(lastChar)) {
          setExpression(expression + "*" + lastResult)
        } else {
          setExpression(expression + lastResult)
        }
      }
    }
  }

  const handleClear = () => {
    setExpression("0")
    setHistory("")
  }

  const handleBackspace = () => {
    if (expression.length > 1 && expression !== "Error") {
      setExpression(expression.slice(0, -1))
    } else {
      setExpression("0")
    }
  }

  const calculate = () => {
    try {
      if (expression === "0" || !expression || expression === "Error") return
      
      // Basic validation to prevent invalid eval
      const cleanExpression = expression.replace(/[^-()\d/*+.]/g, '')
      const result = new Function(`return ${cleanExpression}`)()
      const formattedResult = Number(result.toFixed(4)).toString()
      
      // Logic: Move calculation + result to history line
      setHistory(`${expression} = ${formattedResult}`)
      // Clear main display for new input
      setExpression("0")
      // Store result for 'Ans' button
      setLastResult(formattedResult)
    } catch (e) {
      setExpression("Error")
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
      // FIX: preventDefault on pointer events prevents focus shift and keyboard triggers
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className={cn(
        "h-16 sm:h-18 text-xl sm:text-2xl font-black rounded-2xl transition-all active:scale-90 floating-calc-element shadow-sm border-none",
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
      >
        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="h-16 w-16 md:h-20 md:w-20 rounded-full shadow-[0_20px_50px_rgba(0,128,128,0.6)] bg-accent hover:bg-accent/90 border-4 border-white animate-in zoom-in duration-300 floating-calc-element transition-all active:scale-90"
          size="icon"
        >
          {isOpen ? <X className="w-8 h-8 md:w-10 md:h-10 text-white" /> : <CalcIcon className="w-8 h-8 md:w-10 md:h-10 text-white" />}
        </Button>
      </div>

      {/* Calculator Popup */}
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
            className="w-full max-w-[360px] flex flex-col p-5 rounded-[3rem] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-accent/10 animate-in zoom-in-95 duration-300 relative pointer-events-auto floating-calc-element min-h-[600px]"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-accent/10 rounded-xl">
                  <CalcIcon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">SpecsBiz Partner</h3>
                  <p className="text-[8px] font-bold text-accent uppercase opacity-60">Intelligence Calc</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-10 w-10 hover:bg-red-50 hover:text-red-500 transition-colors" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                onPointerDown={(e) => e.preventDefault()}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Display Area - Significantly Taller */}
            <div className="bg-muted/30 p-8 rounded-[2rem] border border-accent/5 text-right overflow-hidden shadow-inner flex flex-col justify-end min-h-[180px] mb-6 relative">
              <div className="absolute top-6 right-8 left-8 overflow-x-auto scrollbar-none">
                <p className="text-sm font-bold text-accent uppercase tracking-tighter animate-in slide-in-from-top-1 duration-300">
                  {history || "Start Calculation"}
                </p>
              </div>
              
              <div className="w-full overflow-x-auto whitespace-nowrap scrollbar-none mt-6">
                <p className={cn(
                  "font-black text-primary tracking-tighter leading-none transition-all",
                  expression.length > 10 ? "text-4xl" : "text-5xl"
                )}>
                  {expression}
                </p>
              </div>
            </div>

            {/* Buttons Grid - Compact & Solid */}
            <div className="grid grid-cols-4 gap-2 flex-1">
              <CalcButton onClick={handleClear} className="text-destructive bg-red-50 hover:bg-red-100">C</CalcButton>
              <CalcButton onClick={handleBackspace} className="bg-muted/50"><Eraser className="w-6 h-6" /></CalcButton>
              <CalcButton onClick={handleAns} className="bg-accent/5 text-accent text-lg">Ans</CalcButton>
              <CalcButton onClick={() => handleOperator("/")} className="bg-accent/10 text-accent hover:bg-accent hover:text-white text-2xl">÷</CalcButton>

              {[7, 8, 9].map(n => (
                <CalcButton key={n} onClick={() => handleNumber(n.toString())} className="bg-white border-black/5 text-primary shadow-sm">{n}</CalcButton>
              ))}
              <CalcButton onClick={() => handleOperator("*")} className="bg-accent/10 text-accent hover:bg-accent hover:text-white text-2xl">×</CalcButton>

              {[4, 5, 6].map(n => (
                <CalcButton key={n} onClick={() => handleNumber(n.toString())} className="bg-white border-black/5 text-primary shadow-sm">{n}</CalcButton>
              ))}
              <CalcButton onClick={() => handleOperator("-")} className="bg-accent/10 text-accent hover:bg-accent hover:text-white text-3xl">−</CalcButton>

              {[1, 2, 3].map(n => (
                <CalcButton key={n} onClick={() => handleNumber(n.toString())} className="bg-white border-black/5 text-primary shadow-sm">{n}</CalcButton>
              ))}
              <CalcButton onClick={() => handleOperator("+")} className="bg-accent/10 text-accent hover:bg-accent hover:text-white text-2xl">+</CalcButton>

              <CalcButton onClick={() => handleNumber("0")} className="bg-white border-black/5 text-primary shadow-sm">0</CalcButton>
              <CalcButton onClick={() => handleNumber(".")} className="bg-white border-black/5 text-primary shadow-sm">.</CalcButton>
              <CalcButton onClick={calculate} className="col-span-2 bg-primary hover:bg-primary/90 text-white text-4xl shadow-xl active:scale-95">=</CalcButton>
            </div>
            
            {/* Bottom Decoration */}
            <div className="mt-6 flex justify-center">
              <div className="h-1.5 w-16 bg-muted rounded-full" />
            </div>
          </div>
        </div>
      )}
    </>
  );

  return typeof document !== 'undefined' ? createPortal(calculatorContent, document.body) : null;
}
