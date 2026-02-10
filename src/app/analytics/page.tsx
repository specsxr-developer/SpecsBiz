"use client"

import { useState, useMemo } from "react"
import { 
  BarChart3, 
  TrendingUp, 
  Sparkles, 
  BarChart as BarChartIcon, 
  PieChart,
  Target,
  Inbox,
  ShieldCheck,
  Calendar,
  DollarSign,
  ShoppingCart,
  ArrowUpRight,
  Clock,
  ChevronRight,
  Trash2,
  Lock,
  Receipt,
  Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartConfig 
} from "@/components/ui/chart"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from "recharts"
import { analyzeBusinessHealth, type AnalyzeBusinessHealthOutput } from "@/ai/flows/analyze-business-health"
import { useToast } from "@/hooks/use-toast"
import { useBusinessData } from "@/hooks/use-business-data"
import { translations } from "@/lib/translations"
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, subDays, eachDayOfInterval, eachMonthOfInterval, isSameDay, isSameMonth } from "date-fns"

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--accent))",
  },
  profit: {
    label: "Profit",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export default function AnalyticsPage() {
  const { toast } = useToast()
  const { sales, products, isLoading, currency, actions, language } = useBusinessData()
  const t = translations[language]
  
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month" | "year">("month")
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditResult, setAuditResult] = useState<AnalyzeBusinessHealthOutput | null>(null)
  const [search, setSearch] = useState("")

  // Deletion Password Protection
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deletePass, setDeletePass] = useState("")

  // Filter sales based on time range
  const filteredSales = useMemo(() => {
    const now = new Date()
    let start: Date, end: Date

    switch (timeRange) {
      case "day":
        start = startOfDay(now); end = endOfDay(now); break
      case "week":
        start = startOfWeek(now); end = endOfWeek(now); break
      case "month":
        start = startOfMonth(now); end = endOfMonth(now); break
      case "year":
        start = startOfYear(now); end = endOfYear(now); break
      default:
        start = startOfMonth(now); end = endOfMonth(now)
    }

    return sales.filter(s => {
      const saleDate = new Date(s.saleDate)
      return isWithinInterval(saleDate, { start, end })
    })
  }, [sales, timeRange])

  // Chart Data preparation
  const chartData = useMemo(() => {
    const now = new Date()
    
    if (timeRange === "day") {
      const hours = Array.from({ length: 24 }, (_, i) => ({
        name: `${i}:00`,
        revenue: 0,
        profit: 0
      }))
      filteredSales.forEach(s => {
        const hour = new Date(s.saleDate).getHours()
        hours[hour].revenue += (s.total || 0)
        hours[hour].profit += (s.profit || 0)
      })
      return hours
    }

    if (timeRange === "week" || timeRange === "month") {
      const start = timeRange === "week" ? startOfWeek(now) : startOfMonth(now)
      const end = timeRange === "week" ? endOfWeek(now) : endOfMonth(now)
      const days = eachDayOfInterval({ start, end })
      
      return days.map(day => {
        const daySales = filteredSales.filter(s => isSameDay(new Date(s.saleDate), day))
        return {
          name: format(day, "MMM dd"),
          revenue: daySales.reduce((sum, s) => sum + (s.total || 0), 0),
          profit: daySales.reduce((sum, s) => sum + (s.profit || 0), 0)
        }
      })
    }

    const months = eachMonthOfInterval({ start: startOfYear(now), end: endOfYear(now) })
    return months.map(month => {
      const monthSales = filteredSales.filter(s => isSameMonth(new Date(s.saleDate), month))
      return {
        name: format(month, "MMM"),
        revenue: monthSales.reduce((sum, s) => sum + (s.total || 0), 0),
        profit: monthSales.reduce((sum, s) => sum + (s.profit || 0), 0)
      }
    })
  }, [filteredSales, timeRange])

  const metrics = useMemo(() => {
    const revenue = filteredSales.reduce((acc, s) => acc + (s.total || 0), 0)
    const profit = filteredSales.reduce((acc, s) => acc + (s.profit || 0), 0)
    const count = filteredSales.length
    const avgTicket = count > 0 ? revenue / count : 0

    return { revenue, profit, count, avgTicket }
  }, [filteredSales])

  const handleRunAudit = async () => {
    if (products.length === 0) {
      toast({ title: "No Inventory", variant: "destructive" })
      return
    }

    setIsAuditing(true)
    try {
      const inventorySummary = products.map(p => `${p.name} (Stock: ${p.stock})`).join(", ")
      const salesSummary = filteredSales.slice(0, 10).map(s => `Sale: ${currency}${s.total}`).join(", ")
      
      const result = await analyzeBusinessHealth({
        inventoryData: inventorySummary,
        salesData: salesSummary,
        totalInvestment: products.reduce((acc, p) => acc + ((p.purchasePrice || 0) * (p.stock || 0)), 0),
        potentialProfit: products.reduce((acc, p) => acc + (((p.sellingPrice || 0) - (p.purchasePrice || 0)) * (p.stock || 0)), 0)
      })
      
      setAuditResult(result)
      toast({ title: "Audit Complete" })
    } catch (error) {
      toast({ title: "Audit Failed", variant: "destructive" })
    } finally {
      setIsAuditing(false)
    }
  }

  const handleDeleteSale = () => {
    if (deletePass === "specsxr") {
      if (deleteId) {
        actions.deleteSale(deleteId)
        toast({ title: language === 'en' ? "Removed Successfully" : "ডিলিট সম্পন্ন হয়েছে" })
      }
      setDeleteId(null)
      setDeletePass("")
    } else {
      toast({ variant: "destructive", title: "Authorization Failed" })
      setDeletePass("")
    }
  }

  const finalSalesList = useMemo(() => {
    return filteredSales.filter(s => {
      const details = s.items?.map((i: any) => i.name).join(' ') || "";
      return details.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase());
    })
  }, [filteredSales, search]);

  if (isLoading) return <div className="p-10 text-center animate-pulse text-accent font-bold">{t.loading}</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-accent" /> {t.analytics}
          </h2>
          <p className="text-sm text-muted-foreground">{t.masterLedgerDesc}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <Tabs value={timeRange} onValueChange={(val: any) => setTimeRange(val)} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-4 w-full sm:w-[320px] bg-muted/50 p-1">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button className="bg-accent hover:bg-accent/90 gap-2 w-full sm:w-auto shadow-lg" onClick={handleRunAudit} disabled={isAuditing || products.length === 0}>
            <Sparkles className="w-4 h-4" />
            {isAuditing ? t.thinking : "AI Health Audit"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary text-white border-none shadow-lg overflow-hidden group">
          <CardHeader className="p-4 pb-0 relative">
            <CardDescription className="text-white/70 text-[10px] uppercase font-bold tracking-widest">{t.revenue} ({timeRange})</CardDescription>
            <DollarSign className="absolute top-4 right-4 w-8 h-8 opacity-10 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-2xl font-black truncate">{currency}{metrics.revenue.toLocaleString() ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-accent text-white border-none shadow-lg overflow-hidden group">
          <CardHeader className="p-4 pb-0 relative">
            <CardDescription className="text-white/70 text-[10px] uppercase font-bold tracking-widest">{t.totalLav} ({timeRange})</CardDescription>
            <TrendingUp className="absolute top-4 right-4 w-8 h-8 opacity-10 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-2xl font-black truncate">{currency}{metrics.profit.toLocaleString() ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-accent/10 shadow-sm overflow-hidden group">
          <CardHeader className="p-4 pb-0 relative">
            <CardDescription className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">{t.sales} ({timeRange})</CardDescription>
            <ShoppingCart className="absolute top-4 right-4 w-8 h-8 text-accent opacity-10 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-2xl font-black text-primary">{metrics.count} Orders</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-accent/10 shadow-sm overflow-hidden group">
          <CardHeader className="p-4 pb-0 relative">
            <CardDescription className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">Avg. Ticket</CardDescription>
            <PieChart className="absolute top-4 right-4 w-8 h-8 text-primary opacity-10 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-2xl font-black text-primary">{currency}{metrics.avgTicket.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </CardContent>
        </Card>
      </div>

      {auditResult && (
        <Card className="border-accent/20 shadow-xl overflow-hidden bg-white animate-in zoom-in-95 duration-500">
          <div className="bg-primary text-white p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-accent" /> AI Health Audit Report
                </CardTitle>
                <CardDescription className="text-primary-foreground/70">Strategic business optimization analysis.</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">Health Score</p>
                <p className="text-4xl font-black text-accent">{auditResult.healthScore}%</p>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
             <div className="grid md:grid-cols-2 gap-8">
               <div className="space-y-4">
                 <h4 className="text-sm font-bold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-accent" /> Executive Summary</h4>
                 <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-accent pl-4">"{auditResult.summary}"</p>
               </div>
               <div className="space-y-4">
                 <h4 className="text-sm font-bold flex items-center gap-2"><Target className="w-4 h-4 text-blue-500" /> Recommendations</h4>
                 <div className="grid gap-2">
                   {auditResult.recommendations.map((rec, i) => (
                     <div key={i} className="text-[11px] bg-muted/30 p-2 rounded-lg flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-accent mt-1.5 shrink-0" />
                        {rec}
                     </div>
                   ))}
                 </div>
               </div>
             </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg border-accent/10 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10">
          <div>
            <CardTitle className="text-lg">Performance Trends</CardTitle>
            <CardDescription className="text-xs">Visualizing revenue and profit metrics over time.</CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px] bg-white border-accent/20 text-accent font-bold">LIVE SYNC</Badge>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[350px] w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-profit)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-profit)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                <Area type="monotone" dataKey="profit" stroke="var(--color-profit)" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={3} />
              </AreaChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-accent/10 shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b bg-muted/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" /> Sales History
          </CardTitle>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search history..." 
              className="pl-9 h-9 bg-white" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {finalSalesList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
              <Inbox className="w-12 h-12 opacity-10" />
              <p className="text-xs italic">{t.noTransactions}</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-[10px] uppercase font-bold pl-6">{t.date}</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Transaction Details</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">{t.revenue}</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">{t.totalLav}</TableHead>
                  <TableHead className="text-right pr-6 text-[10px] uppercase font-bold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finalSalesList.map((sale) => (
                  <TableRow key={sale.id} className="group hover:bg-accent/5">
                    <TableCell className="pl-6 py-4 text-xs font-medium">
                      {new Date(sale.saleDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-primary truncate max-w-[200px]">
                          {sale.isBakiPayment 
                            ? `Payment: ${sale.bakiProductName}` 
                            : sale.items?.map((i: any) => i.name).join(', ') || 'Sale Record'}
                        </span>
                        <span className="text-[9px] text-muted-foreground opacity-60">ID: #{sale.id.slice(-6)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-black">{currency}{sale.total?.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-bold ${sale.profit < 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {sale.profit < 0 ? '-' : '+'}{currency}{Math.abs(sale.profit || 0).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all" onClick={() => setDeleteId(sale.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Lock className="w-5 h-5" /> {t.historyProtection}
            </DialogTitle>
            <DialogDescription>{t.deleteSaleDesc}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label className="text-xs font-bold uppercase opacity-70">{t.secretKey}</Label>
            <Input type="password" placeholder="••••••••" className="h-12 text-lg font-bold" value={deletePass} onChange={e => setDeletePass(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="destructive" className="w-full h-12 text-base font-bold" onClick={handleDeleteSale}>
              {t.authorizeDelete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
