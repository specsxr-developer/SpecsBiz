
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
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartConfig 
} from "@/components/ui/chart"
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
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

  const filteredSales = useMemo(() => {
    const now = new Date()
    let start: Date, end: Date

    switch (timeRange) {
      case "day": start = startOfDay(now); end = endOfDay(now); break
      case "week": start = startOfWeek(now); end = endOfWeek(now); break
      case "month": start = startOfMonth(now); end = endOfMonth(now); break
      case "year": start = startOfYear(now); end = endOfYear(now); break
      default: start = startOfMonth(now); end = endOfMonth(now)
    }

    return sales.filter(s => isWithinInterval(new Date(s.saleDate), { start, end }))
  }, [sales, timeRange])

  const metrics = useMemo(() => {
    const revenue = filteredSales.reduce((acc, s) => acc + (s.total || 0), 0)
    const profit = filteredSales.reduce((acc, s) => acc + (s.profit || 0), 0)
    const count = filteredSales.length
    const avgTicket = count > 0 ? revenue / count : 0
    const efficiency = revenue > 0 ? (profit / revenue) * 100 : 0
    return { revenue, profit, count, avgTicket, efficiency }
  }, [filteredSales])

  const chartData = useMemo(() => {
    const now = new Date()
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
    
    let steps: Date[] = []
    if (timeRange === "week") steps = eachDayOfInterval({ start: startOfWeek(now), end: endOfWeek(now) })
    else if (timeRange === "month") steps = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) })
    else return eachMonthOfInterval({ start: startOfYear(now), end: endOfYear(now) }).map(m => {
      const monthSales = filteredSales.filter(s => isSameMonth(new Date(s.saleDate), m))
      return { name: format(m, "MMM"), revenue: monthSales.reduce((sum, s) => sum + (s.total || 0), 0), profit: monthSales.reduce((sum, s) => sum + (s.profit || 0), 0) }
    })

    return steps.map(d => {
      const daySales = filteredSales.filter(s => isSameDay(new Date(s.saleDate), d))
      return { name: format(d, "MMM dd"), revenue: daySales.reduce((sum, s) => sum + (s.total || 0), 0), profit: daySales.reduce((sum, s) => sum + (sum.profit || 0), 0) }
    })
  }, [filteredSales, timeRange])

  const handleRunAudit = async () => {
    if (products.length === 0) {
      toast({ title: t.noData, variant: "destructive" })
      return
    }
    setIsAuditing(true)
    try {
      const result = await analyzeBusinessHealth({
        inventoryData: products.map(p => `${p.name} (Stock: ${p.stock})`).join(", "),
        salesData: filteredSales.slice(0, 10).map(s => `Sale: ${currency}${s.total}`).join(", "),
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
      if (deleteId) actions.deleteSale(deleteId)
      setDeleteId(null); setDeletePass("")
      toast({ title: "Operation Success" })
    } else {
      toast({ variant: "destructive", title: "Invalid Key" })
    }
  }

  if (isLoading) return <div className="p-10 text-center animate-pulse text-accent font-bold">{t.loading}</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-accent" /> {t.intelligenceReports}
          </h2>
          <p className="text-sm text-muted-foreground">{t.salesTrackingDesc}</p>
        </div>
        <div className="flex gap-4 items-center">
          <Tabs value={timeRange} onValueChange={(val: any) => setTimeRange(val)}>
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="day" className="text-xs">Day</TabsTrigger>
              <TabsTrigger value="week" className="text-xs">Week</TabsTrigger>
              <TabsTrigger value="month" className="text-xs">Month</TabsTrigger>
              <TabsTrigger value="year" className="text-xs">Year</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button className="bg-accent hover:bg-accent/90 gap-2" onClick={handleRunAudit} disabled={isAuditing}>
            <Sparkles className="w-4 h-4" /> {isAuditing ? t.thinking : t.aiHealthAudit}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary text-white p-4">
          <p className="text-[10px] uppercase font-bold opacity-70">{t.revenue} ({timeRange})</p>
          <div className="text-2xl font-black">{currency}{metrics.revenue.toLocaleString()}</div>
        </Card>
        <Card className="bg-accent text-white p-4">
          <p className="text-[10px] uppercase font-bold opacity-70">{t.netProfit}</p>
          <div className="text-2xl font-black">{currency}{metrics.profit.toLocaleString()}</div>
        </Card>
        <Card className="bg-blue-600 text-white p-4">
          <p className="text-[10px] uppercase font-bold opacity-70">Sales Count</p>
          <div className="text-2xl font-black">{metrics.count}</div>
        </Card>
        <Card className="bg-muted/50 p-4">
          <p className="text-[10px] uppercase font-bold opacity-70">Efficiency</p>
          <div className="text-2xl font-black text-primary">{metrics.efficiency.toFixed(1)}%</div>
        </Card>
      </div>

      <Card className="p-6">
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </Card>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Lock className="w-5 h-5" /> Authorized Deletion
            </DialogTitle>
            <DialogDescription>Enter secret key to permanently remove this transaction.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label className="text-xs font-bold uppercase">Secret Access Key</Label>
            <Input type="password" placeholder="••••••••" value={deletePass} onChange={e => setDeletePass(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="destructive" className="w-full h-12 font-bold" onClick={handleDeleteSale}>Authorize & Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
