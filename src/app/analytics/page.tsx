
"use client"

import { useState, useMemo } from "react"
import { 
  BarChart3, 
  TrendingUp, 
  Sparkles, 
  BarChart, 
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
  Lock
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
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { analyzeBusinessHealth, type AnalyzeBusinessHealthOutput } from "@/ai/flows/analyze-business-health"
import { useToast } from "@/hooks/use-toast"
import { useBusinessData } from "@/hooks/use-business-data"
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
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month" | "year">("month")
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditResult, setAuditResult] = useState<AnalyzeBusinessHealthOutput | null>(null)

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
      // Hourly for today
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
      // Daily
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

    // Monthly for year
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

  // Key Metrics for filtered range
  const metrics = useMemo(() => {
    const revenue = filteredSales.reduce((acc, s) => acc + (s.total || 0), 0)
    const profit = filteredSales.reduce((acc, s) => acc + (s.profit || 0), 0)
    const count = filteredSales.length
    const avgTicket = count > 0 ? revenue / count : 0

    return { revenue, profit, count, avgTicket }
  }, [filteredSales])

  const handleRunAudit = async () => {
    if (products.length === 0) {
      toast({ title: "No Inventory", description: "Add products to run an audit.", variant: "destructive" })
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
        toast({ title: "Removed Successfully", description: "History updated and stock returned." })
      }
      setDeleteId(null)
      setDeletePass("")
    } else {
      toast({ variant: "destructive", title: "Authorization Failed", description: "Check your secret key." })
      setDeletePass("")
    }
  }

  if (isLoading) return <div className="p-10 text-center animate-pulse text-accent font-bold">Syncing Analytics Data...</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-accent" /> Intelligence Reports
          </h2>
          <p className="text-sm text-muted-foreground">Detailed sales and profit tracking system.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <Tabs value={timeRange} onValueChange={(val: any) => setTimeRange(val)} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-4 w-full sm:w-[320px] bg-muted/50 p-1">
              <TabsTrigger value="day" className="text-[10px] md:text-xs">Day</TabsTrigger>
              <TabsTrigger value="week" className="text-[10px] md:text-xs">Week</TabsTrigger>
              <TabsTrigger value="month" className="text-[10px] md:text-xs">Month</TabsTrigger>
              <TabsTrigger value="year" className="text-[10px] md:text-xs">Year</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button 
            className="bg-accent hover:bg-accent/90 gap-2 w-full sm:w-auto shadow-lg"
            onClick={handleRunAudit}
            disabled={isAuditing || products.length === 0}
          >
            <Sparkles className="w-4 h-4" />
            {isAuditing ? "Analyzing..." : "AI Health Audit"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary text-white border-none shadow-lg">
          <CardHeader className="p-4 pb-0">
            <CardDescription className="text-white/70 text-[10px] uppercase font-bold tracking-widest">Revenue ({timeRange})</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-2xl font-black">{currency}{metrics.revenue.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-[10px] mt-1 opacity-70">
              <TrendingUp className="w-3 h-3" /> Sales Volume: {metrics.count}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent text-white border-none shadow-lg">
          <CardHeader className="p-4 pb-0">
            <CardDescription className="text-white/70 text-[10px] uppercase font-bold tracking-widest">Net Profit ({timeRange})</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-2xl font-black">{currency}{metrics.profit.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-[10px] mt-1 opacity-70">
              <Target className="w-3 h-3" /> Efficiency: {metrics.revenue > 0 ? ((metrics.profit / metrics.revenue) * 100).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-600 text-white border-none shadow-lg">
          <CardHeader className="p-4 pb-0">
            <CardDescription className="text-white/70 text-[10px] uppercase font-bold tracking-widest">Avg Transaction</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-2xl font-black">{currency}{metrics.avgTicket.toFixed(2)}</div>
            <div className="text-[10px] mt-1 opacity-70">Revenue per order</div>
          </CardContent>
        </Card>

        <Card className="bg-muted text-foreground border-none shadow-md">
          <CardHeader className="p-4 pb-0">
            <CardDescription className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">Growth Forecast</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-2xl font-black text-primary">Stable</div>
            <div className="text-[10px] mt-1 text-muted-foreground italic">Based on {timeRange} trends</div>
          </CardContent>
        </Card>
      </div>

      {auditResult && (
        <Card className="border-accent/20 shadow-2xl overflow-hidden bg-white">
          <div className="bg-primary text-white p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-accent" /> AI Business Health Report
                </CardTitle>
                <CardDescription className="text-primary-foreground/70">Strategic analysis for {timeRange} data.</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">Health Score</p>
                <p className="text-4xl font-black text-accent">{auditResult.healthScore}%</p>
              </div>
            </div>
          </div>
          <CardContent className="p-6 space-y-6">
             <div className="grid md:grid-cols-2 gap-6">
               <div className="space-y-4">
                 <div>
                   <h4 className="text-sm font-bold flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-accent" /> Executive Summary</h4>
                   <p className="text-sm text-muted-foreground leading-relaxed italic">"{auditResult.summary}"</p>
                 </div>
                 <div>
                   <h4 className="text-sm font-bold flex items-center gap-2 mb-2">Recommendations</h4>
                   <ul className="space-y-2">
                     {auditResult.recommendations.map((rec, i) => (
                       <li key={i} className="text-xs flex items-start gap-2 bg-muted/30 p-2 rounded">
                         <div className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                         {rec}
                       </li>
                     ))}
                   </ul>
                 </div>
               </div>
               <div className="bg-muted/20 p-4 rounded-xl space-y-4">
                 <h4 className="text-sm font-bold flex items-center gap-2"><Target className="w-4 h-4 text-blue-500" /> Key Predictions</h4>
                 <div className="space-y-3">
                   {auditResult.predictions.map((pred, i) => (
                     <div key={i} className="p-3 border rounded-lg bg-white shadow-sm flex items-center gap-3">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <p className="text-[11px] font-medium">{pred}</p>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-1">
        <Card className="shadow-lg border-accent/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Performance Timeline</CardTitle>
              <CardDescription>Revenue vs Profit trends ({timeRange})</CardDescription>
            </div>
            <Badge variant="outline" className="text-accent border-accent/20 bg-accent/5">Live Data</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full mt-4">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="revenue" 
                      fill="var(--color-revenue)" 
                      radius={[4, 4, 0, 0]} 
                      barSize={timeRange === "year" ? 40 : 20}
                    />
                    <Bar 
                      dataKey="profit" 
                      fill="var(--color-profit)" 
                      radius={[4, 4, 0, 0]} 
                      barSize={timeRange === "year" ? 40 : 20}
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-accent/10 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" /> {timeRange.toUpperCase()} Report Breakdown (A-Z)
          </CardTitle>
          <CardDescription>All transactions recorded in this period.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSales.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground italic flex flex-col items-center gap-2">
              <Inbox className="w-8 h-8 opacity-20" />
              <p className="text-xs">No transactions found for this period.</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredSales.map((sale, i) => (
                <div key={sale.id || i} className="flex items-center justify-between p-4 hover:bg-muted/20 group transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-primary">
                        {sale.isBakiPayment 
                          ? `Baki Payment: ${sale.bakiProductName}` 
                          : (sale.items && sale.items.length > 0 
                              ? (sale.items.length === 1 ? sale.items[0].name : `${sale.items[0].name} (+${sale.items.length - 1})`)
                              : `Sale #${sale.id?.slice(-4)}`)
                        }
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                        <span>{format(new Date(sale.saleDate), "MMM dd, yyyy • hh:mm a")}</span>
                        {sale.isBakiPayment && <Badge variant="outline" className="text-[8px] h-4 bg-blue-50">Debt Clearance</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-black text-sm">{currency}{sale.total?.toLocaleString()}</div>
                      <div className="text-[10px] text-green-600 font-bold flex items-center justify-end gap-1">
                        <ArrowUpRight className="w-3 h-3" /> Profit: {currency}{sale.profit?.toLocaleString()}
                      </div>
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
        <CardFooter className="bg-muted/30 p-4 border-t">
           <div className="flex justify-between w-full text-xs font-bold text-muted-foreground">
              <span>Total Transactions: {filteredSales.length}</span>
              <span className="text-primary">Period Net Result: {currency}{metrics.profit.toLocaleString()}</span>
           </div>
        </CardFooter>
      </Card>

      {/* Delete Confirmation with Password */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Lock className="w-5 h-5" /> History Protection
            </DialogTitle>
            <DialogDescription>
              Authorize deletion of this record. This will undo all database effects associated with this transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label className="text-xs font-bold uppercase opacity-70">Secret Password</Label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              className="h-12 text-lg font-bold"
              value={deletePass}
              onChange={e => setDeletePass(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="destructive" className="w-full h-12 text-base font-bold" onClick={handleDeleteSale}>
              Confirm Authorization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
