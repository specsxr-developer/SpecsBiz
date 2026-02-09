
"use client"

import { useState } from "react"
import { 
  Users, 
  Search, 
  Sparkles, 
  Mail, 
  Phone, 
  History, 
  MoreHorizontal,
  Inbox,
  Plus,
  MapPin
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { suggestCustomerSegments } from "@/ai/flows/suggest-customer-segments"
import { useToast } from "@/hooks/use-toast"
import { useBusinessData } from "@/hooks/use-business-data"

export default function CustomersPage() {
  const { toast } = useToast()
  const { customers, sales, actions, isLoading } = useBusinessData()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<{ segments: string[], reasoning: string } | null>(null)
  const [search, setSearch] = useState("")

  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    segment: "New"
  })

  const handleAISegmentation = async () => {
    if (customers.length === 0) {
      toast({ title: "No Data", description: "Add customers first.", variant: "destructive" })
      return
    }
    
    setIsAnalyzing(true)
    try {
      const historyStr = customers.map(c => `${c.firstName}: New Customer`).join(". ")
      const demographicsStr = "User provided customer list."
      const result = await suggestCustomerSegments({
        purchaseHistory: historyStr,
        demographics: demographicsStr
      })
      setAiAnalysis({ segments: result.customerSegments, reasoning: result.reasoning })
      toast({ title: "AI Insights Ready" })
    } catch (error) {
      toast({ title: "Error", variant: "destructive" })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAddCustomer = () => {
    if (!newCustomer.firstName || !newCustomer.email) return
    actions.addCustomer(newCustomer)
    setNewCustomer({ firstName: "", lastName: "", email: "", phone: "", address: "", segment: "New" })
    toast({ title: "Customer Added" })
  }

  if (isLoading) return <div className="p-10 text-center animate-pulse">Loading Customers...</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-accent" /> Customers
          </h2>
          <p className="text-sm text-muted-foreground">Manage relationships and history.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            className="border-accent text-accent gap-2 flex-1 sm:flex-none"
            onClick={handleAISegmentation}
            disabled={isAnalyzing || customers.length === 0}
          >
            <Sparkles className="w-4 h-4" />
            {isAnalyzing ? "Analyzing..." : "Smart Segment"}
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 gap-2 flex-1 sm:flex-none">
                <Plus className="w-4 h-4" /> Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <CardDescription>Enter contact details for relationship tracking.</CardDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">First Name</Label>
                    <Input className="h-9" value={newCustomer.firstName} onChange={e => setNewCustomer({...newCustomer, firstName: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Last Name</Label>
                    <Input className="h-9" value={newCustomer.lastName} onChange={e => setNewCustomer({...newCustomer, lastName: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input type="email" className="h-9" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone</Label>
                  <Input className="h-9" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Address</Label>
                  <Input className="h-9" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full bg-accent" onClick={handleAddCustomer}>Save Customer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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

      <Card>
        <CardHeader className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search customers..." 
              className="pl-9 h-11" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
              <Inbox className="w-12 h-12 opacity-10" />
              <p className="text-sm italic">Your customer list is empty.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6 text-xs">Name</TableHead>
                  <TableHead className="text-xs">Contact</TableHead>
                  <TableHead className="text-xs">Address</TableHead>
                  <TableHead className="text-xs text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers
                  .filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()))
                  .map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="pl-6 font-bold text-primary">
                      {c.firstName} {c.lastName}
                      <Badge variant="outline" className="ml-2 text-[8px] uppercase tracking-tighter h-4 px-1">{c.segment}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] flex items-center gap-1 text-muted-foreground"><Mail className="w-2.5 h-2.5" /> {c.email}</span>
                        <span className="text-[10px] flex items-center gap-1 text-muted-foreground"><Phone className="w-2.5 h-2.5" /> {c.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] flex items-center gap-1 text-muted-foreground max-w-[150px] truncate"><MapPin className="w-2.5 h-2.5" /> {c.address || 'No address'}</span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
