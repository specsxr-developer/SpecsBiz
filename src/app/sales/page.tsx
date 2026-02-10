
"use client"

import { useState } from "react"
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
  Inbox
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useBusinessData } from "@/hooks/use-business-data"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export default function SalesPage() {
  const { toast } = useToast()
  const { products, sales, actions, isLoading, currency } = useBusinessData()
  const [cart, setCart] = useState<any[]>([])
  const [search, setSearch] = useState("")

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.id === item.id)
    if (existing) {
      toast({ title: "Already in cart", description: "Adjust quantity or price in the summary panel." })
    } else {
      setCart([...cart, { ...item, quantity: 1 }])
      toast({ title: "Added", description: `${item.name} added to bill.` })
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

  const removeFromCart = (id: string) => {
    setCart(cart.filter(c => c.id !== id))
  }

  const subtotal = cart.reduce((acc, c) => acc + (c.sellingPrice * c.quantity), 0)
  const totalCost = cart.reduce((acc, c) => acc + ((c.purchasePrice || 0) * c.quantity), 0)
  const totalProfit = subtotal - totalCost
  const grandTotal = subtotal

  const handleCheckout = () => {
    actions.addSale({
      total: grandTotal,
      profit: totalProfit,
      items: cart,
    })
    toast({
      title: "Sale Recorded",
      description: `Grand Total: ${currency}${grandTotal.toLocaleString()} | Profit: ${currency}${totalProfit.toLocaleString()}`,
    })
    setCart([])
  }

  if (isLoading) return <div className="p-10 text-center animate-pulse">Loading POS...</div>

  return (
    <div className="grid lg:grid-cols-12 gap-6 animate-in fade-in duration-500 pb-10">
      {/* Product Selection Side */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="border-accent/10 shadow-sm">
          <CardHeader className="p-4 md:p-6 bg-accent/5">
            <CardTitle className="text-primary flex items-center gap-2 text-lg">
              <Receipt className="w-5 h-5 text-accent" /> Product Selection
            </CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search products by name..." 
                className="pl-9 h-11 border-accent/10 focus-visible:ring-accent" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
                <Inbox className="w-10 h-10 opacity-20" />
                <p className="text-sm italic">No products in inventory.</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-350px)] pr-2">
                <div className="grid grid-cols-1 gap-3">
                  {products
                    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
                    .map((item) => (
                    <div key={item.id} className="p-4 border rounded-xl bg-card hover:border-accent hover:shadow-md transition-all flex justify-between items-center group cursor-pointer" onClick={() => addToCart(item)}>
                      <div className="space-y-1 min-w-0 flex-1 mr-2">
                        <p className="font-bold text-primary truncate text-sm md:text-base">{item.name}</p>
                        <p className="text-sm text-accent font-black">{currency}{item.sellingPrice?.toLocaleString()}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                           <Badge variant="outline" className="text-[9px] py-0 px-1 font-bold bg-blue-50/50 border-blue-100 text-blue-700 whitespace-nowrap">
                             Stock: {item.stock} {item.unit}
                           </Badge>
                        </div>
                      </div>
                      <Button 
                        size="icon" 
                        className="bg-accent/10 text-accent hover:bg-accent hover:text-white shrink-0 h-9 w-9 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          addToCart(item)
                        }}
                        disabled={item.stock <= 0}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bill Summary Side (Matches Screenshot) */}
      <div className="lg:col-span-7">
        <Card className="sticky top-20 shadow-2xl border-accent/20 overflow-hidden">
          <CardHeader className="border-b bg-accent/5 p-4 md:p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-accent/10 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-accent" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-primary">Bill Summary</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                  {cart.length} items in current bill
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-6">
            <ScrollArea className="max-h-[calc(100vh-450px)] pr-2">
              {cart.length === 0 ? (
                <div className="text-center py-24 text-muted-foreground italic flex flex-col items-center gap-4">
                  <ShoppingCart className="w-16 h-16 opacity-10" />
                  <p className="text-sm font-medium">Select products from the list to begin billing.</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {cart.map((item) => {
                    const itemTotal = item.sellingPrice * item.quantity;
                    const itemProfit = (item.sellingPrice - (item.purchasePrice || 0)) * item.quantity;
                    const isLoss = itemProfit < 0;
                    
                    return (
                      <div key={item.id} className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-base font-black text-primary leading-tight">{item.name}</h4>
                            <div className="flex items-center gap-2 mt-1 text-[10px] font-bold uppercase tracking-tight">
                              <span className="text-muted-foreground">{item.unit}</span>
                              <span className="text-blue-600">In Stock: {item.stock}</span>
                              <span className="text-orange-600">Buy Price: {currency}{item.purchasePrice || 0}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 transition-colors" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground">Qty ({item.unit})</Label>
                            <Input 
                              type="number" 
                              step="0.01" 
                              className="h-11 bg-[#F0FFFF] border-accent/20 text-lg font-bold focus-visible:ring-accent" 
                              value={item.quantity} 
                              onChange={(e) => updateQuantity(item.id, e.target.value)} 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground">Unit Price ({currency})</Label>
                            <Input 
                              type="number" 
                              step="0.01" 
                              className="h-11 bg-[#F0FFFF] border-accent/20 text-lg font-bold text-accent focus-visible:ring-accent" 
                              value={item.sellingPrice} 
                              onChange={(e) => updateUnitPrice(item.id, e.target.value)} 
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center px-4 py-2.5 bg-muted/30 rounded-xl border border-muted">
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Item Total</span>
                            <span className="text-lg font-black text-primary">{currency}{itemTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className={cn(
                            "flex justify-between items-center px-4 py-2.5 rounded-xl border",
                            isLoss ? "bg-red-50 border-red-100" : "bg-green-50/50 border-green-100"
                          )}>
                            <span className={cn("text-[9px] font-black uppercase tracking-widest", isLoss ? "text-red-600" : "text-green-600")}>
                              {isLoss ? 'Est. Loss' : 'Est. Lav'}
                            </span>
                            <span className={cn("text-base font-black", isLoss ? "text-red-600" : "text-green-600")}>
                              {isLoss ? '-' : '+'}{currency}{Math.abs(itemProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {item.quantity > item.stock && (
                          <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg text-red-600 text-[9px] font-bold border border-red-100 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" /> 
                            Warning: Quantity exceeds current stock!
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {cart.length > 0 && (
              <div className="space-y-6 pt-6 border-t-2 border-dashed border-accent/10">
                <div className="grid grid-cols-2 gap-3">
                   <div className={cn(
                     "p-4 text-white rounded-2xl shadow-lg transition-colors flex flex-col justify-between",
                     totalProfit < 0 ? "bg-destructive" : "bg-emerald-500"
                   )}>
                      <p className="text-[8px] font-black uppercase opacity-80 tracking-widest">{totalProfit < 0 ? 'Total Loss' : 'Total Lav'}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="w-4 h-4 opacity-70" />
                        <span className="text-2xl font-black">{currency}{totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                   </div>
                   <div className="p-4 bg-primary text-white rounded-2xl shadow-lg flex flex-col justify-between items-end text-right">
                      <p className="text-[8px] font-black uppercase opacity-80 tracking-widest">Final Total</p>
                      <p className="text-2xl font-black mt-1">{currency}{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                   </div>
                </div>

                <Button 
                  className="w-full h-16 text-lg bg-teal-700 hover:bg-teal-800 text-white font-black rounded-2xl shadow-2xl transition-all active:scale-95" 
                  onClick={handleCheckout}
                  disabled={cart.some(i => i.quantity <= 0)}
                >
                  <CheckCircle2 className="w-6 h-6 mr-2" /> Complete Sale
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
