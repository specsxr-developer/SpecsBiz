
"use client"

import { useState, useMemo, useEffect } from "react"
import { 
  ShoppingCart, 
  Search, 
  Trash2, 
  Plus, 
  CheckCircle2,
  Clock,
  Receipt,
  AlertTriangle,
  TrendingUp,
  Inbox,
  X,
  FileText,
  Tag,
  DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useBusinessData } from "@/hooks/use-business-data"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"

export default function SalesPage() {
  const { toast } = useToast()
  const { products, sales, actions, isLoading, currency, language } = useBusinessData()
  const t = translations[language]
  
  const [cart, setCart] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [isAnimate, setIsAnimate] = useState(false)

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.id === item.id)
    if (existing) {
      toast({ title: language === 'en' ? "Already in cart" : "ইতিমধ্যেই কার্টে আছে" })
    } else {
      setCart([...cart, { ...item, quantity: 1, selectedUnit: item.unit }])
      toast({ title: language === 'en' ? "Added to list" : "তালিকায় যোগ করা হয়েছে" })
      
      // Trigger animation for the header button
      setIsAnimate(true)
      setTimeout(() => setIsAnimate(false), 600)
    }
  }

  const updateQuantity = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0
    setCart(cart.map(c => c.id === id ? { ...c, quantity: numValue } : c))
  }

  const updateUnitPrice = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0
    setCart(cart.map(c => c.id === id ? { ...c, sellingPrice: numValue } : c))
  }

  const updateSelectedUnit = (id: string, unit: string) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        let newQty = c.quantity;
        if (c.selectedUnit === 'kg' && unit === 'gm') newQty = c.quantity * 1000;
        if (c.selectedUnit === 'gm' && unit === 'kg') newQty = c.quantity / 1000;
        return { ...c, selectedUnit: unit, quantity: newQty };
      }
      return c;
    }))
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter(c => c.id !== id))
  }

  const cartSummary = useMemo(() => {
    let subtotal = 0;
    let totalCost = 0;
    
    const normalizedItems = cart.map(item => {
      let factor = 1;
      if (item.unit === 'kg' && item.selectedUnit === 'gm') factor = 0.001;
      if (item.unit === 'gm' && item.selectedUnit === 'kg') factor = 1000;
      
      const effectiveQty = item.quantity * factor;
      const currentPrice = item.sellingPrice;
      const buyPrice = item.purchasePrice || 0;
      
      const itemTotal = currentPrice * effectiveQty;
      const itemCost = buyPrice * effectiveQty;
      
      subtotal += itemTotal;
      totalCost += itemCost;
      
      return { ...item, quantity: effectiveQty };
    });

    return {
      subtotal,
      totalProfit: subtotal - totalCost,
      normalizedItems
    };
  }, [cart]);

  const handleCheckout = () => {
    actions.addSale({
      total: cartSummary.subtotal,
      profit: cartSummary.totalProfit,
      items: cartSummary.normalizedItems,
    })
    toast({
      title: language === 'en' ? "Sale Recorded" : "বিক্রয় সম্পন্ন হয়েছে",
      description: `${t.finalTotal}: ${currency}${cartSummary.subtotal.toLocaleString()}`,
    })
    setCart([])
    setIsSummaryOpen(false)
  }

  if (isLoading) return <div className="p-10 text-center animate-pulse text-accent font-bold">{t.loading}</div>

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Product Selection Header with Header Checkout */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 z-20 bg-background/80 backdrop-blur-md py-3 -mx-2 px-2 border-b border-accent/10">
        <div className="flex-1">
          <h2 className="text-2xl font-black font-headline text-primary flex items-center gap-2">
            <Receipt className="w-6 h-6 text-accent" /> {language === 'en' ? 'Quick Sale' : 'দ্রুত বিক্রয়'}
          </h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-60">Select products to generate bill</p>
        </div>

        <Button 
          disabled={cart.length === 0}
          onClick={() => setIsSummaryOpen(true)}
          className={cn(
            "h-14 px-8 rounded-2xl font-black uppercase text-sm transition-all shadow-xl flex items-center gap-3 border-2",
            cart.length > 0 
              ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-400" 
              : "bg-muted text-muted-foreground border-transparent opacity-50 cursor-not-allowed",
            isAnimate && "animate-tada"
          )}
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            {cart.length > 0 && (
              <Badge className="absolute -top-3 -right-3 h-6 w-6 p-0 flex items-center justify-center bg-red-500 border-2 border-white text-[10px] font-black rounded-full shadow-lg">
                {cart.length}
              </Badge>
            )}
          </div>
          {language === 'en' ? 'Pay Bill' : 'বিল পরিশোধ'}
        </Button>

        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder={t.searchInventory} 
            className="pl-9 h-11 border-accent/10 focus-visible:ring-accent bg-white shadow-sm rounded-xl" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Full Width Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products
          .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
          .map((item) => {
            const profitPerUnit = (item.sellingPrice || 0) - (item.purchasePrice || 0);
            return (
              <Card 
                key={item.id} 
                className="border-accent/10 hover:border-accent hover:shadow-xl transition-all cursor-pointer group active:scale-[0.98] overflow-hidden bg-white"
                onClick={() => addToCart(item)}
              >
                <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden border shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <Tag className="w-5 h-5 opacity-20" />
                          )}
                        </div>
                        <p className="font-black text-primary text-sm md:text-base leading-tight truncate">{item.name}</p>
                      </div>
                      <Badge variant="outline" className="text-[8px] py-0 px-1 font-bold bg-blue-50 border-blue-100 text-blue-700 shrink-0">
                        {t.stock}: {item.stock} {item.unit}
                      </Badge>
                    </div>
                    <p className="text-[9px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" /> {item.category || 'General'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/30 p-2 rounded-xl border border-black/5">
                      <p className="text-[8px] font-bold text-muted-foreground uppercase mb-0.5">{t.sellPrice}</p>
                      <p className="text-sm font-black text-primary">{currency}{item.sellingPrice?.toLocaleString()}</p>
                    </div>
                    <div className="bg-orange-50/50 p-2 rounded-xl border border-orange-100/50">
                      <p className="text-[8px] font-bold text-orange-600 uppercase mb-0.5">{t.buyPrice}</p>
                      <p className="text-sm font-black text-orange-700">{currency}{item.purchasePrice || 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <div className="h-6 w-6 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-emerald-600 uppercase leading-none">Profit/Unit</p>
                        <p className="text-[10px] font-black text-emerald-700">+{currency}{profitPerUnit.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="h-9 w-9 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
                      <Plus className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        {products.length === 0 && (
          <div className="col-span-full py-24 text-center text-muted-foreground opacity-30 italic flex flex-col items-center gap-4">
            <Inbox className="w-16 h-16" />
            <p>{t.noData}</p>
          </div>
        )}
      </div>

      {/* Bill Summary Popup */}
      <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[600px] p-0 overflow-hidden border-accent/20 shadow-2xl rounded-3xl">
          <DialogHeader className="p-6 bg-accent/5 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-xl">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black text-primary">{t.billSummary}</DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                    {cart.length} {t.itemsInBill}
                  </DialogDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white/50 hover:bg-destructive hover:text-white transition-all shadow-sm" onClick={() => setIsSummaryOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="p-6 space-y-8">
              {cart.map((item) => {
                const isWeightBased = item.unit === 'kg' || item.unit === 'gm';
                const displayUnit = item.selectedUnit || item.unit;
                
                let factor = 1;
                if (item.unit === 'kg' && displayUnit === 'gm') factor = 0.001;
                if (item.unit === 'gm' && displayUnit === 'kg') factor = 1000;

                const effectiveQty = item.quantity * factor;
                const itemTotal = item.sellingPrice * item.quantity; // Price is already for the current unit
                const itemProfit = (item.sellingPrice - (item.purchasePrice || 0)) * effectiveQty;
                const isLoss = itemProfit < 0;
                
                return (
                  <div key={item.id} className="space-y-4 pb-6 border-b border-black/5 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base font-black text-primary leading-tight truncate">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-bold uppercase tracking-tight">
                          <span className="text-blue-600 bg-blue-50 px-1.5 rounded">{t.stock}: {item.stock} {item.unit}</span>
                          <span className="text-orange-600 bg-orange-50 px-1.5 rounded">{t.buyPrice}: {currency}{item.purchasePrice || 0}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors shrink-0" onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground">Qty</Label>
                          {isWeightBased && (
                            <div className="flex gap-1">
                              <button 
                                onClick={() => updateSelectedUnit(item.id, 'kg')}
                                className={cn("text-[8px] px-1.5 py-0.5 rounded border font-black uppercase", displayUnit === 'kg' ? "bg-accent text-white border-accent" : "bg-white text-accent border-accent/20")}
                              >KG</button>
                              <button 
                                onClick={() => updateSelectedUnit(item.id, 'gm')}
                                className={cn("text-[8px] px-1.5 py-0.5 rounded border font-black uppercase", displayUnit === 'gm' ? "bg-accent text-white border-accent" : "bg-white text-accent border-accent/20")}
                              >GM</button>
                            </div>
                          )}
                        </div>
                        <Input 
                          type="number" 
                          step="0.01" 
                          className="h-11 bg-accent/5 border-accent/10 text-lg font-black" 
                          value={item.quantity} 
                          onChange={(e) => updateQuantity(item.id, e.target.value)} 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Unit Price</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          className="h-11 bg-accent/5 border-accent/10 text-lg font-black text-accent" 
                          value={item.sellingPrice} 
                          onChange={(e) => updateUnitPrice(item.id, e.target.value)} 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Amount (৳)</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          className="h-11 bg-emerald-50/50 border-emerald-100 text-lg font-black text-emerald-700" 
                          placeholder="৳"
                          value={(item.quantity * item.sellingPrice) || ""}
                          onChange={(e) => {
                            const amt = parseFloat(e.target.value) || 0;
                            const newQty = amt / (item.sellingPrice || 1);
                            updateQuantity(item.id, newQty.toString());
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <div className="flex-1 px-4 py-2.5 bg-muted/30 rounded-xl border border-muted flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase text-muted-foreground">{language === 'en' ? 'Item Total' : 'মোট বিল'}</span>
                        <span className="text-sm font-black text-primary">{currency}{(item.quantity * item.sellingPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className={cn(
                        "flex-1 px-4 py-2.5 rounded-xl border flex justify-between items-center",
                        isLoss ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"
                      )}>
                        <span className={cn("text-[9px] font-black uppercase", isLoss ? "text-red-600" : "text-emerald-600")}>
                          {isLoss ? 'Loss' : 'Lav'}
                        </span>
                        <span className={cn("text-sm font-black", isLoss ? "text-red-600" : "text-emerald-700")}>
                          {isLoss ? '-' : '+'}{currency}{Math.abs(itemProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="p-6 bg-muted/20 border-t space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div className={cn(
                 "p-4 text-white rounded-2xl shadow-lg flex flex-col justify-between",
                 cartSummary.totalProfit < 0 ? "bg-destructive" : "bg-emerald-600"
               )}>
                  <p className="text-[8px] font-black uppercase opacity-80 tracking-widest">{cartSummary.totalProfit < 0 ? (language === 'en' ? 'Total Loss' : 'মোট লস') : language === 'bn' ? 'মোট লাভ' : 'Total Profit'}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-4 h-4 opacity-70" />
                    <span className="text-2xl font-black">{currency}{cartSummary.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
               </div>
               <div className="p-4 bg-primary text-white rounded-2xl shadow-lg flex flex-col justify-between items-end text-right">
                  <p className="text-[8px] font-black uppercase opacity-80 tracking-widest">{t.finalTotal}</p>
                  <p className="text-2xl font-black mt-1">{currency}{cartSummary.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
               </div>
            </div>

            <Button 
              className="w-full h-16 text-lg bg-teal-700 hover:bg-teal-800 text-white font-black rounded-2xl shadow-2xl transition-all active:scale-95 gap-3" 
              onClick={handleCheckout}
              disabled={cart.some(i => i.quantity <= 0)}
            >
              <CheckCircle2 className="w-6 h-6" /> {t.completeSale}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
