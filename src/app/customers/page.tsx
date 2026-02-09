"use client"

import { useState } from "react"
import { 
  Users, 
  Search, 
  Sparkles, 
  Mail, 
  Phone, 
  History, 
  Tag, 
  MoreHorizontal 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { suggestCustomerSegments } from "@/ai/flows/suggest-customer-segments"
import { useToast } from "@/hooks/use-toast"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"

export default function CustomersPage() {
  const { toast } = useToast()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<{ segments: string[], reasoning: string } | null>(null)

  const customers = [
    { id: 1, name: "Sarah Jenkins", email: "sarah.j@example.com", phone: "(555) 123-4567", history: "3 Orders", total: "$450.00", segment: "V.I.P" },
    { id: 2, name: "Michael Ross", email: "m.ross@pearson.com", phone: "(555) 987-6543", history: "1 Order", total: "$120.00", segment: "New" },
    { id: 3, name: "Donna Paulsen", email: "donna@suitors.com", phone: "(555) 555-0199", history: "12 Orders", total: "$2,400.00", segment: "V.I.P" },
    { id: 4, name: "Louis Litt", email: "mudding@litt.com", phone: "(555) 001-2233", history: "5 Orders", total: "$980.00", segment: "Regular" },
  ]

  const handleAISegmentation = async () => {
    setIsAnalyzing(true)
    try {
      // Prepare mock history/demographics for flow
      const historyStr = customers.map(c => `${c.name}: ${c.history}, Total ${c.total}`).join(". ")
      const demographicsStr = "Most customers are working professionals aged 25-50 based in urban areas."
      
      const result = await suggestCustomerSegments({
        purchaseHistory: historyStr,
        demographics: demographicsStr
      })
      
      setAiAnalysis({ segments: result.customerSegments, reasoning: result.reasoning })
      toast({ title: "AI Insights Ready", description: "Customer segmentation completed." })
    } catch (error) {
      toast({ title: "Error", description: "Failed to run AI segmentation.", variant: "destructive" })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-accent" /> Customers
          </h2>
          <p className="text-muted-foreground">Manage relationships and understand buying patterns.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="border-accent text-accent gap-2"
            onClick={handleAISegmentation}
            disabled={isAnalyzing}
          >
            <Sparkles className="w-4 h-4" />
            {isAnalyzing ? "Analyzing..." : "Smart Segment"}
          </Button>
          <Button className="bg-accent hover:bg-accent/90">Add Customer</Button>
        </div>
      </div>

      {aiAnalysis && (
        <Card className="border-accent/30 bg-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" /> AI Marketing Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {aiAnalysis.segments.map((seg, i) => (
                <Badge key={i} className="bg-accent text-white">{seg}</Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground italic">"{aiAnalysis.reasoning}"</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search customers..." className="pl-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Purchases</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="pl-6 font-medium">{c.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs flex items-center gap-1 text-muted-foreground"><Mail className="w-3 h-3" /> {c.email}</span>
                        <span className="text-xs flex items-center gap-1 text-muted-foreground"><Phone className="w-3 h-3" /> {c.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1 font-normal">
                        <History className="w-3 h-3" /> {c.history}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">{c.total}</TableCell>
                    <TableCell>
                      <Badge className={
                        c.segment === 'V.I.P' ? 'bg-purple-100 text-purple-700 hover:bg-purple-100' : 
                        c.segment === 'New' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                        'bg-gray-100 text-gray-700 hover:bg-gray-100'
                      }>
                        {c.segment}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Customer Details: {c.name}</DialogTitle>
                            <CardDescription>Full purchase history and contact preferences.</CardDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="flex items-center justify-between border-b pb-2">
                              <span className="text-sm text-muted-foreground">Status</span>
                              <Badge className="bg-teal">Active</Badge>
                            </div>
                            <div className="flex items-center justify-between border-b pb-2">
                              <span className="text-sm text-muted-foreground">Joined Date</span>
                              <span className="text-sm font-medium">January 12, 2024</span>
                            </div>
                            <div className="space-y-2">
                              <span className="text-sm font-semibold">Latest Note</span>
                              <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">Customer prefers titanium frames. Contact via email only.</p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}