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
  Receipt
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

  const inventory = [
    { id: 1, name: "Classic Aviator", price: 120, stock: 24 },
    { id: 2, name: "Blue Light Pro", price: 85, stock: 45 },
    { id: 3, name: "Ray-Ban Case", price: 15, stock: 120 },
    { id: 4, name: "Lens Cleaner", price: 8, stock: 50 },
  ]

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.id === item.id)
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c))
    } else {
      setCart([...cart, { ...item, quantity: 1 }])
    }
    toast({ title: "Added to cart", description: `${item.name} added.` })
  }

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        const newQty = Math.max(1, c.quantity + delta)
        return { ...c, quantity: newQty }
      }
      return c
    }))
  }

  const removeFromCart = (id: number) => {
    setCart(cart.filter(c => c.id !== id))
  }

  const subtotal = cart.reduce((acc, c) => acc + (c.price * c.quantity), 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  const handleCheckout = () => {
    toast({
      title: "Sale Recorded",
      description: `Transaction of $${total.toFixed(2)} successful.`,
    })
    setCart([])
  }

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
                placeholder="Search products by name or SKU..." 
                className="pl-9" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).map((item) => (
                <div key={item.id} className="p-4 border rounded-xl bg-card hover:border-accent transition-colors flex justify-between items-center group">
                  <div className="space-y-1">
                    <p className="font-semibold text-primary">{item.name}</p>
                    <p className="text-sm text-accent font-bold">${item.price}</p>
                    <p className="text-xs text-muted-foreground">{item.stock} in stock</p>
                  </div>
                  <Button 
                    size="icon" 
                    className="bg-accent/10 text-accent hover:bg-accent hover:text-white"
                    onClick={() => addToCart(item)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" /> Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { id: "INV-001", customer: "Walk-in", amount: "$150.00", status: "Paid" },
                  { id: "INV-002", customer: "James Bond", amount: "$85.00", status: "Paid" },
                  { id: "INV-003", customer: "Alice Smith", amount: "$220.00", status: "Paid" },
                ].map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="pl-6 font-mono text-xs">{sale.id}</TableCell>
                    <TableCell>{sale.customer}</TableCell>
                    <TableCell className="font-semibold">{sale.amount}</TableCell>
                    <TableCell><Badge className="bg-green-100 text-green-700 hover:bg-green-100">{sale.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-5">
        <Card className="sticky top-20">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-accent" /> Active Cart
            </CardTitle>
            <CardDescription>{cart.length} items selected</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4 max-h-[400px] overflow-auto pr-2">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground italic">
                  Cart is empty. Add products to start.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between group">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">${item.price} x {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-lg bg-muted">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
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
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="space-y-3 pt-6 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-primary">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <Button className="w-full h-12 text-lg bg-accent hover:bg-accent/90" onClick={handleCheckout}>
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