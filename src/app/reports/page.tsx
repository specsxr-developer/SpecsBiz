"use client"

import { useState, useMemo, useEffect } from "react"
import { 
  FileSpreadsheet, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter,
  Download,
  Calendar,
  DollarSign,
  Package,
  Users,
  CreditCard,
  Inbox,
  Loader2,
  Printer,
  Check,
  Settings2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useBusinessData } from "@/hooks/use-business-data"
import { useUser, useFirestore } from "@/firebase"
import { collection, getDocs } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { PlaceHolderImages } from "@/lib/placeholder-images"

export default function MasterLedgerPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { products, sales, customers, currency, isLoading: dataLoading } = useBusinessData()
  
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [allBakiRecords, setAllBakiRecords] = useState<any[]>([])
  const [isBakiLoading, setIsBakiLoading] = useState(false)
  const [generatedDate, setGeneratedDate] = useState("")

  // Hydration fix for print date
  useEffect(() => {
    setGeneratedDate(new Date().toLocaleString())
  }, [])

  // Print Settings State
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)
  const [printColumns, setPrintColumns] = useState({
    date: true,
    type: true,
    item: true,
    entity: true,
    total: true,
    paid: true,
    unpaid: true,
    status: true
  })

  // Fetch ALL Baki Records across all customers for the report
  useEffect(() => {
    async function fetchAllBaki() {
      if (!user?.uid || !db) {
        const localBaki = customers.flatMap(c => 
          (c.bakiRecords || []).map((r: any) => ({
            ...r,
            customerId: c.id,
            customerName: `${c.firstName} ${c.lastName}`
          }))
        )
        setAllBakiRecords(localBaki)
        return
      }

      setIsBakiLoading(true)
      try {
        const records: any[] = []
        for (const customer of customers) {
          const snap = await getDocs(collection(db, 'users', user.uid, 'customers', customer.id, 'bakiRecords'))
          snap.forEach(doc => {
            records.push({
              ...doc.data(),
              id: doc.id,
              customerId: customer.id,
              customerName: `${customer.firstName} ${customer.lastName}`
            })
          })
        }
        setAllBakiRecords(records)
      } catch (e) {
        console.error("Error fetching baki records for report", e)
      } finally {
        setIsBakiLoading(false)
      }
    }

    if (!dataLoading) {
      fetchAllBaki()
    }
  }, [user, db, customers, dataLoading])

  // Merge everything into one Master Ledger
  const ledgerEntries = useMemo(() => {
    const entries: any[] = []

    // 1. Add Sales (Direct & Baki Payments)
    sales.forEach(s => {
      const itemName = s.isBakiPayment 
        ? `Payment: ${s.bakiProductName}` 
        : (s.items && s.items.length > 0 
            ? (s.items.length === 1 ? s.items[0].name : `${s.items[0].name} (+${s.items.length - 1})`)
            : `Sale #${s.id?.slice(-4)}`);

      entries.push({
        id: s.id,
        date: new Date(s.saleDate),
        type: s.isBakiPayment ? 'Baki Payment' : 'Direct Sale',
        item: itemName,
        amount: s.total,
        paid: s.total,
        unpaid: 0,
        status: 'Complete',
        color: s.isBakiPayment ? 'text-blue-600' : 'text-green-600',
        customer: s.customerName || 'Walking Customer'
      })
    })

    // 2. Add Original Baki Records (Pending debts)
    allBakiRecords.forEach(r => {
      entries.push({
        id: r.id,
        date: new Date(r.takenDate),
        type: 'New Baki',
        item: r.productName,
        amount: r.amount,
        paid: r.paidAmount || 0,
        unpaid: r.amount - (r.paidAmount || 0),
        status: r.status === 'paid' ? 'Paid' : 'Unpaid',
        color: r.status === 'paid' ? 'text-green-600' : 'text-destructive',
        customer: r.customerName
      })
    })

    // 3. Add Inventory Purchases (Investment)
    products.forEach(p => {
      if (p.purchasePrice > 0) {
        entries.push({
          id: p.id + '-inv',
          date: new Date(), 
          type: 'Inventory',
          item: `Stock: ${p.name}`,
          amount: p.purchasePrice * p.stock,
          paid: p.purchasePrice * p.stock,
          unpaid: 0,
          status: 'In Stock',
          color: 'text-primary',
          customer: 'Supplier'
        })
      }
    })

    return entries.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [sales, allBakiRecords, products])

  const filteredLedger = ledgerEntries.filter(e => {
    const matchesSearch = `${e.item} ${e.customer}`.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'all' || e.type.toLowerCase().includes(filterType.toLowerCase())
    return matchesSearch && matchesType
  })

  // Summary Stats
  const summary = useMemo(() => {
    return {
      totalCashIn: sales.reduce((acc, s) => acc + (s.total || 0), 0),
      totalOwed: customers.reduce((acc, c) => acc + (c.totalDue || 0), 0),
      totalInvestment: products.reduce((acc, p) => acc + (p.purchasePrice * p.stock), 0)
    }
  }, [sales, customers, products])

  // Download logic
  const handleDownloadCSV = () => {
    const headers = ["Date", "Type", "Item", "Entity", "Total", "Paid", "Unpaid", "Status"]
    const rows = filteredLedger.map(e => [
      e.date.toLocaleDateString(),
      e.type,
      e.item,
      e.customer,
      e.amount,
      e.paid,
      e.unpaid,
      e.status
    ])

    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `master_ledger_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    setIsPrintDialogOpen(false);
    
    // Unfocus active elements to prevent potential issues
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // Delay print to allow dialog to close completely
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.print();
      }
    }, 1000);
  }

  if (dataLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
        <p className="font-bold text-accent animate-pulse">Generating Master Ledger...</p>
      </div>
    )
  }

  const logoUrl = PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Print Only Header with Logo and App Name */}
      <div className="hidden print:flex flex-col items-center justify-center mb-6 border-b pb-4 w-full text-center">
        <div className="flex items-center gap-3 mb-2">
          {logoUrl && (
            <img 
              src={logoUrl} 
              alt="SpecsBiz Logo" 
              className="h-14 w-14 object-contain"
            />
          )}
          <h1 className="text-3xl font-black text-primary font-headline">SpecsBiz</h1>
        </div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Master Ledger Official Report</p>
        <div className="text-[9px] mt-1 opacity-50 font-medium">Generated on: {generatedDate || "Loading..."}</div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-accent" /> Master Ledger
          </h2>
          <p className="text-sm text-muted-foreground print:hidden">Comprehensive A-Z business transaction report.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto print:hidden">
          <Button 
            variant="outline" 
            className="gap-2 border-primary text-primary" 
            onClick={() => setIsPrintDialogOpen(true)}
          >
            <Printer className="w-4 h-4" /> Print Ledger
          </Button>
          <Button variant="outline" className="gap-2 border-accent text-accent" onClick={handleDownloadCSV}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Print Configuration Dialog */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-accent" /> Print Configuration
            </DialogTitle>
            <DialogDescription>
              Select the columns you want to include in your printed report.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="col-date" 
                  checked={printColumns.date} 
                  onCheckedChange={(val) => setPrintColumns(prev => ({...prev, date: val}))} 
                />
                <Label htmlFor="col-date">Date</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="col-type" 
                  checked={printColumns.type} 
                  onCheckedChange={(val) => setPrintColumns(prev => ({...prev, type: val}))} 
                />
                <Label htmlFor="col-type">Transaction Type</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="col-item" 
                  checked={printColumns.item} 
                  onCheckedChange={(val) => setPrintColumns(prev => ({...prev, item: val}))} 
                />
                <Label htmlFor="col-item">Item Name</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="col-entity" 
                  checked={printColumns.entity} 
                  onCheckedChange={(val) => setPrintColumns(prev => ({...prev, entity: val}))} 
                />
                <Label htmlFor="col-entity">Customer/Supplier</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="col-total" 
                  checked={printColumns.total} 
                  onCheckedChange={(val) => setPrintColumns(prev => ({...prev, total: val}))} 
                />
                <Label htmlFor="col-total">Total Value</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="col-paid" 
                  checked={printColumns.paid} 
                  onCheckedChange={(val) => setPrintColumns(prev => ({...prev, paid: val}))} 
                />
                <Label htmlFor="col-paid">Paid Amount</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="col-unpaid" 
                  checked={printColumns.unpaid} 
                  onCheckedChange={(val) => setPrintColumns(prev => ({...prev, unpaid: val}))} 
                />
                <Label htmlFor="col-unpaid">Unpaid/Due</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="col-status" 
                  checked={printColumns.status} 
                  onCheckedChange={(val) => setPrintColumns(prev => ({...prev, status: val}))} 
                />
                <Label htmlFor="col-status">Status</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full bg-accent hover:bg-accent/90 gap-2 h-12 text-lg font-bold" onClick={handlePrint}>
              <Printer className="w-5 h-5" /> Start Printing Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-100 shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-600 text-white rounded-xl"><DollarSign className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] uppercase font-bold opacity-60">Total Cash Received</p>
              <p className="text-2xl font-black text-green-700">{currency}{summary.totalCashIn.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-100 shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-destructive text-white rounded-xl"><CreditCard className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] uppercase font-bold opacity-60">Market Dues (Baki)</p>
              <p className="text-2xl font-black text-destructive">{currency}{summary.totalOwed.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/20 shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-primary text-white rounded-xl"><Package className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] uppercase font-bold opacity-60">Inventory Value</p>
              <p className="text-2xl font-black text-primary">{currency}{summary.totalInvestment.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-accent/10 shadow-lg overflow-hidden print:border-none print:shadow-none">
        <CardHeader className="p-4 border-b bg-muted/20 flex flex-col md:flex-row gap-4 items-center justify-between print:hidden">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Filter by item, customer or supplier..." 
              className="pl-9 h-10 bg-white" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-[150px] bg-white h-10">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entries</SelectItem>
                <SelectItem value="sale">Sales</SelectItem>
                <SelectItem value="baki">Baki Records</SelectItem>
                <SelectItem value="payment">Payments</SelectItem>
                <SelectItem value="inventory">Stock/Buy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {filteredLedger.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
              <Inbox className="w-12 h-12 opacity-10" />
              <p className="text-sm italic">No matching transactions found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className={cn("text-[10px] uppercase font-bold pl-6", !printColumns.date && "print:hidden")}>Date</TableHead>
                  <TableHead className={cn("text-[10px] uppercase font-bold", !printColumns.type && "print:hidden")}>Type</TableHead>
                  <TableHead className={cn("text-[10px] uppercase font-bold", !printColumns.item && "print:hidden")}>Item / Description</TableHead>
                  <TableHead className={cn("text-[10px] uppercase font-bold", !printColumns.entity && "print:hidden")}>Entity</TableHead>
                  <TableHead className={cn("text-[10px] uppercase font-bold", !printColumns.total && "print:hidden")}>Total Val</TableHead>
                  <TableHead className={cn("text-[10px] uppercase font-bold", !printColumns.paid && "print:hidden")}>Paid</TableHead>
                  <TableHead className={cn("text-[10px] uppercase font-bold", !printColumns.unpaid && "print:hidden")}>Unpaid</TableHead>
                  <TableHead className={cn("text-[10px] uppercase font-bold text-right pr-6", !printColumns.status && "print:hidden")}>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLedger.map((entry, idx) => (
                  <TableRow key={entry.id + idx} className="hover:bg-accent/5">
                    <TableCell className={cn("pl-6 text-xs font-medium whitespace-nowrap", !printColumns.date && "print:hidden")}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-muted-foreground print:hidden" />
                        {entry.date.toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className={cn(!printColumns.type && "print:hidden")}>
                      <Badge variant="outline" className={`text-[9px] font-bold h-5 uppercase tracking-tighter ${
                        entry.type.includes('Sale') ? 'bg-green-50 border-green-200 text-green-700' :
                        entry.type.includes('Baki') ? 'bg-orange-50 border-orange-200 text-orange-700' :
                        'bg-blue-50 border-blue-200 text-blue-700'
                      }`}>
                        {entry.type}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn("text-xs font-bold text-primary truncate max-w-[150px]", !printColumns.item && "print:hidden")}>
                      {entry.item}
                    </TableCell>
                    <TableCell className={cn("text-xs", !printColumns.entity && "print:hidden")}>
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-muted-foreground print:hidden" />
                        {entry.customer}
                      </div>
                    </TableCell>
                    <TableCell className={cn("text-xs font-black", !printColumns.total && "print:hidden")}>{currency}{entry.amount.toLocaleString()}</TableCell>
                    <TableCell className={cn("text-xs font-bold text-green-600", !printColumns.paid && "print:hidden")}>{currency}{entry.paid.toLocaleString()}</TableCell>
                    <TableCell className={cn("text-xs font-bold", entry.unpaid > 0 ? 'text-destructive' : 'text-muted-foreground opacity-30', !printColumns.unpaid && "print:hidden")}>
                      {currency}{entry.unpaid.toLocaleString()}
                    </TableCell>
                    <TableCell className={cn("text-right pr-6", !printColumns.status && "print:hidden")}>
                      <span className={`text-[10px] font-black uppercase ${entry.color}`}>
                        {entry.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-between text-[10px] text-muted-foreground italic bg-muted/30 p-4 rounded-lg print:bg-white print:border-t">
         <p>* This report combines live data from Inventory, Sales, and Customer Baki Records.</p>
         <p>Total Ledger Entries: {filteredLedger.length}</p>
      </div>

      <style jsx global>{`
        @media print {
          .print\\:hidden, nav, .fixed { display: none !important; }
          body { background: white !important; padding: 0 !important; margin: 0 !important; }
          .sidebar-wrapper, header, footer, .sidebar-inset > header, nav, [role="navigation"], .print\\:hidden { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
          .rounded-lg { border-radius: 0 !important; }
          .shadow-lg, .shadow-xl, .shadow-sm { box-shadow: none !important; }
          table { width: 100% !important; border-collapse: collapse !important; border: 1px solid #ddd !important; }
          th, td { border: 1px solid #ddd !important; padding: 8px !important; color: black !important; }
          .badge-outline { border: 1px solid #ccc !important; }
          .bg-muted\\/20, .bg-muted\\/50 { background-color: #f9f9f9 !important; }
          .text-destructive { color: #cc0000 !important; }
          .text-green-600 { color: #008800 !important; }
          h1, h2, h3, p { color: black !important; }
          img { max-height: 80px !important; width: auto !important; }
        }
      `}</style>
    </div>
  )
}
