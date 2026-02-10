"use client"

import { useState, useMemo } from "react"
import { 
  BarChart3, 
  TrendingUp, 
  Sparkles, 
  Clock,
  ShieldCheck,
  Search,
  Activity,
  ArrowUpRight,
  Trash2,
  Lock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { analyzeBusinessHealth, type AnalyzeBusinessHealthOutput } from "@/ai/flows/analyze-business-health"
import { useToast } from "@/hooks/use-toast"
import { useBusinessData } from "@/hooks/use-business-data"
import { translations } from "@/lib/translations"
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, eachDayOfInterval, eachMonthOfInterval, isSameDay, isSameMonth } from "date-fns"
import { cn } from "@/lib/utils"

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
  
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month" | "year">("week")
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

  // Metrics
  const metrics = useMemo(() => {
    const revenue = filteredSales.reduce((acc, s) => acc + (s.total || 0), 0)
    const profit = filteredSales.reduce((acc, s) => acc + (s.profit || 0), 0)
    const count = filteredSales.length
    const avgTicket = count > 0 ? revenue / count : 0
    const efficiency = revenue > 0 ? (profit / revenue) * 100 : 0

    return { revenue, profit, count, avgTicket, efficiency }
  }, [filteredSales])

  // Chart Data
  const chartData = useMemo(() => {
    const now = new Date()
    let start: Date, end: Date
    let steps: Date[]

    if (timeRange === "day") {
      return Array.from({ length: 24 }, (_, i) => {
        const hourSales = filteredSales.filter(s => new Date(s.saleDate).getHours() === i)
        return {
          name: `${i}:00`,
          revenue: hourSales.reduce((sum, s) => sum + (s.total || 0), 0),
          profit: hourSales.reduce((sum, s) => sum + (s.profit || 0), 0)
        }
      })
    }

    if (timeRange === "week") {
      start = startOfWeek(now); end = endOfWeek(now)
      steps = eachDayOfInterval({ start, end })
    } else if (timeRange === "month") {
      start = startOfMonth(now); end = endOfMonth(now)
      steps = eachDayOfInterval({ start, end })
    } else {
      start = startOfYear(now); end = endOfYear(now)
      return eachMonthOfInterval({ start, end }).map(month => {
        const monthSales = filteredSales.filter(s => isSameMonth(new Date(s.saleDate), month))
        return {
          name: format(month, "MMM"),
          revenue: monthSales.reduce((sum, s) => sum + (s.total || 0), 0),
          profit: monthSales.reduce((sum, s) => sum + (s.profit || 0), 0)
        }
      })
    }

    return steps.map(day => {
      const daySales = filteredSales.filter(s => isSameDay(new Date(s.saleDate), day))
      return {
        name: format(day, "MMM dd"),
        revenue: daySales.reduce((sum, s) => sum + (s.total || 0), 0),
        profit: daySales.reduce((sum, s) => sum + (s.profit || 0), 0)
      }
    })
  }, [filteredSales, timeRange])

  const handleRunAudit = async () => {
    if (products.length === 0) {
      toast({ title: t.noData, variant: "destructive" })
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
        potentialProfit: products.reduce((acc, p) => acc + (((p.sellingPrice || 0) - (p.purchasePrice || 0)) * (p.stock || 0)), 0),
        language: language
      })
      setAuditResult(result)
      toast({ title: t.auditComplete })
    } catch (error) {
      toast({ title: t.auditFailed, variant: "destructive" })
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-accent" /> {t.intelligenceReports}
          </h2>
          <p className="text-sm text-muted-foreground">{t.salesTrackingDesc}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <Tabs value={timeRange} onValueChange={(val: any) => setTimeRange(val)} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-4 w-full sm:w-[320px] bg-muted/50 p-1">
              <TabsTrigger value="day" className="text-xs">Day</TabsTrigger>
              <TabsTrigger value="week" className="text-xs">Week</TabsTrigger>
              <TabsTrigger value="month" className="text-xs">Month</TabsTrigger>
              <TabsTrigger value="year" className="text-xs">Year</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button className="bg-accent hover:bg-accent/90 gap-2 w-full sm:w-auto shadow-lg h-10" onClick={handleRunAudit} disabled={isAuditing || products.length === 0}>
            <Sparkles className="w-4 h-4" />
            {isAuditing ? t.thinking : t.aiHealthAudit}
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary text-white border-none shadow-lg overflow-hidden group">
          <CardHeader className="p-4 pb-0">
            <CardDescription className="text-white/70 text-[10px] uppercase font-bold tracking-widest">{t.revenue} ({timeRange})</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-2xl font-black truncate">{currency}{metrics.revenue.toLocaleString()}</div>
            <p className="text-[10px] text-white/60 mt-1 flex items-center gap-1">
              <Activity className="w-3 h-3" /> {t.sales}: {metrics.count}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-accent text-white border-none shadow-lg overflow-hidden group">
          <CardHeader className="p-4 pb-0">
            <CardDescription className="text-white/70 text-[10px] uppercase font-bold tracking-widest">{t.netProfit} ({timeRange})</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-2xl font-black truncate">{currency}{metrics.profit.toLocaleString()}</div>
            <p className="text-[10px] text-white/60 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Efficiency: {metrics.efficiency.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-600 text-white border-none shadow-lg overflow-hidden group">
          <CardHeader className="p-4 pb-0">
            <CardDescription className="text-white/70 text-[10px] uppercase font-bold tracking-widest">{t.avgTransaction}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-2xl font-black truncate">{currency}{metrics.avgTicket.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            <p className="text-[10px] text-white/60 mt-1">{t.revenuePerOrder}</p>
          </CardContent>
        </Card>

        <Card className="bg-muted/50 border-accent/10 shadow-sm overflow-hidden group">
          <CardHeader className="p-4 pb-0">
            <CardDescription className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">{t.growthForecast}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-2xl font-black text-primary">{t.stable}</div>
            <p className="text-[10px] text-muted-foreground mt-1 italic">Based on {timeRange} trends</p>
          </CardContent>
        </Card>
      </div>

      {auditResult && (
        <Card className="border-accent/20 shadow-xl overflow-hidden bg-white animate-in zoom-in-95 duration-500">
          <div className="bg-primary text-white p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-accent" /> {language === 'bn' ? 'এআই হেলথ অডিট রিপোর্ট' : 'AI Health Audit Report'}
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
                 <h4 className="text-sm font-bold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-accent" /> {language === 'bn' ? 'সারসংক্ষেপ' : 'Executive Summary'}</h4>
                 <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-accent pl-4">"{auditResult.summary}"</p>
               </div>
               <div className="space-y-4">
                 <h4 className="text-sm font-bold flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-blue-500" /> {language === 'bn' ? 'পরামর্শসমূহ' : 'Recommendations'}</h4>
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

      {/* Timeline Section with Advanced BarChart */}
      <Card className="shadow-lg border-accent/10 overflow-hidden bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/5 p-4">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold">{t.performanceTimeline}</CardTitle>
            <CardDescription className="text-[10px]">{t.revVsProfit} ({timeRange})</CardDescription>
          </div>
          <Badge variant="outline" className="text-[9px] bg-white border-accent/20 text-accent font-bold">Live Data</Badge>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[350px] w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <RechartsBarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={8}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.4}/>
                  </linearGradient>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.08} />
                <XAxis 
                  dataKey="name" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                  tickFormatter={(val) => `${currency}${val}`}
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                  content={<ChartTooltipContent />} 
                />
                <Bar 
                  dataKey="revenue" 
                  fill="url(#revenueGradient)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={20}
                  activeBar={{ opacity: 1, stroke: 'hsl(var(--accent))', strokeWidth: 1 }}
                />
                <Bar 
                  dataKey="profit" 
                  fill="url(#profitGradient)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={20}
                  activeBar={{ opacity: 1, stroke: 'hsl(var(--primary))', strokeWidth: 1 }}
                />
              </RechartsBarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* Report Breakdown List */}
      <Card className="border-accent/10 shadow-sm overflow-hidden bg-white">
        <CardHeader className="p-4 border-b bg-muted/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" /> {t.reportBreakdown}
            </CardTitle>
            <CardDescription className="text-[10px]">{t.allTransactionsPeriod}</CardDescription>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder={t.searchHistory} 
              className="pl-9 h-9 bg-white" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {finalSalesList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
              <Activity className="w-12 h-12 opacity-10" />
              <p className="text-xs italic">{t.noTransactions}</p>
            </div>
          ) : (
            <div className="divide-y divide-accent/5">
              {finalSalesList.map((sale) => (
                <div key={sale.id} className="group flex items-center justify-between p-4 hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-primary truncate leading-tight">
                        {sale.isBakiPayment 
                          ? `Payment: ${sale.bakiProductName}` 
                          : sale.items?.map((i: any) => i.name).join(', ') || 'Sale Record'}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                        {format(new Date(sale.saleDate), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-black text-primary">{currency}{sale.total?.toLocaleString()}</p>
                      {!sale.isBakiPayment && (
                        <p className={cn(
                          "text-[10px] font-bold flex items-center justify-end gap-1",
                          sale.profit < 0 ? "text-destructive" : "text-green-600"
                        )}>
                          <TrendingUp className="w-3 h-3" />
                          {sale.profit < 0 ? '-' : '+'}{currency}{Math.abs(sale.profit || 0).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all" onClick={() => setDeleteId(sale.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
