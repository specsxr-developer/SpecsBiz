
"use client"

import { useState } from "react"
import { 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Inbox,
  Plus,
  ShoppingCart,
  Zap,
  Search,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Receipt
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useBusinessData } from "@/hooks/use-business-data"

export default function DashboardPage() {
  const { toast } = useToast()
  const { products, sales, customers, actions } = useBusinessData()
  
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<any[]>([])

  const totalRevenue = sales.reduce((acc, s) => acc + (s.total || 0), 0)

  const stats = [
    { label: "Revenue", value: `$${totalRevenue.toFixed(2)}`, trend: "up", icon: DollarSign, color: "text-green-600" },
    { label: "Products", value: products.length.toString(), trend: "up", icon: Package, color: "text-blue-600" },
    { label: "Customers", value: customers.length.toString(), trend: "up", icon: Users, color: "text-purple-600" },
    { label: "Sales", value: sales.length.toString(), trend: "up", icon: TrendingUp, color: "text-teal-600" },
  ]

  const addToCart = (product: any) => {
    const existing = cart.find(c => c.id === product.id)
    if (existing) {
      toast({ title: "Already in cart", description: "Adjust quantity there." })
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
      toast({ title: "Added" })
    }
  }

  const updateQuantity = (id: string, value: string) => {
    const num = parseFloat(value) || 0
    setCart(cart.map(c => c.id === id ? { ...c, quantity: num } : c))
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter(c => c.id !== id))
  }

  const subtotal = cart.reduce((acc, item) => acc + (item.sellingPrice * item.quantity), 0)
  const totalProfit = cart.reduce((acc, item) => acc + ((item.sellingPrice - (item.purchasePrice || 0)) * item.quantity), 0)
  const grandTotal = subtotal

  const handleCheckout = () => {
    actions.addSale({
      total: grandTotal,
      profit: totalProfit,
      items: cart,
    })
    toast({ title: "Sale Successful", description: `Grand Total: $${grandTotal.toFixed(2)}` })
    setCart([])
    setIsSaleDialogOpen(false)
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary font-headline">Business Overview</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Manage your daily operations with cloud sync.</p>
        </div>
        
        <Dialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-accent hover:bg-accent/90 shadow-lg gap-2 text-base md:text-lg h-12 md:h-14 px-6 md:px-8 w-full sm:w-auto">
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" /> Create New Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-[800px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-4 md:p-6 border-b bg-accent/5 shrink-0">
              <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
                <Receipt className="w-5 h-5 text-accent" /> New Sale Transaction
              </DialogTitle>
              <DialogDescription className="text-xs">Select products and adjust quantities.</DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="border-b md:border-b-0 md:border-r flex flex-col min-h-[300px] md:min-h-0 bg-muted/20 overflow-hidden">
                <div className="p-3 md:p-4 border-b bg-white shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>
                <ScrollArea className="flex-1 p-3 md:p-4">
                  <div className="space-y-2">
                    {products
                      .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
                      .map((item) => (
                        <div key={item.id} className="p-2 md:p-3 border rounded-xl bg-white flex justify-between items-center hover:border-accent cursor-pointer shadow-sm group" onClick={() => addToCart(item)}>
                          <div className="min-w-0 flex-1 mr-2">
                            <p className="text-xs md:text-sm font-bold text-primary truncate">{item.name}</p>
                            <Badge variant="outline" className="text-[9px] md:text-[10px] bg-blue-50 mt-1 whitespace-nowrap">Stock: {item.stock} {item.unit}</Badge>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-accent text-xs md:text-sm">${item.sellingPrice}</span>
                            <div className="p-1 rounded-full bg-accent/10 group-hover:bg-accent group-hover:text-white transition-colors">
                              <Plus className="w-3 h-3 md:w-4 md:h-4" />
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="flex flex-col min-h-[300px] md:min-h-0 bg-white overflow-hidden">
                <div className="p-3 md:p-4 border-b bg-muted/5 shrink-0">
                  <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">Cart Items</h3>
                </div>
                <ScrollArea className="flex-1 p-3 md:p-4">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30 py-8">
                      <ShoppingCart className="w-8 h-8 md:w-12 md:h-12 mb-2" />
                      <p className="text-xs italic">Cart is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.id} className="space-y-2 pb-3 border-b last:border-0">
                          <div className="flex justify-between items-start">
                            <div className="min-w-0 flex-1 mr-2">
                              <p className="text-xs font-bold text-primary truncate">{item.name}</p>
                              <p className="text-[9px] text-muted-foreground">${item.sellingPrice} / {item.unit}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500 shrink-0" onClick={() => removeFromCart(item.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex items-end justify-between gap-3">
                            <div className="max-w-[80px]">
                              <Label className="text-[9px] font-bold uppercase opacity-60">Qty</Label>
                              <Input type="number" step="0.01" className="h-8 text-xs px-2" value={item.quantity} onChange={(e) => updateQuantity(item.id, e.target.value)} />
                            </div>
                            <div className="text-right">
                              <p className="text-base md:text-lg font-black text-primary">${(item.sellingPrice * item.quantity).toFixed(2)}</p>
                            </div>
                          </div>
                          {item.quantity > item.stock && (
                            <div className="bg-red-50 border border-red-100 text-red-600 text-[9px] font-bold p-1.5 rounded flex items-center gap-1.5">
                              <AlertTriangle className="w-3 h-3" /> Over stock!
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <div className="p-4 md:p-6 border-t bg-muted/10 space-y-3 shrink-0">
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div className="bg-green-600 text-white p-2 md:p-3 rounded-xl shadow-inner">
                      <p className="text-[8px] md:text-[10px] font-bold uppercase opacity-80">Total Lav</p>
                      <p className="text-base md:text-xl font-black">${totalProfit.toFixed(2)}</p>
                    </div>
                    <div className="bg-primary text-white p-2 md:p-3 rounded-xl shadow-inner text-right">
                      <p className="text-[8px] md:text-[10px] font-bold uppercase opacity-80">Total</p>
                      <p className="text-base md:text-xl font-black">${grandTotal.toFixed(2)}</p>
                    </div>
                  </div>
                  <Button className="w-full h-10 md:h-14 text-sm md:text-lg bg-accent hover:bg-accent/90 font-bold shadow-xl" disabled={cart.length === 0 || cart.some(i => i.quantity > i.stock || i.quantity <= 0)} onClick={handleCheckout}>
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 mr-2" /> Complete Bill
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-1 md:pb-2">
              <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground truncate">{stat.label}</CardTitle>
              <stat.icon className={`h-3 w-3 md:h-4 md:w-4 ${stat.color} shrink-0`} />
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="text-sm md:text-2xl font-bold">{stat.value}</div>
              <p className="text-[8px] md:text-xs text-muted-foreground flex items-center gap-1 pt-0.5">
                <ArrowUpRight className="h-2 w-2 md:h-3 md:w-3 text-green-600" />
                <span className="text-green-600">Stable</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
            <CardTitle className="text-sm md:text-base flex items-center gap-2"><Clock className="w-4 h-4 md:w-5 md:h-5 text-accent" /> Recent Activity</CardTitle>
            <CardDescription className="text-xs">Your latest transactions.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {sales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                <Inbox className="w-6 h-6 md:w-8 md:h-8 opacity-20" />
                <p className="text-xs italic">No transactions yet.</p>
              </div>
            ) : (
              <div className="divide-y">
                {sales.slice(0, 5).map((sale, i) => (
                  <div key={i} className="flex items-center justify-between p-3 md:p-4 hover:bg-muted/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1.5 md:p-2 bg-accent/10 rounded-full shrink-0"><Receipt className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent" /></div>
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm font-bold truncate">Sale #{sale.id?.slice(-4)}</p>
                        <p className="text-[9px] md:text-[10px] text-muted-foreground truncate">{new Date(sale.saleDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs md:text-sm font-bold text-primary">${sale.total?.toFixed(2)}</p>
                      <p className="text-[9px] md:text-[10px] text-green-600 font-medium">+${sale.profit?.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
