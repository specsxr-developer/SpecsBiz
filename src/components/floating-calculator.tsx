
"use client"

import { useState, useEffect } from "react"
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
      className={cn("h-12 w-full text-xl font-black rounded-xl transition-all active:scale-95", className)}
    >
      {children}
    </Button>
  )

  return (
    <>
      {/* Floating Toggle Button - Extremely High Z-Index to stay above Dialogs */}
      <div 
        className="fixed bottom-32 right-6 z-[10000] print:hidden pointer-events-auto"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="h-14 w-14 rounded-full shadow-[0_15px_45px_rgba(0,128,128,0.6)] bg-accent hover:bg-accent/90 border-4 border-white animate-in zoom-in duration-300"
          size="icon"
        >
          {isOpen ? <X className="w-7 h-7 text-white" /> : <CalcIcon className="w-7 h-7 text-white" />}
        </Button>
      </div>

      {/* Custom Calculator Popup - Top Layer Priority */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onPointerDown={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        >
          <div 
            className="w-full max-w-[340px] p-6 rounded-[2.5rem] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.3)] border-2 border-accent/10 animate-in zoom-in-95 duration-300 relative pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-accent/10 rounded-xl">
                  <CalcIcon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-base font-black uppercase tracking-tight text-primary">SpecsBiz Calc</h3>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-8 w-8 hover:bg-red-50 hover:text-red-500" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-5">
              <div className="bg-muted/30 p-5 rounded-2xl border-2 border-accent/5 text-right overflow-hidden shadow-inner">
                <p className="text-[11px] font-bold text-accent uppercase tracking-widest h-5 truncate opacity-60">
                  {equation || "Ready"}
                </p>
                <p className="text-4xl font-black text-primary truncate tracking-tighter mt-1">
                  {display}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                <CalcButton onClick={handleClear} variant="ghost" className="text-destructive bg-red-50 hover:bg-red-100 border-none">C</CalcButton>
                <CalcButton onClick={handleBackspace} variant="ghost" className="bg-muted/50 border-none"><Eraser className="w-5 h-5" /></CalcButton>
                <CalcButton onClick={() => handleOperator("/")} className="bg-accent text-white hover:bg-accent/90 border-none">÷</CalcButton>
                <CalcButton onClick={() => handleOperator("*")} className="bg-accent text-white hover:bg-accent/90 border-none">×</CalcButton>

                {[7, 8, 9].map(n => (
                  <CalcButton key={n} onClick={() => handleNumber(n.toString())} className="bg-white border-2 border-muted/20 text-primary shadow-sm">{n}</CalcButton>
                ))}
                <CalcButton onClick={() => handleOperator("-")} className="bg-accent text-white hover:bg-accent/90 border-none">−</CalcButton>

                {[4, 5, 6].map(n => (
                  <CalcButton key={n} onClick={() => handleNumber(n.toString())} className="bg-white border-2 border-muted/20 text-primary shadow-sm">{n}</CalcButton>
                ))}
                <CalcButton onClick={() => handleOperator("+")} className="bg-accent text-white hover:bg-accent/90 border-none">+</CalcButton>

                {[1, 2, 3].map(n => (
                  <CalcButton key={n} onClick={() => handleNumber(n.toString())} className="bg-white border-2 border-muted/20 text-primary shadow-sm">{n}</CalcButton>
                ))}
                <CalcButton onClick={calculate} className="bg-primary hover:bg-primary/90 text-white row-span-2 h-full text-2xl border-none">=</CalcButton>

                <CalcButton onClick={() => handleNumber("0")} className="col-span-2 bg-white border-2 border-muted/20 text-primary shadow-sm">0</CalcButton>
                <CalcButton onClick={() => handleNumber(".")} className="bg-white border-2 border-muted/20 text-primary shadow-sm">.</CalcButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
