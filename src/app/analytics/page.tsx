
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
  Inbox
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartConfig 
} from "@/components/ui/chart"
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Line, LineChart } from "recharts"
import { summarizeSalesReport } from "@/ai/flows/summarize-sales-report"
import { useToast } from "@/hooks/use-toast"
import { useBusinessData } from "@/hooks/use-business-data"

const chartConfig = {
  revenue: {
    label: "Revenue ($)",
    color: "hsl(var(--accent))",
  },
  sales: {
    label: "Total Sales",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export default function AnalyticsPage() {
  const { toast } = useToast()
  const { sales, products, isLoading } = useBusinessData()
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [aiSummary, setAiSummary] = useState<string | null>(null)

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

  const handleAISummary = async () => {
    if (sales.length === 0) {
      toast({ title: "No Data", description: "Complete some sales first.", variant: "destructive" })
      return
    }

    setIsSummarizing(true)
    try {
      const totalRevenue = sales.reduce((acc, s) => acc + (s.total || 0), 0)
      const reportText = `Business Performance Summary: Total Revenue is $${totalRevenue.toFixed(2)} across ${sales.length} transactions. Active inventory count is ${products.length} items.`
      const result = await summarizeSalesReport({ reportText })
      setAiSummary(result.summary)
      toast({ title: "Report Ready", description: "AI analyzed your live business data." })
    } catch (error) {
      toast({ title: "Error", description: "Summarization failed.", variant: "destructive" })
    } finally {
      setIsSummarizing(false)
    }
  }

  if (isLoading) return <div className="p-10 text-center animate-pulse">Loading Analytics...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-accent" /> Analytics & Reports
          </h2>
          <p className="text-muted-foreground">Live data insights for your business.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-accent hover:bg-accent/90 gap-2 w-full sm:w-auto"
            onClick={handleAISummary}
            disabled={isSummarizing || sales.length === 0}
          >
            <Sparkles className="w-4 h-4" />
            {isSummarizing ? "Analyzing..." : "Generate AI Insights"}
          </Button>
        </div>
      </div>

      {aiSummary && (
        <Card className="bg-primary text-primary-foreground border-none shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" /> AI Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-primary-foreground/90 text-sm leading-relaxed">{aiSummary}</p>
          </CardContent>
        </Card>
      )}

      {sales.length === 0 ? (
        <Card className="p-20 flex flex-col items-center justify-center text-muted-foreground gap-4">
          <Inbox className="w-12 h-12 opacity-20" />
          <p className="italic">No sales data found to generate analytics.</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Revenue Trends</CardTitle>
                    <CardDescription>Monthly performance overview</CardDescription>
                  </div>
                  <Badge className="bg-accent/10 text-accent border-accent/20">Live</Badge>
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Sales Volume</CardTitle>
                    <CardDescription>Order count across time</CardDescription>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20">Real-time</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full mt-4">
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={processedSalesData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line 
                          type="monotone" 
                          dataKey="sales" 
                          stroke="var(--color-sales)" 
                          strokeWidth={3} 
                          dot={{ r: 6, fill: "var(--color-sales)" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-accent" /> Inventory Mix
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {categoryData.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-10">No categories found.</p>
                ) : (
                  categoryData.map((cat, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="truncate mr-2">{cat.name}</span>
                        <span>{cat.value}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${i === 0 ? 'bg-accent' : i === 1 ? 'bg-primary' : 'bg-teal-400'}`} 
                          style={{ width: `${cat.value}%` }} 
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4 text-accent" /> Business Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border bg-accent/5 space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Sales</p>
                    <p className="text-lg font-bold">{sales.length} Transactions</p>
                    <p className="text-xs text-green-600 font-medium">Recorded in your database.</p>
                  </div>
                  <div className="p-4 rounded-xl border bg-primary/5 space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Inventory Health</p>
                    <p className="text-lg font-bold">{products.length} Products</p>
                    <p className="text-xs text-primary font-medium">Active items across categories.</p>
                  </div>
                  <div className="p-4 rounded-xl border bg-teal-50 space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Profit Tracked</p>
                    <p className="text-lg font-bold">${sales.reduce((acc, s) => acc + (s.profit || 0), 0).toFixed(2)}</p>
                    <p className="text-xs text-teal-700 font-medium">Total estimated Lav (Profit).</p>
                  </div>
                  <div className="p-4 rounded-xl border bg-blue-50 space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Revenue</p>
                    <p className="text-lg font-bold">${sales.reduce((acc, s) => acc + (s.total || 0), 0).toFixed(2)}</p>
                    <p className="text-xs text-blue-600 font-medium">Gross revenue from sales.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
