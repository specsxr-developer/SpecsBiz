
"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Calculator as CalcIcon, Eraser, X, ChevronLeft, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function FloatingCalculator() {
  const [isOpen, setIsOpen] = useState(false)
  const [expression, setExpression] = useState("0")
  const [history, setHistory] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleNumber = (num: string) => {
    // If a result was just calculated, start fresh
    if (expression === "Error") {
      setExpression(num)
    } else if (expression === "0") {
      setExpression(num)
    } else {
      setExpression(expression + num)
    }
  }

  const handleOperator = (op: string) => {
    if (expression === "Error") return
    const lastChar = expression.slice(-1)
    // Avoid double operators
    if (["+", "-", "*", "/"].includes(lastChar)) {
      setExpression(expression.slice(0, -1) + op)
    } else {
      setExpression(expression + op)
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
      if (expression === "0" || !expression) return
      
      // Save current expression to history before calculating
      setHistory(expression)
      
      // Use Function constructor for a safer alternative to eval
      const result = new Function(`return ${expression.replace(/[^-()\d/*+.]/g, '')}`)()
      setExpression(Number(result.toFixed(4)).toString())
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
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className={cn(
        "h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-3xl transition-all active:scale-90 floating-calc-element shadow-sm",
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

      {/* Calculator Popup - Optimized for Portrait Mobile (Extra Tall) */}
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
            className="w-full max-w-[360px] min-h-[650px] sm:min-h-[700px] flex flex-col p-6 sm:p-8 rounded-[3rem] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.6)] border-2 border-accent/20 animate-in zoom-in-95 duration-300 relative pointer-events-auto floating-calc-element"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-accent/10 rounded-2xl">
                  <CalcIcon className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">SpecsBiz Intelligence</h3>
                  <p className="text-[8px] font-bold text-accent uppercase opacity-60">Smart Pocket Calculator</p>
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
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Display Area - Extra Tall & Integrated History */}
            <div className="bg-muted/40 p-8 rounded-[2.5rem] border-2 border-accent/5 text-right overflow-hidden shadow-inner flex flex-col justify-end min-h-[180px] mb-8 relative">
              {history ? (
                <p className="text-sm font-bold text-muted-foreground/40 uppercase tracking-widest mb-2 animate-in slide-in-from-top-2 duration-500 truncate">
                  {history} =
                </p>
              ) : (
                <div className="absolute top-6 right-8 flex items-center gap-1.5 opacity-20">
                  <History className="w-3 h-3" />
                  <span className="text-[8px] font-black uppercase tracking-widest">No History</span>
                </div>
              )}
              
              <div className="w-full overflow-x-auto whitespace-nowrap scrollbar-none">
                <p className={cn(
                  "font-black text-primary tracking-tighter leading-none transition-all",
                  expression.length > 10 ? "text-4xl" : "text-5xl"
                )}>
                  {expression}
                </p>
              </div>
              <div className="mt-2 flex justify-end">
                <span className="h-1 w-12 bg-accent/20 rounded-full" />
              </div>
            </div>

            {/* Buttons Grid - Flex-1 to fill the tall container */}
            <div className="grid grid-cols-4 gap-4 flex-1">
              <CalcButton onClick={handleClear} variant="ghost" className="text-destructive bg-red-50 hover:bg-red-100 border-none">C</CalcButton>
              <CalcButton onClick={handleBackspace} variant="ghost" className="bg-muted/50 border-none"><Eraser className="w-6 h-6" /></CalcButton>
              <CalcButton onClick={() => handleOperator("/")} className="bg-accent/10 text-accent hover:bg-accent hover:text-white border-none text-2xl">÷</CalcButton>
              <CalcButton onClick={() => handleOperator("*")} className="bg-accent/10 text-accent hover:bg-accent hover:text-white border-none text-2xl">×</CalcButton>

              {[7, 8, 9].map(n => (
                <CalcButton key={n} onClick={() => handleNumber(n.toString())} className="bg-white border-2 border-muted/20 text-primary shadow-sm">{n}</CalcButton>
              ))}
              <CalcButton onClick={() => handleOperator("-")} className="bg-accent/10 text-accent hover:bg-accent hover:text-white border-none text-3xl">−</CalcButton>

              {[4, 5, 6].map(n => (
                <CalcButton key={n} onClick={() => handleNumber(n.toString())} className="bg-white border-2 border-muted/20 text-primary shadow-sm">{n}</CalcButton>
              ))}
              <CalcButton onClick={() => handleOperator("+")} className="bg-accent/10 text-accent hover:bg-accent hover:text-white border-none text-2xl">+</CalcButton>

              {[1, 2, 3].map(n => (
                <CalcButton key={n} onClick={() => handleNumber(n.toString())} className="bg-white border-2 border-muted/20 text-primary shadow-sm">{n}</CalcButton>
              ))}
              <CalcButton onClick={calculate} className="bg-primary hover:bg-primary/90 text-white row-span-2 h-full text-4xl border-none shadow-xl active:scale-95">=</CalcButton>

              <CalcButton onClick={() => handleNumber("0")} className="col-span-2 bg-white border-2 border-muted/20 text-primary shadow-sm">0</CalcButton>
              <CalcButton onClick={() => handleNumber(".")} className="bg-white border-2 border-muted/20 text-primary shadow-sm">.</CalcButton>
            </div>
            
            {/* Bottom Decoration */}
            <div className="mt-6 flex justify-center">
              <div className="h-1.5 w-20 bg-muted rounded-full" />
            </div>
          </div>
        </div>
      )}
    </>
  );

  return typeof document !== 'undefined' ? createPortal(calculatorContent, document.body) : null;
}
