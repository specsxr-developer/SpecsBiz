
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
      description: `Grand Total: ${currency}${grandTotal.toFixed(2)} | Profit: ${currency}${totalProfit.toFixed(2)}`,
    })
    setCart([])
  }

  if (isLoading) return <div className="p-10 text-center animate-pulse">Loading POS...</div>

  return (
    <div className="grid lg:grid-cols-12 gap-6 animate-in fade-in duration-500 pb-10">
      <div className="lg:col-span-7 space-y-6">
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-primary flex items-center gap-2">
              <Receipt className="w-5 h-5 text-accent" /> Product Selection
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search products by name..." 
                className="pl-9 h-11" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
                <Inbox className="w-10 h-10 opacity-20" />
                <p className="text-sm italic">No products in inventory.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products
                  .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
                  .map((item) => (
                  <div key={item.id} className="p-4 border rounded-xl bg-card hover:border-accent transition-all flex justify-between items-center group shadow-sm" onClick={() => addToCart(item)}>
                    <div className="space-y-1 min-w-0 flex-1 mr-2">
                      <p className="font-bold text-primary truncate text-sm md:text-base">{item.name}</p>
                      <p className="text-sm text-accent font-black">{currency}{item.sellingPrice?.toFixed(2)} <span className="text-[10px] text-muted-foreground font-normal">per {item.unit}</span></p>
                      <div className="flex items-center gap-2 flex-wrap">
                         <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal bg-blue-50/50 whitespace-nowrap">
                           Stock: {item.stock} {item.unit}
                         </Badge>
                         <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal bg-green-50/50 text-green-700 whitespace-nowrap">
                           Buy: {currency}{item.purchasePrice || 0}
                         </Badge>
                      </div>
                    </div>
                    <Button 
                      size="icon" 
                      className="bg-accent/10 text-accent hover:bg-accent hover:text-white shrink-0 h-9 w-9"
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
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-xs font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
              <Clock className="w-4 h-4" /> Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {sales.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground italic text-sm">No sales recorded yet.</div>
            ) : (
              <div className="divide-y">
                {sales.slice(0, 5).map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-4 hover:bg-muted/5">
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">
                        {sale.isBakiPayment 
                          ? `Baki Payment: ${sale.bakiProductName}` 
                          : sale.items && sale.items.length > 0 
                            ? (sale.items.length === 1 ? sale.items[0].name : `${sale.items[0].name} + ${sale.items.length - 1} items`)
                            : `Sale #${sale.id.slice(-4)}`
                        }
                      </p>
                      <p className="text-[10px] text-muted-foreground">{new Date(sale.saleDate).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-primary">{currency}{sale.total?.toFixed(2)}</p>
                      {!sale.isBakiPayment && (
                        <p className={cn(
                          "text-[10px] font-bold",
                          (sale.profit || 0) < 0 ? "text-destructive" : "text-green-600"
                        )}>
                          {(sale.profit || 0) < 0 ? '-' : '+'}{currency}{Math.abs(sale.profit || 0).toFixed(2)} Lav
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-5">
        <Card className="sticky top-20 shadow-xl border-accent/20 overflow-hidden">
          <CardHeader className="border-b bg-accent/5 p-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="w-5 h-5 text-accent" /> Bill Summary
            </CardTitle>
            <CardDescription className="text-xs">{cart.length} items in current bill</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-6">
            <div className="space-y-4 max-h-[40vh] md:max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground italic flex flex-col items-center gap-3">
                  <ShoppingCart className="w-10 h-10 opacity-10" />
                  <p className="text-xs">Select products to begin billing.</p>
                </div>
              ) : (
                cart.map((item) => {
                  const itemProfit = (item.sellingPrice - (item.purchasePrice || 0)) * item.quantity;
                  const isLoss = itemProfit < 0;
                  return (
                    <div key={item.id} className="space-y-3 pb-4 border-b last:border-0 group">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-primary truncate text-sm">{item.name}</p>
                          <div className="flex gap-2">
                            <span className="text-[10px] text-muted-foreground uppercase">{item.unit}</span>
                            <span className="text-[10px] text-blue-600 font-bold">In Stock: {item.stock}</span>
                            <span className="text-[10px] text-orange-600 font-bold">Buy Price: {currency}{item.purchasePrice || 0}</span>
                          </div>
                        </div>
                        <button 
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <Label className="text-[9px] text-muted-foreground font-bold uppercase">Qty ({item.unit})</Label>
                            <Input 
                              type="number" 
                              step="0.01" 
                              className="h-9 font-bold border-accent/30"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, e.target.value)}
                            />
                         </div>
                         <div className="space-y-1">
                            <Label className="text-[9px] text-muted-foreground font-bold uppercase">Unit Price ({currency})</Label>
                            <Input 
                              type="number" 
                              step="0.01" 
                              className="h-9 font-bold border-accent/30 text-accent"
                              value={item.sellingPrice}
                              onChange={(e) => updateUnitPrice(item.id, e.target.value)}
                            />
                         </div>
                      </div>
                      
                      <div className="flex justify-between items-center px-3 py-2 bg-muted/30 rounded-lg">
                         <div className="text-[10px] text-muted-foreground font-bold uppercase">Item Total</div>
                         <p className="font-black text-primary text-base">{currency}{(item.sellingPrice * item.quantity).toFixed(2)}</p>
                      </div>

                      {item.quantity > item.stock && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 rounded text-red-600 text-[9px] font-bold border border-red-100">
                          <AlertTriangle className="w-3.5 h-3.5" /> 
                          Stock warning: only {item.stock} {item.unit} available!
                        </div>
                      )}
                      
                      <div className={cn(
                        "flex justify-between items-center p-2 rounded-lg border",
                        isLoss ? "bg-red-50 border-red-100" : "bg-green-50/50 border-green-100"
                      )}>
                        <span className={cn("text-[10px] font-bold uppercase", isLoss ? "text-red-700" : "text-green-700")}>
                          {isLoss ? 'Est. Loss' : 'Est. Lav'}
                        </span>
                        <span className={cn("text-sm font-black", isLoss ? "text-red-600" : "text-green-600")}>
                          {isLoss ? '-' : '+'}{currency}{Math.abs(itemProfit).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {cart.length > 0 && (
              <div className="space-y-6 pt-4 border-t-2 border-dashed">
                <div className="grid grid-cols-2 gap-3">
                   <div className={cn(
                     "p-3 text-white rounded-xl shadow-lg transition-colors",
                     totalProfit < 0 ? "bg-destructive" : "bg-green-600"
                   )}>
                      <p className="text-[9px] font-bold uppercase opacity-80">{totalProfit < 0 ? 'Total Loss' : 'Total Lav'}</p>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xl font-black">{currency}{totalProfit.toFixed(2)}</span>
                      </div>
                   </div>
                   <div className="p-3 bg-primary text-white rounded-xl shadow-lg text-right">
                      <p className="text-[9px] font-bold uppercase opacity-80">Final Total</p>
                      <p className="text-xl font-black">{currency}{grandTotal.toFixed(2)}</p>
                   </div>
                </div>

                <Button 
                  className="w-full h-14 md:h-16 text-lg bg-accent hover:bg-accent/90 shadow-2xl font-bold" 
                  onClick={handleCheckout}
                  disabled={cart.some(i => i.quantity > i.stock || i.quantity <= 0)}
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" /> Complete Sale
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
