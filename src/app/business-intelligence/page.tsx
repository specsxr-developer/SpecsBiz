
"use client"

import { useMemo, useState } from "react"
import { 
  BarChart3, 
  TrendingUp, 
  Sparkles, 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon,
  Target,
  ShieldCheck,
  DollarSign,
  Package,
  Layers
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartConfig 
} from "@/components/ui/chart"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"
import { useBusinessData } from "@/hooks/use-business-data"
import { analyzeBusinessHealth, type AnalyzeBusinessHealthOutput } from "@/ai/flows/analyze-business-health"
import { useToast } from "@/hooks/use-toast"
import { format, subMonths, eachMonthOfInterval, isSameMonth } from "date-fns"
import { cn } from "@/lib/utils"

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export default function BusinessIntelligencePage() {
  const { toast } = useToast()
  const { products, sales, currency, isLoading } = useBusinessData()
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditResult, setAuditResult] = useState<AnalyzeBusinessHealthOutput | null>(null)

  // Calculations based on the image requirements
  const metrics = useMemo(() => {
    const totalInvestment = products.reduce((acc, p) => acc + ((p.purchasePrice || 0) * (p.stock || 0)), 0)
    const totalStockValue = products.reduce((acc, p) => acc + ((p.sellingPrice || 0) * (p.stock || 0)), 0)
    const potentialProfit = totalStockValue - totalInvestment

    return { totalInvestment, potentialProfit, totalStockValue }
  }, [products])

  // Chart Data preparation (Last 6 Months)
  const chartData = useMemo(() => {
    const now = new Date()
    const months = eachMonthOfInterval({ 
      start: subMonths(now, 5), 
      end: now 
    })
    
    return months.map(month => {
      const monthSales = sales.filter(s => isSameMonth(new Date(s.saleDate), month))
      return {
        name: format(month, "MMM"),
        revenue: monthSales.reduce((sum, s) => sum + (s.total || 0), 0),
      }
    })
  }, [sales])

  // Category Analysis (Distribution of stock)
  const categoryAnalysis = useMemo(() => {
    const categories: Record<string, number> = {}
    let totalStock = 0

    products.forEach(p => {
      const cat = p.category || "Uncategorized"
      categories[cat] = (categories[cat] || 0) + (p.stock || 0)
      totalStock += (p.stock || 0)
    })

    return Object.entries(categories)
      .map(([name, stock]) => ({
        name,
        percentage: totalStock > 0 ? (stock / totalStock) * 100 : 0
      }))
      .sort((a, b) => b.percentage - a.percentage)
  }, [products])

  const handleRunAudit = async () => {
    if (products.length === 0) {
      toast({ title: "No Inventory", description: "Add products to run an audit.", variant: "destructive" })
      return
    }

    setIsAuditing(true)
    try {
      const inventorySummary = products.map(p => `${p.name} (Stock: ${p.stock})`).join(", ")
      const salesSummary = sales.slice(0, 10).map(s => `Sale: ${currency}${s.total}`).join(", ")
      
      const result = await analyzeBusinessHealth({
        inventoryData: inventorySummary,
        salesData: salesSummary,
        totalInvestment: metrics.totalInvestment,
        potentialProfit: metrics.potentialProfit
      })
      
      setAuditResult(result)
      toast({ title: "Audit Complete" })
    } catch (error) {
      toast({ title: "Audit Failed", variant: "destructive" })
    } finally {
      setIsAuditing(false)
    }
  }

  if (isLoading) return <div className="p-10 text-center animate-pulse text-accent font-bold">Analysing Intelligence Data...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black font-headline text-primary flex items-center gap-2">
            <PieChartIcon className="w-7 h-7 text-accent" /> Business Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">Deep insights into costs, margins, and potential profit.</p>
        </div>
        <Button 
          className="bg-accent hover:bg-accent/90 gap-2 shadow-xl shrink-0"
          onClick={handleRunAudit}
          disabled={isAuditing}
        >
          <Sparkles className="w-4 h-4" />
          {isAuditing ? "Auditing..." : "Run AI Health Audit"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-600 text-white border-none shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <DollarSign className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-white/70 text-[10px] uppercase font-bold tracking-widest">Total Investment</CardDescription>
            <CardTitle className="text-3xl font-black">{currency}{metrics.totalInvestment.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-white/60">Total value based on purchase costs of all stock.</p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-600 text-white border-none shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-white/70 text-[10px] uppercase font-bold tracking-widest">Potential Profit</CardDescription>
            <CardTitle className="text-3xl font-black">{currency}{metrics.potentialProfit.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-white/60">Expected margin if current inventory is cleared.</p>
          </CardContent>
        </Card>

        <Card className="bg-teal-700 text-white border-none shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Package className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-white/70 text-[10px] uppercase font-bold tracking-widest">Total Stock Value</CardDescription>
            <CardTitle className="text-3xl font-black">{currency}{metrics.totalStockValue.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-white/60">Total estimated selling value of your warehouse.</p>
          </CardContent>
        </Card>
      </div>

      {auditResult && (
        <Card className="border-accent/20 shadow-2xl overflow-hidden bg-white animate-in zoom-in-95 duration-500">
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

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="shadow-lg border-accent/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Revenue Trends</CardTitle>
              <CardDescription className="text-xs">Monthly revenue vs order volume</CardDescription>
            </div>
            <Badge variant="outline" className="text-[9px] text-accent border-accent/20 bg-accent/5">Live Sync</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="revenue" 
                      fill="var(--color-revenue)" 
                      radius={[4, 4, 0, 0]} 
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Category Analysis</CardTitle>
            <CardDescription className="text-xs">Profit potential by category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {categoryAnalysis.map((cat, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", i % 2 === 0 ? "bg-primary" : "bg-accent")} />
                    <span className="font-bold text-primary capitalize">{cat.name}</span>
                  </div>
                  <span className="text-muted-foreground font-medium">{cat.percentage.toFixed(0)}% of stock</span>
                </div>
                <Progress 
                  value={cat.percentage} 
                  className={cn("h-2 bg-muted", i % 2 === 0 ? "[&>div]:bg-primary" : "[&>div]:bg-accent")} 
                />
              </div>
            ))}
            {categoryAnalysis.length === 0 && (
              <div className="py-20 text-center text-xs text-muted-foreground italic">
                No category data available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
