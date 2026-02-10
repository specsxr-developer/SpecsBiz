
"use client"

import { useState } from "react"
import { 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign, 
  ArrowUpRight, 
  Clock,
  Inbox,
  Plus,
  ShoppingCart,
  Search,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ArrowDownCircle,
  Lock
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
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useBusinessData } from "@/hooks/use-business-data"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { toast } = useToast()
  const { products, sales, customers, actions, currency, language } = useBusinessData()
  const t = translations[language]
  
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<any[]>([])

  // Deletion Password Protection
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deletePass, setDeletePass] = useState("")

  const totalRevenue = sales.reduce((acc, s) => acc + (s.total || 0), 0)

  const stats = [
    { label: t.revenue, value: `${currency}${totalRevenue.toLocaleString()}`, trend: "up", icon: DollarSign, color: "text-green-600" },
    { label: t.products, value: products.length.toString(), trend: "up", icon: Package, color: "text-blue-600" },
    { label: t.customers, value: customers.length.toString(), trend: "up", icon: Users, color: "text-purple-600" },
    { label: t.sales, value: sales.length.toString(), trend: "up", icon: TrendingUp, color: "text-teal-600" },
  ]

  const addToCart = (product: any) => {
    const existing = cart.find(c => c.id === product.id)
    if (existing) {
      toast({ title: language === 'en' ? "Already in cart" : "ইতিমধ্যেই কার্টে আছে" })
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
      toast({ title: language === 'en' ? "Added" : "যোগ করা হয়েছে" })
    }
  }

  const updateQuantity = (id: string, value: string) => {
    const num = parseFloat(value) || 0
    setCart(cart.map(c => c.id === id ? { ...c, quantity: num } : c))
  }

  const updateUnitPrice = (id: string, value: string) => {
    const num = parseFloat(value) || 0
    setCart(cart.map(c => c.id === id ? { ...c, sellingPrice: num } : c))
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
    toast({ title: language === 'en' ? "Sale Successful" : "বিক্রয় সম্পন্ন হয়েছে", description: `${t.finalTotal}: ${currency}${grandTotal.toLocaleString()}` })
    setCart([])
    setIsSaleDialogOpen(false)
  }

  const handleDeleteSale = () => {
    if (deletePass === "specsxr") {
      if (deleteId) {
        actions.deleteSale(deleteId)
        toast({ title: language === 'en' ? "Sale Deleted" : "বিক্রয় ডিলিট করা হয়েছে", description: "Stock and data reverted." })
      }
      setDeleteId(null)
      setDeletePass("")
    } else {
      toast({ variant: "destructive", title: "Wrong Password", description: "Access denied." })
      setDeletePass("")
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary font-headline">{t.businessOverview}</h1>
          <p className="text-xs md:text-sm text-muted-foreground">{t.manageDailyOps}</p>
        </div>
        
        <Dialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-accent hover:bg-accent/90 shadow-lg gap-2 text-base md:text-lg h-12 md:h-14 px-6 md:px-8 w-full sm:w-auto">
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" /> {t.createNewSale}
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-[900px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-accent/20 shadow-2xl">
            <DialogHeader className="p-4 md:p-6 border-b bg-accent/5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <ShoppingCart className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-primary">Bill Summary</DialogTitle>
                  <DialogDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                    {cart.length} items in current bill
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Product Selection Side */}
              <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r flex flex-col min-h-[300px] lg:min-h-0 bg-muted/20 overflow-hidden">
                <div className="p-3 md:p-4 border-b bg-white shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder={t.search} className="pl-9 h-10 border-accent/10" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>
                <ScrollArea className="flex-1 p-3 md:p-4">
                  <div className="space-y-2">
                    {products
                      .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
                      .map((item) => (
                        <div key={item.id} className="p-3 border rounded-xl bg-white flex justify-between items-center hover:border-accent hover:shadow-md transition-all cursor-pointer group" onClick={() => addToCart(item)}>
                          <div className="min-w-0 flex-1 mr-2">
                            <p className="text-xs font-bold text-primary truncate">{item.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[9px] bg-blue-50 border-blue-100 text-blue-700">{t.stock}: {item.stock} {item.unit}</Badge>
                              <span className="text-[9px] font-bold text-accent">{currency}{item.sellingPrice}</span>
                            </div>
                          </div>
                          <div className="p-1.5 rounded-full bg-accent/10 group-hover:bg-accent group-hover:text-white transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                        </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Billing Side (Matches Screenshot) */}
              <div className="lg:col-span-7 flex flex-col min-h-[400px] lg:min-h-0 bg-white overflow-hidden">
                <ScrollArea className="flex-1 p-4 md:p-6">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30 py-20">
                      <ShoppingCart className="w-12 h-12 mb-4" />
                      <p className="text-sm font-medium italic">Your cart is empty. Start adding items!</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
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
                                  className="h-11 bg-[#F0FFFF] border-accent/20 text-lg font-bold" 
                                  value={item.quantity} 
                                  onChange={(e) => updateQuantity(item.id, e.target.value)} 
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[9px] font-black uppercase text-muted-foreground">Unit Price ({currency})</Label>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  className="h-11 bg-[#F0FFFF] border-accent/20 text-lg font-bold text-accent" 
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
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>

                {/* Master Summary Footer (Matches Screenshot) */}
                <div className="p-4 md:p-6 border-t bg-white space-y-4 shrink-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div className={cn(
                      "p-4 rounded-2xl shadow-sm border transition-colors flex flex-col justify-between",
                      totalProfit < 0 ? "bg-destructive text-white border-none" : "bg-emerald-500 text-white border-none"
                    )}>
                      <p className="text-[8px] font-black uppercase opacity-80 tracking-widest">{totalProfit < 0 ? 'Total Loss' : t.totalLav}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="w-4 h-4 opacity-70" />
                        <span className="text-2xl font-black">{currency}{totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className="bg-primary text-white p-4 rounded-2xl shadow-sm flex flex-col justify-between items-end text-right">
                      <p className="text-[8px] font-black uppercase opacity-80 tracking-widest">{t.finalTotal}</p>
                      <p className="text-2xl font-black mt-1">{currency}{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <Button 
                    className="w-full h-14 text-lg bg-teal-700 hover:bg-teal-800 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50" 
                    disabled={cart.length === 0} 
                    onClick={handleCheckout}
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" /> {t.completeSale}
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
                <span className="text-green-600">{t.stable}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
            <CardTitle className="text-sm md:text-base flex items-center gap-2"><Clock className="w-4 h-4 md:w-5 md:h-5 text-accent" /> {t.recentActivity}</CardTitle>
            <CardDescription className="text-xs">Your latest transactions and payments.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {sales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                <Inbox className="w-6 h-6 md:w-8 md:h-8 opacity-20" />
                <p className="text-xs italic">{t.noTransactions}</p>
              </div>
            ) : (
              <div className="divide-y">
                {sales.slice(0, 10).map((sale, i) => (
                  <div key={i} className="flex items-center justify-between p-3 md:p-4 hover:bg-muted/5 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-1.5 md:p-2 rounded-full shrink-0 ${sale.isBakiPayment ? 'bg-blue-100' : 'bg-accent/10'}`}>
                        {sale.isBakiPayment ? (
                          <ArrowDownCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" />
                        ) : (
                          <Receipt className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm font-bold truncate">
                          {sale.isBakiPayment 
                            ? `Baki Payment: ${sale.bakiProductName}` 
                            : sale.items && sale.items.length > 0 
                              ? (sale.items.length === 1 ? sale.items[0].name : `${sale.items[0].name} + ${sale.items.length - 1} items`)
                              : `${t.saleId}${sale.id?.slice(-4)}`
                          }
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-[9px] md:text-[10px] text-muted-foreground truncate">{new Date(sale.saleDate).toLocaleDateString()}</p>
                          {sale.isBakiPayment && (
                            <Badge variant="outline" className="text-[8px] h-3.5 border-blue-200 bg-blue-50 text-blue-600 px-1">
                              Due: {currency}{sale.remainingAmount?.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-xs md:text-sm font-bold text-primary">{currency}{sale.total?.toLocaleString()}</p>
                        {!sale.isBakiPayment && (
                          <p className={cn(
                            "text-[9px] md:text-[10px] font-bold",
                            (sale.profit || 0) < 0 ? "text-destructive" : "text-green-600"
                          )}>
                            {(sale.profit || 0) < 0 ? '-' : '+'}{currency}{Math.abs(sale.profit || 0).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500" onClick={() => setDeleteId(sale.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation with Password */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Lock className="w-5 h-5" /> {language === 'en' ? 'History Protection' : 'হিস্ট্রি প্রটেকশন'}
            </DialogTitle>
            <DialogDescription>
              {language === 'en' 
                ? 'Deleting this sale will restore item stock and remove revenue data. Enter secret key to confirm.'
                : 'এই বিক্রয়টি ডিলিট করলে স্টকে মাল ফিরে যাবে এবং আয় কমে যাবে। নিশ্চিত করতে সিক্রেট কী দিন।'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label className="text-xs font-bold uppercase opacity-70">Secret Access Key</Label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              className="h-12 text-lg font-bold"
              value={deletePass}
              onChange={e => setDeletePass(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="destructive" className="w-full h-12 text-base font-bold shadow-lg" onClick={handleDeleteSale}>
              {language === 'en' ? 'Authorize & Delete' : 'অথোরাইজ ও ডিলিট করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
