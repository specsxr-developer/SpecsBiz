
"use client"

import { useState, useMemo } from "react"
import { 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign, 
  ArrowUp, 
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
  Lock,
  BarChart2,
  Target,
  ArrowUpCircle,
  Info,
  Layers,
  Tag,
  CreditCard,
  FileText,
  X,
  History,
  PackageSearch
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useBusinessData } from "@/hooks/use-business-data"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { toast } = useToast()
  const { products, sales, customers, procurements, actions, currency, language } = useBusinessData()
  const t = translations[language]
  
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<any[]>([])

  // Deletion Password Protection
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteType, setDeleteType] = useState<'sale' | 'procurement' | null>(null)
  const [deletePass, setDeletePass] = useState("")

  // View Product Details State
  const [viewProduct, setViewProduct] = useState<any>(null)

  const totalRevenue = sales.reduce((acc, s) => acc + (s.total || 0), 0)

  // Aggregate A to Z Activity
  const allActivities = useMemo(() => {
    const sList = sales.map(s => ({ ...s, activityType: 'sale' as const, timestamp: new Date(s.saleDate).getTime() }));
    const pList = procurements.map(p => ({ ...p, activityType: 'procurement' as const, timestamp: new Date(p.date).getTime() }));
    return [...sList, ...pList].sort((a, b) => b.timestamp - a.timestamp);
  }, [sales, procurements]);

  // Calculate Product-wise Deep Profit
  const productProfitData = useMemo(() => {
    const dataMap: Record<string, { id: string, name: string, profit: number, qty: number, revenue: number, cost: number, unit?: string }> = {}
    
    sales.forEach(sale => {
      if (!sale.isBakiPayment && sale.items) {
        sale.items.forEach((item: any) => {
          const itemId = item.id || item.name;
          if (!dataMap[itemId]) {
            dataMap[itemId] = { id: itemId, name: item.name, profit: 0, qty: 0, revenue: 0, cost: 0, unit: item.unit }
          }
          const itemRevenue = item.sellingPrice * item.quantity;
          const itemCost = (item.purchasePrice || 0) * item.quantity;
          const itemProfit = itemRevenue - itemCost;
          
          dataMap[itemId].revenue += itemRevenue;
          dataMap[itemId].cost += itemCost;
          dataMap[itemId].profit += itemProfit;
          dataMap[itemId].qty += item.quantity;
        })
      }
    })

    return Object.values(dataMap).sort((a, b) => b.profit - a.profit);
  }, [sales])

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
      setCart([...cart, { ...product, quantity: 1, selectedUnit: product.unit }])
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

  const updateSelectedUnit = (id: string, unit: string) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        let newQty = c.quantity;
        let newPrice = c.sellingPrice;
        if (c.selectedUnit === 'kg' && unit === 'gm') {
          newQty = c.quantity * 1000;
          newPrice = c.sellingPrice / 1000;
        }
        if (c.selectedUnit === 'gm' && unit === 'kg') {
          newQty = c.quantity / 1000;
          newPrice = c.sellingPrice * 1000;
        }
        return { ...c, selectedUnit: unit, quantity: newQty, sellingPrice: newPrice };
      }
      return c;
    }))
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter(c => c.id !== id))
  }

  const cartSummary = useMemo(() => {
    let subtotal = 0;
    let totalProfit = 0;
    
    const normalizedItems = cart.map(item => {
      let factor = 1;
      if (item.unit === 'kg' && item.selectedUnit === 'gm') factor = 0.001;
      if (item.unit === 'gm' && item.selectedUnit === 'kg') factor = 1000;
      
      const effectiveQty = item.quantity * factor;
      const buyPrice = item.purchasePrice || 0;
      const sellPriceInBaseUnit = item.selectedUnit === 'gm' && item.unit === 'kg' ? item.sellingPrice * 1000 : 
                                item.selectedUnit === 'kg' && item.unit === 'gm' ? item.sellingPrice / 1000 : 
                                item.sellingPrice;

      const itemTotal = sellPriceInBaseUnit * effectiveQty;
      const itemProfit = (sellPriceInBaseUnit - buyPrice) * effectiveQty;
      
      subtotal += itemTotal;
      totalProfit += itemProfit;
      
      return { ...item, quantity: effectiveQty, sellingPrice: sellPriceInBaseUnit }; 
    });

    return { subtotal, totalProfit, normalizedItems };
  }, [cart]);

  const handleCheckout = () => {
    actions.addSale({
      total: cartSummary.subtotal,
      profit: cartSummary.totalProfit,
      items: cartSummary.normalizedItems,
    })
    toast({ 
      title: language === 'en' ? "Sale Successful" : "বিক্রয় সম্পন্ন হয়েছে", 
      description: `${t.finalTotal}: ${currency}${cartSummary.subtotal.toLocaleString()}` 
    })
    setCart([])
    setIsSummaryOpen(false)
    setIsSaleDialogOpen(false)
  }

  const handleAuthorizedDelete = () => {
    if (deletePass === "specsxr") {
      if (deleteId && deleteType === 'sale') {
        actions.deleteSale(deleteId)
        toast({ title: "Sale Reversed & Removed" })
      } else if (deleteId && deleteType === 'procurement') {
        actions.deleteProcurement(deleteId)
        toast({ title: "Procurement Reversed & Removed" })
      }
      setDeleteId(null)
      setDeleteType(null)
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
            <Button size="lg" className="bg-accent hover:bg-accent/90 shadow-lg gap-2 text-base md:text-lg h-12 md:h-14 px-6 md:px-8 w-full sm:w-auto font-black uppercase">
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" /> {t.createNewSale}
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-[800px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-accent/20 shadow-2xl rounded-[2.5rem]">
            <DialogHeader className="p-6 border-b bg-accent/5 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-xl">
                    <ShoppingCart className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-black text-primary">Sale Terminal</DialogTitle>
                    <DialogDescription className="text-[10px] uppercase font-black tracking-widest opacity-60">
                      Pick products to create a bill
                    </DialogDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white/50 hover:bg-destructive hover:text-white transition-all shadow-sm" onClick={() => setIsSaleDialogOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-hidden flex flex-col bg-white">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder={t.search} 
                    className="pl-9 h-12 border-accent/10 rounded-xl bg-accent/5 focus-visible:ring-accent font-bold" 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                  />
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {products
                    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
                    .map((item) => {
                      const profitPerUnit = (item.sellingPrice || 0) - (item.purchasePrice || 0);
                      return (
                        <div 
                          key={item.id} 
                          className="p-4 border rounded-2xl bg-white flex flex-col gap-3 hover:border-accent hover:shadow-lg transition-all cursor-pointer group active:scale-[0.98]" 
                          onClick={() => addToCart(item)}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-black text-primary truncate leading-tight">{item.name}</p>
                              <p className="text-[9px] font-bold text-accent uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                <Tag className="w-2.5 h-2.5" /> {item.category || 'General'}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-[8px] font-bold bg-blue-50 border-blue-100 text-blue-700 shrink-0">
                              {t.stock}: {item.stock} {item.unit}
                            </Badge>
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

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="h-6 w-6 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                <TrendingUp className="w-3 h-3 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-[8px] font-bold text-emerald-600 uppercase leading-none">Profit/Unit</p>
                                <p className="text-[10px] font-black text-emerald-700">+{currency}{profitPerUnit.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="p-2 rounded-full bg-accent/10 group-hover:bg-accent group-hover:text-white transition-colors">
                              <Plus className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </ScrollArea>

              <div className="p-6 border-t bg-accent/5 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">Cart Items</p>
                  <p className="text-xl font-black text-primary">{cart.length} Products</p>
                </div>
                <Button 
                  disabled={cart.length === 0}
                  onClick={() => setIsSummaryOpen(true)}
                  className="h-14 px-8 bg-accent hover:bg-accent/90 text-white font-black uppercase text-sm rounded-2xl shadow-xl gap-2 active:scale-95"
                >
                  <FileText className="w-5 h-5" /> View Bill & Pay
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow border-accent/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-1 md:pb-2">
              <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground truncate uppercase tracking-widest">{stat.label}</CardTitle>
              <stat.icon className={`h-3 w-3 md:h-4 md:w-4 ${stat.color} shrink-0`} />
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="text-lg md:text-2xl font-black">{stat.value}</div>
              <p className="text-[8px] md:text-xs text-muted-foreground flex items-center gap-1 pt-0.5">
                <ArrowUp className="h-2 w-2 md:h-3 md:w-3 text-green-600 rotate-45" />
                <span className="text-green-600 font-bold">{t.stable}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-accent/10 shadow-lg flex flex-col h-[500px]">
          <CardHeader className="p-4 md:p-6 pb-2 md:pb-4 bg-accent/5 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  <Target className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                  {language === 'en' ? 'Inventory A-Z Profit Report' : 'পণ্যের বিস্তারিত লাভ বিশ্লেষণ'}
                </CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold opacity-60 mt-1">
                  {language === 'en' ? 'A to Z Business Insight' : 'প্রতিটি পণ্যের পূর্ণাঙ্গ রিপোর্ট'}
                </CardDescription>
              </div>
              <Badge className="bg-accent text-white border-none text-[10px] uppercase font-black tracking-widest">{language === 'en' ? 'Live' : 'লাইভ'}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {productProfitData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground opacity-30 gap-2">
                  <BarChart2 className="w-10 h-10" />
                  <p className="text-xs italic">{language === 'en' ? 'No sales data yet' : 'এখনো কোনো বিক্রয় তথ্য নেই'}</p>
                </div>
              ) : (
                <div className="divide-y divide-black/5">
                  {productProfitData.map((item, idx) => {
                    const profitMargin = item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(1) : 0;
                    return (
                      <div 
                        key={idx} 
                        className="p-4 hover:bg-accent/5 transition-all group cursor-pointer active:scale-[0.98]"
                        onClick={() => {
                          const fullProduct = products.find(p => p.id === item.id || p.name === item.name);
                          setViewProduct({ ...item, ...fullProduct });
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                              #{idx + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-primary truncate group-hover:text-accent transition-colors">{item.name}</p>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase">{language === 'en' ? 'Units Sold' : 'বিক্রিত সংখ্যা'}: {item.qty} {item.unit}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-green-600">+{currency}{item.profit.toLocaleString()}</p>
                            <div className="flex items-center gap-1 justify-end">
                              <ArrowUpCircle className="w-2.5 h-2.5 text-green-500" />
                              <span className="text-[8px] font-black text-green-500 uppercase tracking-tighter">Net Profit</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div className="bg-muted/30 p-2 rounded-lg border border-black/5 text-center">
                            <p className="text-[8px] font-bold uppercase opacity-50 mb-0.5">{language === 'en' ? 'Revenue' : 'মোট বিক্রি'}</p>
                            <p className="text-[10px] font-black text-primary">{currency}{item.revenue.toLocaleString()}</p>
                          </div>
                          <div className="bg-muted/30 p-2 rounded-lg border border-black/5 text-center">
                            <p className="text-[8px] font-bold uppercase opacity-50 mb-0.5">{language === 'en' ? 'Total Cost' : 'মোট কেনা'}</p>
                            <p className="text-[10px] font-black text-orange-600">{currency}{item.cost.toLocaleString()}</p>
                          </div>
                          <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100 text-center">
                            <p className="text-[8px] font-black uppercase text-emerald-600 mb-0.5">{language === 'en' ? 'Margin' : 'লাভের হার'}</p>
                            <p className="text-[10px] font-black text-emerald-700">{profitMargin}%</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-accent/10 flex flex-col h-[500px]">
          <CardHeader className="p-4 md:p-6 pb-2 md:pb-4 shrink-0 bg-muted/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm md:text-base flex items-center gap-2"><History className="w-4 h-4 md:w-5 md:h-5 text-accent" /> {t.recentActivity}</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase opacity-60">A to Z history of all transactions.</CardDescription>
              </div>
              <Badge variant="outline" className="text-[9px] h-5 border-accent/20 text-accent font-black uppercase">{allActivities.length} Records</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {allActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                  <Clock className="w-6 h-6 md:w-8 md:h-8 opacity-20" />
                  <p className="text-xs italic">{t.noTransactions}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {allActivities.map((activity, i) => (
                    <div key={activity.id || i} className="flex items-center justify-between p-4 hover:bg-muted/5 transition-all group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "p-2 rounded-full shrink-0",
                          activity.activityType === 'sale' 
                            ? (activity.isBakiPayment ? "bg-blue-100" : "bg-emerald-100") 
                            : "bg-orange-100"
                        )}>
                          {activity.activityType === 'sale' ? (
                            activity.isBakiPayment ? <ArrowDownCircle className="w-4 h-4 text-blue-600" /> : <Receipt className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <PackageSearch className="w-4 h-4 text-orange-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">
                            {activity.activityType === 'sale' 
                              ? (activity.isBakiPayment ? `Baki Payment: ${activity.bakiProductName}` : (activity.items?.[0]?.name || 'Sale') + (activity.items?.length > 1 ? ` + ${activity.items.length - 1}` : ''))
                              : `Stock Buy: ${activity.productName}`
                            }
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-[9px] text-muted-foreground">{new Date(activity.timestamp).toLocaleDateString()}</p>
                            {activity.isBakiPayment && <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[8px] h-4">Paid</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-black">{currency}{activity.activityType === 'sale' ? activity.total?.toLocaleString() : activity.totalCost?.toLocaleString()}</p>
                          <p className="text-[8px] uppercase font-bold opacity-40">{activity.activityType}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                          onClick={() => {
                            setDeleteId(activity.id);
                            setDeleteType(activity.activityType);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[550px] p-0 overflow-hidden border-accent/20 shadow-2xl rounded-3xl">
          <DialogHeader className="p-6 bg-accent/5 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-xl">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black text-primary">{t.billSummary}</DialogTitle>
                  <DialogDescription className="text-[10px] uppercase font-black tracking-widest opacity-60">Final Checkout Confirmation</DialogDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white/50 hover:bg-destructive hover:text-white transition-all shadow-sm" onClick={() => setIsSummaryOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>
          
          <ScrollArea className="max-h-[50vh]">
            <div className="p-6 space-y-8">
              {cart.map((item) => {
                const isWeightBased = item.unit === 'kg' || item.unit === 'gm';
                const displayUnit = item.selectedUnit || item.unit;
                
                let factor = 1;
                if (item.unit === 'kg' && displayUnit === 'gm') factor = 0.001;
                if (item.unit === 'gm' && displayUnit === 'kg') factor = 1000;

                const effectiveQty = item.quantity * factor;
                const sellPriceInBaseUnit = item.selectedUnit === 'gm' && item.unit === 'kg' ? item.sellingPrice * 1000 : 
                                item.selectedUnit === 'kg' && item.unit === 'gm' ? item.sellingPrice / 1000 : 
                                item.sellingPrice;

                const itemTotal = sellPriceInBaseUnit * effectiveQty;
                const itemProfit = (sellPriceInBaseUnit - (item.purchasePrice || 0)) * effectiveQty;

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
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 shrink-0" onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground">Qty ({displayUnit})</Label>
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
                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Unit Price ({currency})</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          className="h-11 bg-accent/5 border-accent/10 text-lg font-black text-accent" 
                          value={item.sellingPrice} 
                          onChange={(e) => updateUnitPrice(item.id, e.target.value)} 
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <div className="flex-1 px-4 py-2.5 bg-muted/30 rounded-xl border border-muted flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase text-muted-foreground">Item Total</span>
                        <span className="text-sm font-black text-primary">{currency}{itemTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex-1 px-4 py-2.5 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase text-emerald-600">Lav</span>
                        <span className="text-sm font-black text-emerald-700">+{currency}{itemProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="p-6 bg-muted/30 border-t space-y-4">
            <div className="flex justify-between items-center px-6 py-4 bg-primary text-white rounded-2xl shadow-xl">
              <div>
                <p className="text-[10px] font-black uppercase opacity-70">Payable Total</p>
                <p className="text-2xl font-black">{currency}{cartSummary.subtotal.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase opacity-70">Total Profit</p>
                <p className="text-sm font-black text-accent-foreground">+{currency}{cartSummary.totalProfit.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase" onClick={() => setIsSummaryOpen(false)}>Back</Button>
              <Button className="flex-[2] h-14 bg-teal-700 hover:bg-teal-800 text-white font-black uppercase rounded-2xl shadow-xl gap-2" onClick={handleCheckout}>
                <CheckCircle2 className="w-5 h-5" /> Complete Sale
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewProduct} onOpenChange={(open) => !open && setViewProduct(null)}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-accent/20 shadow-2xl">
          <div className="bg-primary text-white p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Package className="w-8 h-8 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-xl md:text-2xl font-black truncate leading-tight">{viewProduct?.name}</DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-accent text-white border-none text-[9px] font-black uppercase tracking-widest h-5">{viewProduct?.category || 'General'}</Badge>
                    <span className="text-[10px] font-bold opacity-60 uppercase">{viewProduct?.id?.slice(-8)}</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white/10 hover:bg-destructive hover:text-white transition-all border border-white/20" onClick={() => setViewProduct(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8 bg-white max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-accent" /> Financial Performance
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <p className="text-[9px] font-bold text-emerald-600 uppercase mb-1">Total Net Profit</p>
                  <p className="text-2xl font-black text-emerald-700">{currency}{viewProduct?.profit?.toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <p className="text-[9px] font-bold text-blue-600 uppercase mb-1">Profit Margin</p>
                  <p className="text-2xl font-black text-blue-700">{viewProduct?.revenue > 0 ? ((viewProduct.profit / viewProduct.revenue) * 100).toFixed(1) : 0}%</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-xl bg-muted/30 border border-black/5">
                  <p className="text-[8px] font-bold text-muted-foreground uppercase">Revenue</p>
                  <p className="text-xs font-black text-primary">{currency}{viewProduct?.revenue?.toLocaleString()}</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-muted/30 border border-black/5">
                  <p className="text-[8px] font-bold text-muted-foreground uppercase">Cost</p>
                  <p className="text-xs font-black text-orange-600">{currency}{viewProduct?.cost?.toLocaleString()}</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-muted/30 border border-black/5">
                  <p className="text-[8px] font-bold text-muted-foreground uppercase">Sold Qty</p>
                  <p className="text-xs font-black text-accent">{viewProduct?.qty} {viewProduct?.unit}</p>
                </div>
              </div>
            </div>

            <Separator className="opacity-50" />

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Layers className="w-3 h-3 text-accent" /> Inventory A-to-Z Info
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-accent/5 rounded-lg border border-accent/10"><Tag className="w-4 h-4 text-accent" /></div>
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">Unit Pricing</p>
                      <p className="text-sm font-black text-primary">Buy: {currency}{viewProduct?.purchasePrice || 0}</p>
                      <p className="text-sm font-black text-accent">Sell: {currency}{viewProduct?.sellingPrice || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-accent/5 rounded-lg border border-accent/10"><Package className="w-4 h-4 text-accent" /></div>
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">Current Stock</p>
                      <p className={cn(
                        "text-lg font-black",
                        (viewProduct?.stock || 0) < 5 ? "text-destructive" : "text-green-600"
                      )}>
                        {viewProduct?.stock || 0} {viewProduct?.unit || 'Units'} Left
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-accent/5 rounded-lg border border-accent/10"><FileText className="w-4 h-4 text-accent" /></div>
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">Detailed Info</p>
                      <p className="text-xs font-medium text-primary">Unit Type: {viewProduct?.unit || 'N/A'}</p>
                      <p className="text-xs font-medium text-primary">Alert Min: {viewProduct?.alertThreshold || 5}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-accent/5 rounded-lg border border-accent/10"><CreditCard className="w-4 h-4 text-accent" /></div>
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">Warehouse Value</p>
                      <p className="text-sm font-black text-primary">{currency}{((viewProduct?.stock || 0) * (viewProduct?.purchasePrice || 0)).toLocaleString()}</p>
                      <p className="text-[8px] font-bold text-muted-foreground italic">(At cost price)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 bg-muted/20 border-t flex-row justify-center gap-4">
            <Button variant="outline" className="flex-1 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-accent/20 text-accent hover:bg-accent/5" onClick={() => setViewProduct(null)}>
              Close Audit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(open) => { if(!open) { setDeleteId(null); setDeleteType(null); setDeletePass(""); } }}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-destructive font-black uppercase">
                <Lock className="w-5 h-5" /> Reverse & Delete
              </DialogTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setDeleteId(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <DialogDescription className="text-xs font-bold text-muted-foreground">
              {language === 'en' 
                ? 'This action will reverse inventory/balance changes and remove the record forever. Enter password to confirm.'
                : 'এই অ্যাকশনটি ইনভেন্টরি বা কাস্টমার ব্যালেন্স রিভার্স করবে এবং রেকর্ডটি চিরতরে মুছে ফেলবে।'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label className="text-[10px] font-black uppercase opacity-70">Master Access Key</Label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              className="h-12 text-lg font-bold rounded-xl"
              value={deletePass}
              onChange={e => setDeletePass(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="destructive" className="w-full h-12 text-base font-black uppercase rounded-xl shadow-lg" onClick={handleAuthorizedDelete}>
              Authorize & Reverse Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
