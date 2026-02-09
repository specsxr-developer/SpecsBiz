
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
  UserPlus,
  Zap,
  Search,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Receipt
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function DashboardPage() {
  const { toast } = useToast()
  
  // States for Quick Entry
  const [quickInventory, setQuickInventory] = useState({ name: "", stock: "", unit: "pcs" })
  const [quickCustomer, setQuickCustomer] = useState({ name: "", phone: "" })
  
  // Sale Panel States
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<any[]>([])

  // Mock Inventory (Ideally fetched from Firestore later)
  const [inventory] = useState<any[]>([
    { id: 1, name: "Premium Fabric", buyPrice: 150, sellPrice: 280, stock: 45.5, unit: "meter" },
    { id: 2, name: "Gold Frame Aviator", buyPrice: 1200, sellPrice: 2500, stock: 12, unit: "pcs" },
    { id: 3, name: "Blue Light Lenses", buyPrice: 800, sellPrice: 1500, stock: 24, unit: "pcs" },
    { id: 4, name: "Cleaning Solution", buyPrice: 45, sellPrice: 95, stock: 100.2, unit: "ltr" },
  ])

  const stats = [
    { label: "Total Revenue", value: "$0", change: "0%", trend: "up", icon: DollarSign, color: "text-green-600" },
    { label: "Inventory Items", value: "4", change: "+2%", trend: "up", icon: Package, color: "text-blue-600" },
    { label: "Active Customers", value: "0", change: "0%", trend: "up", icon: Users, color: "text-purple-600" },
    { label: "Sales Count", value: "0", change: "0%", trend: "up", icon: TrendingUp, color: "text-teal-600" },
  ]

  const handleQuickInventory = () => {
    if (!quickInventory.name || !quickInventory.stock) return
    toast({ title: "Inventory Updated", description: `Added ${quickInventory.stock} ${quickInventory.unit} of ${quickInventory.name}.` })
    setQuickInventory({ name: "", stock: "", unit: "pcs" })
  }

  const handleQuickCustomer = () => {
    if (!quickCustomer.name || !quickCustomer.phone) return
    toast({ title: "Customer Registered", description: `${quickCustomer.name} has been added to database.` })
    setQuickCustomer({ name: "", phone: "" })
  }

  const addToCart = (product: any) => {
    const existing = cart.find(c => c.id === product.id)
    if (existing) {
      toast({ title: "Item exists", description: "Adjust quantity in the checkout area." })
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
      toast({ title: "Added to Cart", description: `${product.name} added.` })
    }
  }

  const updateQuantity = (id: number, value: string) => {
    const num = parseFloat(value) || 0
    setCart(cart.map(c => c.id === id ? { ...c, quantity: num } : c))
  }

  const removeFromCart = (id: number) => {
    setCart(cart.filter(c => c.id !== id))
  }

  const subtotal = cart.reduce((acc, item) => acc + (item.sellPrice * item.quantity), 0)
  const totalProfit = cart.reduce((acc, item) => acc + ((item.sellPrice - item.buyPrice) * item.quantity), 0)
  const tax = subtotal * 0.05
  const grandTotal = subtotal + tax

  const handleCheckout = () => {
    toast({
      title: "Sale Successful",
      description: `Billed $${grandTotal.toFixed(2)} with $${totalProfit.toFixed(2)} Profit (Lav).`,
    })
    setCart([])
    setIsSaleDialogOpen(false)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary font-headline">Business Overview</h1>
          <p className="text-muted-foreground">Welcome back. Manage your daily operations below.</p>
        </div>
        
        <Dialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-accent hover:bg-accent/90 shadow-lg gap-2 text-lg h-14 px-8">
              <ShoppingCart className="w-6 h-6" /> Create New Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 border-b bg-accent/5">
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-accent" /> New Sale Transaction
              </DialogTitle>
              <DialogDescription>Select products and adjust quantities for professional billing.</DialogDescription>
            </DialogHeader>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 min-h-0">
              {/* Product Selection List */}
              <div className="border-r flex flex-col min-h-0 bg-muted/20">
                <div className="p-4 border-b bg-white">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search items..." 
                      className="pl-9" 
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {inventory
                      .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
                      .map((item) => (
                        <div key={item.id} className="p-3 border rounded-xl bg-white flex justify-between items-center hover:border-accent transition-all cursor-pointer shadow-sm group" onClick={() => addToCart(item)}>
                          <div>
                            <p className="text-sm font-bold text-primary">{item.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px] bg-blue-50">Stock: {item.stock} {item.unit}</Badge>
                              <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700">Lav: ${(item.sellPrice - item.buyPrice).toFixed(2)}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-accent text-sm">${item.sellPrice}</span>
                            <div className="p-1 rounded-full bg-accent/10 group-hover:bg-accent group-hover:text-white transition-colors">
                              <Plus className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Cart / Checkout Area */}
              <div className="flex flex-col min-h-0 bg-white">
                <div className="p-4 border-b bg-muted/5">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Cart Items</h3>
                </div>
                <ScrollArea className="flex-1 p-4">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30 py-12">
                      <ShoppingCart className="w-12 h-12 mb-3" />
                      <p className="text-sm italic">Cart is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.id} className="space-y-2 pb-4 border-b last:border-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold text-primary">{item.name}</p>
                              <p className="text-[10px] text-muted-foreground">Price: ${item.sellPrice} / {item.unit}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500" onClick={() => removeFromCart(item.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-end justify-between gap-4">
                            <div className="flex-1">
                              <Label className="text-[10px] font-bold uppercase opacity-60">Qty ({item.unit})</Label>
                              <Input 
                                type="number" 
                                step="0.01" 
                                className="h-8" 
                                value={item.quantity} 
                                onChange={(e) => updateQuantity(item.id, e.target.value)} 
                              />
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black text-primary">${(item.sellPrice * item.quantity).toFixed(2)}</p>
                            </div>
                          </div>

                          {item.quantity > item.stock && (
                            <div className="bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold p-2 rounded flex items-center gap-2">
                              <AlertTriangle className="w-3 h-3" /> Over stock limit (Avail: {item.stock})
                            </div>
                          )}

                          <div className="flex justify-between items-center text-[10px] text-green-700 bg-green-50 p-1.5 rounded font-medium">
                            <span>Item Profit</span>
                            <span>+${((item.sellPrice - item.buyPrice) * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                
                <div className="p-6 border-t bg-muted/10 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-600 text-white p-3 rounded-xl shadow-inner">
                      <p className="text-[10px] font-bold uppercase opacity-80">Total Lav (Profit)</p>
                      <p className="text-xl font-black">${totalProfit.toFixed(2)}</p>
                    </div>
                    <div className="bg-primary text-white p-3 rounded-xl shadow-inner text-right">
                      <p className="text-[10px] font-bold uppercase opacity-80">Grand Total</p>
                      <p className="text-xl font-black">${grandTotal.toFixed(2)}</p>
                    </div>
                  </div>
                  <Button 
                    className="w-full h-14 text-lg bg-accent hover:bg-accent/90 font-bold shadow-xl" 
                    disabled={cart.length === 0 || cart.some(i => i.quantity > i.stock || i.quantity <= 0)}
                    onClick={handleCheckout}
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" /> Complete Bill
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                )}
                <span className={stat.trend === "up" ? "text-green-600" : "text-red-600"}>{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-accent/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent" />
              <CardTitle className="text-lg">Quick Entry</CardTitle>
            </div>
            <CardDescription>Rapidly update inventory or customers.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="inventory" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="inventory" className="gap-2"><Package className="w-4 h-4" /> Add Stock</TabsTrigger>
                <TabsTrigger value="customer" className="gap-2"><UserPlus className="w-4 h-4" /> New Customer</TabsTrigger>
              </TabsList>
              
              <TabsContent value="inventory" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="i-name">Product Name</Label>
                    <Input id="i-name" placeholder="Item name" value={quickInventory.name} onChange={e => setQuickInventory({...quickInventory, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="i-stock">Stock Amount</Label>
                    <Input id="i-stock" type="number" step="0.01" placeholder="0.00" value={quickInventory.stock} onChange={e => setQuickInventory({...quickInventory, stock: e.target.value})} />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full bg-primary" onClick={handleQuickInventory}>Add to Inventory</Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="customer" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="c-name">Customer Name</Label>
                    <Input id="c-name" placeholder="Full Name" value={quickCustomer.name} onChange={e => setQuickCustomer({...quickCustomer, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-phone">Phone Number</Label>
                    <Input id="c-phone" placeholder="Phone" value={quickCustomer.phone} onChange={e => setQuickCustomer({...quickCustomer, phone: e.target.value})} />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full bg-accent" onClick={handleQuickCustomer}>Register Customer</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Review your latest business actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
              <Inbox className="w-8 h-8 opacity-20" />
              <p className="text-sm italic">No recent transactions yet.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
