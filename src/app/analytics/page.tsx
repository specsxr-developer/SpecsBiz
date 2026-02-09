"use client"

import { useState, useMemo } from "react"
import { 
  BarChart3, 
  TrendingUp, 
  Sparkles, 
  Download, 
  BarChart, 
  PieChart,
  Target,
  Inbox,
  ShieldCheck,
  AlertCircle,
  Lightbulb
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
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Line, LineChart, Cell } from "recharts"
import { summarizeSalesReport } from "@/ai/flows/summarize-sales-report"
import { analyzeBusinessHealth, type AnalyzeBusinessHealthOutput } from "@/ai/flows/analyze-business-health"
import { useToast } from "@/hooks/use-toast"
import { useBusinessData } from "@/hooks/use-business-data"

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--accent))",
  },
  sales: {
    label: "Total Sales",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export default function AnalyticsPage() {
  const { toast } = useToast()
  const { sales, products, isLoading, currency } = useBusinessData()
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditResult, setAuditResult] = useState<AnalyzeBusinessHealthOutput | null>(null)

  // Calculate real monthly data from sales
  const processedSalesData = useMemo(() => {
    if (!sales || sales.length === 0) return []
    
    const monthlyMap: Record<string, { name: string, revenue: number, sales: number }> = {}
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    sales.forEach(s => {
      const date = new Date(s.saleDate)
      const monthName = months[date.getMonth()]
      if (!monthlyMap[monthName]) {
        monthlyMap[monthName] = { name: monthName, revenue: 0, sales: 0 }
      }
      monthlyMap[monthName].revenue += (s.total || 0)
      monthlyMap[monthName].sales += 1
    })

    return Object.values(monthlyMap)
  }, [sales])

  // Detailed Financial Stats
  const financials = useMemo(() => {
    const totalSalesRevenue = sales.reduce((acc, s) => acc + (s.total || 0), 0)
    const totalSalesProfit = sales.reduce((acc, s) => acc + (s.profit || 0), 0)
    
    const totalInvestment = products.reduce((acc, p) => acc + ((p.purchasePrice || 0) * (p.stock || 0)), 0)
    const totalPotentialRevenue = products.reduce((acc, p) => acc + ((p.sellingPrice || 0) * (p.stock || 0)), 0)
    const totalPotentialProfit = totalPotentialRevenue - totalInvestment

    return {
      totalSalesRevenue,
      totalSalesProfit,
      totalInvestment,
      totalPotentialProfit,
      stockValue: totalPotentialRevenue
    }
  }, [sales, products])

  // Calculate category mix
  const categoryData = useMemo(() => {
    if (!products || products.length === 0) return []
    const catMap: Record<string, number> = {}
    products.forEach(p => {
      const cat = p.category || "Uncategorized"
      catMap[cat] = (catMap[cat] || 0) + 1
    })
    const total = products.length
    return Object.entries(catMap).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100)
    })).sort((a, b) => b.value - a.value).slice(0, 4)
  }, [products])

  const handleRunAudit = async () => {
    if (products.length === 0) {
      toast({ title: "No Inventory", description: "Add products to run an audit.", variant: "destructive" })
      return
    }

    setIsAuditing(true)
    try {
      const inventorySummary = products.map(p => `${p.name} (Stock: ${p.stock}, Profit Margin: ${currency}${p.sellingPrice - (p.purchasePrice || 0)})`).join(", ")
      const salesSummary = sales.slice(0, 10).map(s => `Sale: ${currency}${s.total}`).join(", ")
      
      const result = await analyzeBusinessHealth({
        inventoryData: inventorySummary,
        salesData: salesSummary,
        totalInvestment: financials.totalInvestment,
        potentialProfit: financials.totalPotentialProfit
      })
      
      setAuditResult(result)
      toast({ title: "Audit Complete", description: "AI has finished the business health analysis." })
    } catch (error) {
      toast({ title: "Audit Failed", variant: "destructive" })
    } finally {
      setIsAuditing(false)
    }
  }

  if (isLoading) return <div className="p-10 text-center animate-pulse">Loading Analytics...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-accent" /> Business Intelligence
          </h2>
          <p className="text-muted-foreground">Deep insights into costs, margins, and potential profit.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-accent hover:bg-accent/90 gap-2 w-full sm:w-auto shadow-lg"
            onClick={handleRunAudit}
            disabled={isAuditing || products.length === 0}
          >
            <Sparkles className="w-4 h-4" />
            {isAuditing ? "Auditing Business..." : "Run AI Health Audit"}
          </Button>
        </div>
      </div>

      {auditResult && (
        <Card className="border-none shadow-2xl overflow-hidden bg-white">
          <div className="bg-primary text-white p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-accent" /> AI Business Health Report
                </CardTitle>
                <CardDescription className="text-primary-foreground/70">Strategic analysis based on live data.</CardDescription>
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
                   <h4 className="text-sm font-bold flex items-center gap-2 mb-2"><Lightbulb className="w-4 h-4 text-yellow-500" /> Recommendations</h4>
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
                 <h4 className="text-sm font-bold flex items-center gap-2"><Target className="w-4 h-4 text-blue-500" /> Predictions</h4>
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

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-3">
        <Card className="bg-blue-600 text-white border-none shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest font-bold opacity-70">Total Investment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{currency}{financials.totalInvestment.toLocaleString()}</p>
            <p className="text-[10px] mt-2 opacity-80">Total value based on purchase costs of all stock.</p>
          </CardContent>
        </Card>
        
        <Card className="bg-teal-600 text-white border-none shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest font-bold opacity-70">Potential Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{currency}{financials.totalPotentialProfit.toLocaleString()}</p>
            <p className="text-[10px] mt-2 opacity-80">Expected margin if current inventory is cleared.</p>
          </CardContent>
        </Card>

        <Card className="bg-accent text-white border-none shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-widest font-bold opacity-70">Total Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{currency}{financials.stockValue.toLocaleString()}</p>
            <p className="text-[10px] mt-2 opacity-80">Total estimated selling value of your warehouse.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Monthly revenue vs order volume</CardDescription>
              </div>
              <Badge className="bg-accent/10 text-accent border-accent/20">Live Sync</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={processedSalesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="revenue" 
                      fill="var(--color-revenue)" 
                      radius={[4, 4, 0, 0]} 
                      barSize={40}
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Analysis</CardTitle>
            <CardDescription>Profit potential by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 pt-4">
              {categoryData.map((cat, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-accent' : i === 1 ? 'bg-blue-500' : 'bg-teal-400'}`} />
                      {cat.name}
                    </span>
                    <span className="text-muted-foreground">{cat.value}% of stock</span>
                  </div>
                  <Progress value={cat.value} className="h-2" />
                </div>
              ))}
              {categoryData.length === 0 && (
                <div className="text-center py-20 text-muted-foreground italic flex flex-col items-center gap-2">
                  <Inbox className="w-8 h-8 opacity-20" />
                  <p className="text-xs">No product categories to analyze.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
