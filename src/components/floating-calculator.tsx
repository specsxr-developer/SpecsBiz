
"use client"

import { useState, useEffect } from "react"
import { Calculator as CalcIcon, X, Delete, DeleteIcon, Eraser } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
      // Using Function constructor as a safer alternative to eval for simple math
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
      onClick={onClick}
      className={cn("h-12 w-full text-lg font-bold rounded-xl", className)}
    >
      {children}
    </Button>
  )

  return (
    <>
      {/* Floating Toggle Button - Super High Z-Index and Event Stop Propagation */}
      <div 
        className="fixed bottom-6 right-6 z-[10001] print:hidden"
        onPointerDown={(e) => e.stopPropagation()} // Prevents closing of background Dialogs on click
      >
        <Button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className="h-12 w-12 rounded-full shadow-[0_10px_30px_rgba(0,128,128,0.4)] bg-accent hover:bg-accent/90 border-2 border-white animate-in zoom-in duration-300"
          size="icon"
        >
          <CalcIcon className="w-6 h-6 text-white" />
        </Button>
      </div>

      {/* Calculator Popup - Z-index set to be on top of everything */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className="w-[90vw] max-w-[320px] p-4 rounded-[2rem] gap-4 border-accent/20 shadow-2xl z-[10002]"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <DialogHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-accent/10 rounded-lg">
                <CalcIcon className="w-4 h-4 text-accent" />
              </div>
              <DialogTitle className="text-sm font-black uppercase tracking-tight text-primary">Smart Calc</DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Display Area */}
            <div className="bg-muted/30 p-4 rounded-2xl border border-accent/5 text-right overflow-hidden">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest h-4 truncate">
                {equation}
              </p>
              <p className="text-3xl font-black text-primary truncate tracking-tighter">
                {display}
              </p>
            </div>

            {/* Buttons Grid */}
            <div className="grid grid-cols-4 gap-2">
              <CalcButton onClick={handleClear} variant="ghost" className="text-destructive">C</CalcButton>
              <CalcButton onClick={handleBackspace} variant="ghost"><Eraser className="w-5 h-5" /></CalcButton>
              <CalcButton onClick={() => handleOperator("/")} variant="secondary" className="text-accent">÷</CalcButton>
              <CalcButton onClick={() => handleOperator("*")} variant="secondary" className="text-accent">×</CalcButton>

              {[7, 8, 9].map(n => (
                <CalcButton key={n} onClick={() => handleNumber(n.toString())}>{n}</CalcButton>
              ))}
              <CalcButton onClick={() => handleOperator("-")} variant="secondary" className="text-accent">−</CalcButton>

              {[4, 5, 6].map(n => (
                <CalcButton key={n} onClick={() => handleNumber(n.toString())}>{n}</CalcButton>
              ))}
              <CalcButton onClick={() => handleOperator("+")} variant="secondary" className="text-accent">+</CalcButton>

              {[1, 2, 3].map(n => (
                <CalcButton key={n} onClick={() => handleNumber(n.toString())}>{n}</CalcButton>
              ))}
              <CalcButton onClick={calculate} className="bg-primary hover:bg-primary/90 text-white row-span-2 h-full">=</CalcButton>

              <CalcButton onClick={() => handleNumber("0")} className="col-span-2">0</CalcButton>
              <CalcButton onClick={() => handleNumber(".")}>.</CalcButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
