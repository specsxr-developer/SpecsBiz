
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
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { useBusinessData } from "@/hooks/use-business-data"
import { useUser, useFirestore } from "@/firebase"
import { collectionGroup, getDocs, query, where } from "firebase/firestore"

export default function MasterLedgerPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { products, sales, customers, currency, isLoading: dataLoading } = useBusinessData()
  
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [allBakiRecords, setAllBakiRecords] = useState<any[]>([])
  const [isBakiLoading, setIsBakiLoading] = useState(false)

  // Fetch ALL Baki Records across all customers for the report
  useEffect(() => {
    async function fetchAllBaki() {
      if (!user?.uid || !db) {
        // Handle local mode aggregation
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
        // Note: For large datasets, this should be optimized, but for MVP it works
        // This requires a Firestore index if using collectionGroup with filters, 
        // but simple list usually works if rules allow.
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
      entries.push({
        id: s.id,
        date: new Date(s.saleDate),
        type: s.isBakiPayment ? 'Baki Payment' : 'Direct Sale',
        item: s.isBakiPayment ? `Payment: ${s.bakiProductName}` : (s.items?.[0]?.name || 'Multiple Items'),
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
          date: new Date(), // Placeholder as we don't track purchase date yet
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

  if (dataLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
        <p className="font-bold text-accent animate-pulse">Generating Master Ledger...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-accent" /> Master Ledger
          </h2>
          <p className="text-sm text-muted-foreground">Comprehensive A-Z business transaction report.</p>
        </div>
        <Button variant="outline" className="gap-2 border-accent text-accent">
          <Download className="w-4 h-4" /> Export Spreadsheet
        </Button>
      </div>

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

      <Card className="border-accent/10 shadow-lg overflow-hidden">
        <CardHeader className="p-4 border-b bg-muted/20 flex flex-col md:flex-row gap-4 items-center justify-between">
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
                  <TableHead className="text-[10px] uppercase font-bold pl-6">Date</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Type</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Item / Description</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Entity</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Total Val</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Paid</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Unpaid</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-right pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLedger.map((entry, idx) => (
                  <TableRow key={entry.id + idx} className="hover:bg-accent/5">
                    <TableCell className="pl-6 text-xs font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {entry.date.toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[9px] font-bold h-5 uppercase tracking-tighter ${
                        entry.type.includes('Sale') ? 'bg-green-50 border-green-200 text-green-700' :
                        entry.type.includes('Baki') ? 'bg-orange-50 border-orange-200 text-orange-700' :
                        'bg-blue-50 border-blue-200 text-blue-700'
                      }`}>
                        {entry.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-primary truncate max-w-[150px]">
                      {entry.item}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        {entry.customer}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-black">{currency}{entry.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-xs font-bold text-green-600">{currency}{entry.paid.toLocaleString()}</TableCell>
                    <TableCell className={`text-xs font-bold ${entry.unpaid > 0 ? 'text-destructive' : 'text-muted-foreground opacity-30'}`}>
                      {currency}{entry.unpaid.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right pr-6">
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
      
      <div className="flex items-center justify-between text-[10px] text-muted-foreground italic bg-muted/30 p-4 rounded-lg">
         <p>* This report combines live data from Inventory, Sales, and Customer Baki Records.</p>
         <p>Total Ledger Entries: {filteredLedger.length}</p>
      </div>
    </div>
  )
}
