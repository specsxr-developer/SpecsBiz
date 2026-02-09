"use client"

import { useState } from "react"
import { 
  BarChart3, 
  TrendingUp, 
  Sparkles, 
  Download, 
  Calendar, 
  PieChart,
  Target
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
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Line, LineChart, Tooltip } from "recharts"
import { summarizeSalesReport } from "@/ai/flows/summarize-sales-report"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const salesData = [
  { name: "Jan", revenue: 4500, sales: 120 },
  { name: "Feb", revenue: 5200, sales: 145 },
  { name: "Mar", revenue: 4800, sales: 132 },
  { name: "Apr", revenue: 6100, sales: 168 },
  { name: "May", revenue: 5900, sales: 155 },
  { name: "Jun", revenue: 7200, sales: 204 },
]

const categoryData = [
  { name: "Frames", value: 45 },
  { name: "Lenses", value: 35 },
  { name: "Accessories", value: 15 },
  { name: "Services", value: 5 },
]

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
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [aiSummary, setAiSummary] = useState<string | null>(null)

  const handleAISummary = async () => {
    setIsSummarizing(true)
    try {
      const reportText = `Sales Summary for Q2: Total Revenue was $19,200 across 527 transactions. Best selling category was Frames (45%). June showed the highest peak in sales with a 20% increase over May. Customer retention is at 62%.`
      const result = await summarizeSalesReport({ reportText })
      setAiSummary(result.summary)
      toast({ title: "Report Ready", description: "AI summarized the sales trends." })
    } catch (error) {
      toast({ title: "Error", description: "Summarization failed.", variant: "destructive" })
    } finally {
      setIsSummarizing(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-accent" /> Analytics & Reports
          </h2>
          <p className="text-muted-foreground">Deep dive into your business performance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-accent text-accent">
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
          <Button 
            className="bg-accent hover:bg-accent/90 gap-2"
            onClick={handleAISummary}
            disabled={isSummarizing}
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Monthly performance overview</CardDescription>
              </div>
              <Badge className="bg-accent/10 text-accent border-accent/20">Monthly</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
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
                  </BarChart>
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
                  <LineChart data={salesData}>
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
              <PieChart className="w-4 h-4 text-accent" /> Category Mix
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {categoryData.map((cat, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span>{cat.name}</span>
                  <span>{cat.value}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${i === 0 ? 'bg-accent' : i === 1 ? 'bg-primary' : 'bg-teal-400'}`} 
                    style={{ width: `${cat.value}%` }} 
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" /> Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border bg-accent/5 space-y-2">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Top Product</p>
                <p className="text-lg font-bold">Classic Aviator (Blue)</p>
                <p className="text-xs text-green-600 font-medium">Accounted for 12% of total revenue this week.</p>
              </div>
              <div className="p-4 rounded-xl border bg-primary/5 space-y-2">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Growth Opportunity</p>
                <p className="text-lg font-bold">Contact Lens Accessories</p>
                <p className="text-xs text-primary font-medium">Search volume up 24% for cleaning solutions.</p>
              </div>
              <div className="p-4 rounded-xl border bg-teal-50 space-y-2">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Customer Loyalty</p>
                <p className="text-lg font-bold">78% Retention Rate</p>
                <p className="text-xs text-teal-700 font-medium">Returning customers spending 15% more on average.</p>
              </div>
              <div className="p-4 rounded-xl border bg-red-50 space-y-2">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Inventory Risk</p>
                <p className="text-lg font-bold">Low Stock Alert: cases</p>
                <p className="text-xs text-red-600 font-medium">3 categories currently under threshold.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
