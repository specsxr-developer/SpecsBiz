
"use client"

import { useState } from "react"
import { 
  ShoppingCart, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle2,
  Clock,
  Receipt,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

export default function SalesPage() {
  const { toast } = useToast()
  const [cart, setCart] = useState<any[]>([])
  const [search, setSearch] = useState("")

  // Note: In a real app, this would come from a database/context
  // We're keeping it as a local constant for now for demonstration
  const [inventory, setInventory] = useState<any[]>([
    { id: 1, name: "Sample Fabric", purchasePrice: 50, price: 120, stock: 25.5, unit: "meter" },
    { id: 2, name: "Premium Rice", purchasePrice: 40, price: 65, stock: 100, unit: "kg" },
    { id: 3, name: "Glass Frames", purchasePrice: 200, price: 450, stock: 10, unit: "pcs" },
  ])

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.id === item.id)
    if (existing) {
      toast({ title: "Already in cart", description: "Adjust quantity in the cart side panel." })
    } else {
      setCart([...cart, { ...item, quantity: 1 }])
      toast({ title: "Added to cart", description: `${item.name} added.` })
    }
  }

  const updateQuantity = (id: number, value: string) => {
    const numValue = parseFloat(value) || 0
    setCart(cart.map(c => {
      if (c.id === id) {
        return { ...c, quantity: numValue }
      }
      return c
    }))
  }

  const removeFromCart = (id: number) => {
    setCart(cart.filter(c => c.id !== id))
  }

  const subtotal = cart.reduce((acc, c) => acc + (c.price * c.quantity), 0)
  const totalCost = cart.reduce((acc, c) => acc + (c.purchasePrice * c.quantity), 0)
  const totalProfit = subtotal - totalCost
  
  const tax = subtotal * 0.08
  const grandTotal = subtotal + tax

  const handleCheckout = () => {
    toast({
      title: "Sale Recorded",
      description: `Transaction of $${grandTotal.toFixed(2)} successful. Profit: $${totalProfit.toFixed(2)}`,
    })
    setCart([])
  }

  const recentSales: any[] = []

  return (
    <div className="grid lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
      <div className="lg:col-span-7 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Receipt className="w-5 h-5 text-accent" /> Product Selection
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search products..." 
                className="pl-9" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {inventory.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground italic border-2 border-dashed rounded-xl">
                No products in inventory.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {inventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).map((item) => (
                  <div key={item.id} className="p-4 border rounded-xl bg-card hover:border-accent transition-colors flex justify-between items-center group">
                    <div className="space-y-1">
                      <p className="font-semibold text-primary">{item.name}</p>
                      <p className="text-sm text-accent font-bold">${item.price} / {item.unit}</p>
                      <div className="flex items-center gap-2">
                         <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal">
                           Stock: {item.stock} {item.unit}
                         </Badge>
                      </div>
                    </div>
                    <Button 
                      size="icon" 
                      className="bg-accent/10 text-accent hover:bg-accent hover:text-white"
                      onClick={() => addToCart(item)}
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
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" /> Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-center py-8 text-muted-foreground italic">
            No recent transactions found.
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-5">
        <Card className="sticky top-20 shadow-xl border-accent/20">
          <CardHeader className="border-b bg-accent/5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="w-5 h-5 text-accent" /> Active Cart
            </CardTitle>
            <CardDescription>{cart.length} items for checkout</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4 max-h-[350px] overflow-auto pr-2">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground italic">
                  Cart is empty. Select products.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="space-y-2 pb-4 border-b last:border-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-primary">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Unit: {item.unit}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-400 hover:text-red-600 h-8 w-8"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-4">
                       <div className="flex-1">
                          <Label className="text-[10px] text-muted-foreground">Quantity ({item.unit})</Label>
                          <Input 
                            type="number" 
                            step="0.01" 
                            className="h-9 font-bold"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, e.target.value)}
                          />
                       </div>
                       <div className="text-right">
                          <Label className="text-[10px] text-muted-foreground">Subtotal</Label>
                          <p className="font-bold text-accent">${(item.price * item.quantity).toFixed(2)}</p>
                       </div>
                    </div>
                    
                    {item.quantity > item.stock && (
                      <div className="flex items-center gap-1 text-red-500 text-[10px] font-bold animate-pulse">
                        <AlertTriangle className="w-3 h-3" /> Exceeds available stock ({item.stock})
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-muted-foreground">Est. Profit:</span>
                      <span className="text-green-600 font-bold">+${((item.price - item.purchasePrice) * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="space-y-4 pt-4 border-t-2 border-dashed">
                <div className="grid grid-cols-2 gap-2">
                   <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Estimated Profit</p>
                      <div className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-lg font-bold">${totalProfit.toFixed(2)}</span>
                      </div>
                   </div>
                   <div className="p-3 bg-primary/5 rounded-lg text-right">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Total Sale</p>
                      <p className="text-lg font-black text-primary">${grandTotal.toFixed(2)}</p>
                   </div>
                </div>

                <div className="space-y-2 text-sm px-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (8%)</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  className="w-full h-14 text-lg bg-accent hover:bg-accent/90 shadow-lg" 
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
