
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
  Settings2,
  Trash2,
  Lock,
  Clock,
  Tag,
  ChevronRight,
  X
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
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { useToast } from "@/hooks/use-toast"

export default function MasterLedgerPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const { products, sales, customers, currency, isLoading: dataLoading, actions, language } = useBusinessData()
  const t = translations[language]
  
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [allBakiRecords, setAllBakiRecords] = useState<any[]>([])
  const [isBakiLoading, setIsBakiLoading] = useState(false)
  const [generatedDate, setGeneratedDate] = useState("")

  // Deletion State
  const [deleteItem, setDeleteItem] = useState<{ id: string, type: string, extra?: any } | null>(null)
  const [deletePass, setDeletePass] = useState("")

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

  // Fetch ALL Baki Records
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
        console.error("Error fetching baki records", e)
      } finally {
        setIsBakiLoading(false)
      }
    }

    if (!dataLoading) {
      fetchAllBaki()
    }
  }, [user, db, customers, dataLoading])

  // Merge everything
  const ledgerEntries = useMemo(() => {
    const entries: any[] = []

    sales.forEach(s => {
      let itemName = "";
      if (s.isBakiPayment) {
        itemName = `Payment: ${s.bakiProductName}`;
      } else if (s.items && s.items.length > 0) {
        itemName = s.items.map((i: any) => `${i.name} (${i.quantity} ${i.unit || 'pcs'})`).join(', ');
      } else {
        itemName = `Sale #${s.id?.slice(-4)}`;
      }

      entries.push({
        id: s.id,
        date: new Date(s.saleDate),
        type: s.isBakiPayment ? 'Baki Payment' : 'Direct Sale',
        rawType: 'sale',
        item: itemName,
        amount: s.total,
        paid: s.total,
        unpaid: 0,
        status: 'Complete',
        color: s.isBakiPayment ? 'text-blue-600' : 'text-green-600',
        customer: s.customerName || 'Walking Customer',
        originalData: s
      })
    })

    allBakiRecords.forEach(r => {
      entries.push({
        id: r.id,
        date: new Date(r.takenDate),
        type: 'New Baki',
        rawType: 'baki',
        item: `${r.productName} (${r.quantity} ${r.unit || 'pcs'})`,
        amount: r.amount,
        paid: r.paidAmount || 0,
        unpaid: r.amount - (r.paidAmount || 0),
        status: r.status === 'paid' ? 'Paid' : 'Unpaid',
        color: r.status === 'paid' ? 'text-green-600' : 'text-destructive',
        customer: r.customerName,
        customerId: r.customerId
      })
    })

    products.forEach(p => {
      if (p.purchasePrice > 0) {
        entries.push({
          id: p.id + '-inv',
          date: new Date(), 
          type: 'Inventory',
          rawType: 'inventory',
          item: `Initial Stock: ${p.name} (${p.stock} ${p.unit || 'pcs'})`,
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
    
    // Date Filtering Logic
    let matchesDate = true;
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && e.date >= start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && e.date <= end;
    }

    return matchesSearch && matchesType && matchesDate;
  })

  const summary = useMemo(() => {
    return {
      totalCashIn: sales.reduce((acc, s) => acc + (s.total || 0), 0),
      totalOwed: customers.reduce((acc, c) => acc + (c.totalDue || 0), 0),
      totalInvestment: products.reduce((acc, p) => acc + (p.purchasePrice * p.stock), 0)
    }
  }, [sales, customers, products])

  const handleAuthorizedDelete = () => {
    if (deletePass === "specsxr") {
      if (deleteItem) {
        if (deleteItem.type === 'sale') {
          actions.deleteSale(deleteItem.id);
          toast({ title: "Sale Cancelled" });
        } else if (deleteItem.type === 'baki') {
          actions.deleteBakiRecord(deleteItem.extra.customerId, deleteItem.id, deleteItem.extra.remaining);
          toast({ title: "Baki Removed" });
        }
      }
      setDeleteItem(null);
      setDeletePass("");
    } else {
      toast({ variant: "destructive", title: "Incorrect Password" });
      setDeletePass("");
    }
  }

  const handleDownloadCSV = () => {
    const headers = ["Date", "Type", "Item Description", "Entity", "Total", "Paid", "Unpaid", "Status"]
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
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.print();
      }
    }, 1000);
  }

  const handleSetToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
  }

  if (dataLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
        <p className="font-bold text-accent animate-pulse">{t.loading}</p>
      </div>
    )
  }

  const logoUrl = PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 max-w-full overflow-hidden">
      <div className="hidden print:flex flex-col items-center justify-center mb-6 border-b pb-4 w-full text-center">
        <div className="flex items-center gap-3 mb-2">
          {logoUrl && <img src={logoUrl} alt="Logo" className="h-14 w-14 object-contain" />}
          <h1 className="text-3xl font-black text-primary font-headline">SpecsBiz</h1>
        </div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Master Ledger Official Report</p>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-accent" /> {t.masterLedger}
          </h2>
          <p className="text-sm text-muted-foreground print:hidden">{t.masterLedgerDesc}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto print:hidden">
          <Button variant="outline" className="gap-2 border-primary text-primary" onClick={() => setIsPrintDialogOpen(true)}>
            <Printer className="w-4 h-4" /> {t.printLedger}
          </Button>
          <Button variant="outline" className="gap-2 border-accent text-accent" onClick={handleDownloadCSV}>
            <Download className="w-4 h-4" /> {t.exportCSV}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-100 shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-600 text-white rounded-xl"><DollarSign className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] uppercase font-bold opacity-60">{t.totalCashReceived}</p>
              <p className="text-2xl font-black text-green-700">{currency}{summary.totalCashIn.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-100 shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-destructive text-white rounded-xl"><CreditCard className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] uppercase font-bold opacity-60">{t.marketDues}</p>
              <p className="text-2xl font-black text-destructive">{currency}{summary.totalOwed.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/20 shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-primary text-white rounded-xl"><Package className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] uppercase font-bold opacity-60">{t.inventoryValue}</p>
              <p className="text-2xl font-black text-primary">{currency}{summary.totalInvestment.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-accent/10 shadow-lg overflow-hidden print:border-none print:shadow-none bg-white/50 backdrop-blur-sm">
        <CardHeader className="p-4 border-b bg-muted/20 flex flex-col space-y-4 print:hidden">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder={t.filterType} 
                className="pl-9 h-10 bg-white" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-[150px] bg-white h-10">
                  <SelectValue placeholder={t.type} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entries</SelectItem>
                  <SelectItem value="sale">Sales</SelectItem>
                  <SelectItem value="baki">Baki Records</SelectItem>
                  <SelectItem value="inventory">Stock/Buy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white/50 p-3 rounded-xl border border-accent/10 shadow-inner">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-black uppercase text-primary/60 tracking-wider">
                {language === 'bn' ? 'তারিখ ফিল্টার:' : 'Date Filter:'}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <Input 
                type="date" 
                className="h-9 text-xs w-full sm:w-36 bg-white border-accent/10" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
              />
              <span className="text-[10px] font-bold text-muted-foreground">to</span>
              <Input 
                type="date" 
                className="h-9 text-xs w-full sm:w-36 bg-white border-accent/10" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 px-3 text-[10px] font-black uppercase text-accent border-accent/20 hover:bg-accent hover:text-white rounded-lg gap-1.5"
                onClick={handleSetToday}
              >
                <Clock className="w-3.5 h-3.5" /> {language === 'bn' ? 'আজ' : 'Today'}
              </Button>
              {(startDate || endDate) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 px-3 text-[10px] font-black uppercase text-destructive hover:bg-red-50 rounded-lg"
                  onClick={() => { setStartDate(""); setEndDate(""); }}
                >
                  <X className="w-3 h-3 mr-1" /> {language === 'bn' ? 'মুছুন' : 'Clear'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {filteredLedger.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
              <Inbox className="w-12 h-12 opacity-10" />
              <p className="text-sm italic">{t.noData}</p>
            </div>
          ) : (
            <div className="grid gap-4 p-4 md:p-6 bg-muted/5">
              {filteredLedger.map((entry, idx) => (
                <Card key={entry.id + idx} className="overflow-hidden border-accent/10 shadow-sm hover:shadow-md transition-all rounded-[1.5rem] bg-white print:border-none print:shadow-none print:rounded-none">
                  <div className="p-4 md:p-6 space-y-4">
                    {/* Header: Date, Time and Type */}
                    <div className={cn("flex flex-wrap items-center justify-between gap-3", !printColumns.date && !printColumns.type && "print:hidden")}>
                      <div className={cn("flex items-center gap-3", !printColumns.date && "print:hidden")}>
                        <div className="p-2 bg-accent/10 rounded-xl">
                          <Calendar className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-primary uppercase">{entry.date.toLocaleDateString()}</p>
                          <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> 
                            {entry.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className={cn(!printColumns.type && "print:hidden")}>
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter h-6 px-3 bg-accent/5 border-accent/20 text-accent">
                          {entry.type}
                        </Badge>
                      </div>
                    </div>

                    {/* Content Section: Item Details & Entity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-4">
                        <div className={cn(!printColumns.item && "print:hidden")}>
                          <Label className="text-[9px] font-black uppercase opacity-50 block mb-1.5 tracking-widest">Item & Quantity Details</Label>
                          <p className="text-sm font-bold text-primary leading-relaxed border-l-2 border-accent/20 pl-3">{entry.item}</p>
                        </div>
                        <div className={cn(!printColumns.entity && "print:hidden")}>
                          <Label className="text-[9px] font-black uppercase opacity-50 block mb-1.5 tracking-widest">Customer / Entity</Label>
                          <p className="text-xs font-bold flex items-center gap-2 text-muted-foreground">
                            <Users className="w-3.5 h-3.5 text-accent" /> {entry.customer}
                          </p>
                        </div>
                      </div>

                      {/* Financials Block */}
                      <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 shadow-inner flex flex-col justify-center">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className={cn(!printColumns.total && "print:hidden")}>
                            <p className="text-[8px] font-black uppercase opacity-50 mb-1">Total Bill</p>
                            <p className="text-sm font-black text-primary">{currency}{entry.amount.toLocaleString()}</p>
                          </div>
                          <div className={cn(!printColumns.paid && "print:hidden")}>
                            <p className="text-[8px] font-black uppercase opacity-50 mb-1">Received</p>
                            <p className="text-sm font-black text-green-600">{currency}{entry.paid.toLocaleString()}</p>
                          </div>
                          <div className={cn(!printColumns.unpaid && "print:hidden")}>
                            <p className="text-[8px] font-black uppercase opacity-50 mb-1">Outstanding</p>
                            <p className={cn(
                              "text-sm font-black", 
                              entry.unpaid > 0 ? "text-destructive" : "text-muted-foreground opacity-30"
                            )}>
                              {currency}{entry.unpaid.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer: Status and Delete Action */}
                    <div className="flex items-center justify-between pt-4 border-t border-black/5">
                      <div className={cn("flex items-center gap-2", !printColumns.status && "print:hidden")}>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          entry.rawType === 'inventory' ? 'bg-primary' : (entry.unpaid > 0 ? 'bg-destructive' : 'bg-green-500')
                        )} />
                        <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", entry.color)}>
                          {entry.status}
                        </span>
                      </div>
                      
                      {entry.rawType !== 'inventory' && (
                        <div className="print:hidden">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl font-black text-[9px] uppercase px-3 gap-2"
                            onClick={() => setDeleteItem({ id: entry.id, type: entry.rawType, extra: entry.rawType === 'baki' ? { customerId: entry.customerId, remaining: entry.unpaid } : null })}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove Record
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Hidden Table for Printing Only (Traditional format for paperwork) */}
      <div className="hidden print:block">
        <Table className="border-collapse w-full">
          <TableHeader>
            <TableRow>
              <TableHead className={cn(!printColumns.date && "hidden")}>Date/Time</TableHead>
              <TableHead className={cn(!printColumns.type && "hidden")}>Type</TableHead>
              <TableHead className={cn(!printColumns.item && "hidden")}>Description</TableHead>
              <TableHead className={cn(!printColumns.entity && "hidden")}>Entity</TableHead>
              <TableHead className={cn(!printColumns.total && "hidden")}>Total</TableHead>
              <TableHead className={cn(!printColumns.paid && "hidden")}>Paid</TableHead>
              <TableHead className={cn(!printColumns.unpaid && "hidden")}>Unpaid</TableHead>
              <TableHead className={cn(!printColumns.status && "hidden")}>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLedger.map((entry, i) => (
              <TableRow key={i}>
                <TableCell className={cn(!printColumns.date && "hidden")}>{entry.date.toLocaleString()}</TableCell>
                <TableCell className={cn(!printColumns.type && "hidden")}>{entry.type}</TableCell>
                <TableCell className={cn(!printColumns.item && "hidden")}>{entry.item}</TableCell>
                <TableCell className={cn(!printColumns.entity && "hidden")}>{entry.customer}</TableCell>
                <TableCell className={cn(!printColumns.total && "hidden")}>{currency}{entry.amount}</TableCell>
                <TableCell className={cn(!printColumns.paid && "hidden")}>{currency}{entry.paid}</TableCell>
                <TableCell className={cn(!printColumns.unpaid && "hidden")}>{currency}{entry.unpaid}</TableCell>
                <TableCell className={cn(!printColumns.status && "hidden")}>{entry.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem]">
          <DialogHeader>
            <div className="flex items-center gap-3 text-destructive mb-2">
              <div className="p-2 bg-red-50 rounded-xl"><Lock className="w-6 h-6" /></div>
              <div>
                <DialogTitle className="font-black uppercase tracking-tighter">Master Authorization</DialogTitle>
                <DialogDescription className="text-xs">Security clearance required for deletion.</DialogDescription>
              </div>
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-2">
              {language === 'en' ? 'Deleting an entry from the ledger is a permanent action and affects historical balances.' : 'লেজার থেকে এই তথ্য ডিলিট করা একটি স্থায়ী পদক্ষেপ এবং এটি আপনার ইনভেন্টরি বা ব্যালেন্স পরিবর্তন করতে পারে।'}
            </p>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label className="text-[10px] font-black uppercase opacity-70 tracking-widest">{t.secretKey}</Label>
            <Input type="password" placeholder="••••••••" className="h-14 text-2xl font-black text-center rounded-2xl bg-accent/5 border-accent/10" value={deletePass} onChange={e => setDeletePass(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="destructive" className="w-full h-14 text-base font-black uppercase rounded-2xl shadow-xl transition-all active:scale-95" onClick={handleAuthorizedDelete}>
              {language === 'en' ? 'Authorize & Wipe Entry' : 'অথোরাইজ ও ডিলিট করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl"><Settings2 className="w-6 h-6 text-primary" /></div>
              <div>
                <DialogTitle className="font-black uppercase tracking-tighter">Report Configuration</DialogTitle>
                <DialogDescription className="text-xs">Customize columns for your printed report.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-6">
            {Object.entries(printColumns).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-black/5">
                <Label className="text-[10px] font-black uppercase tracking-widest capitalize">{key}</Label>
                <Switch 
                  checked={value} 
                  onCheckedChange={(checked) => setPrintColumns(prev => ({ ...prev, [key]: checked }))} 
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button className="w-full bg-primary h-14 rounded-2xl font-black uppercase shadow-xl gap-2" onClick={handlePrint}>
              <Printer className="w-5 h-5" /> Generate PDF / Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @media print {
          .print\\:hidden, nav, .fixed { display: none !important; }
          body { background: white !important; padding: 0 !important; margin: 0 !important; }
          .sidebar-wrapper, header, footer, .sidebar-inset > header, nav, [role="navigation"], .print\\:hidden { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
          .hidden.print\\:block { display: block !important; }
          .hidden.print\\:flex { display: flex !important; }
          table { width: 100% !important; border-collapse: collapse !important; border: 1px solid #000 !important; }
          th, td { border: 1px solid #000 !important; padding: 10px !important; color: black !important; font-size: 10pt !important; }
          th { background-color: #f0f0f0 !important; font-weight: bold !important; }
        }
      `}</style>
    </div>
  )
}
