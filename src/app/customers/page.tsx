"use client"

import { useState, useMemo, useEffect } from "react"
import { 
  Users, 
  Search, 
  Plus, 
  Eye, 
  Package, 
  CheckCircle2, 
  ChevronLeft, 
  ArrowRight,
  Inbox,
  DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { useBusinessData } from "@/hooks/use-business-data"
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"

export default function CustomersPage() {
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  const { customers, products, actions, isLoading, currency, language } = useBusinessData()
  const t = translations[language]
  
  const [search, setSearch] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addStep, setAddStep] = useState(1) 
  
  const [detailsCustomer, setDetailsCustomer] = useState<any>(null)
  const [isRecordAddOpen, setIsRecordAddOpen] = useState(false)
  
  const [newRecord, setNewRecord] = useState({
    productName: "",
    quantity: "1",
    unitPrice: "",
    amount: "0.00",
    promiseDate: new Date().toISOString().split('T')[0],
    note: ""
  })

  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    totalDue: 0,
    segment: "Baki User"
  })

  // Auto-calculate total amount based on qty and unit price (A to Z Style)
  useEffect(() => {
    const qty = parseFloat(newRecord.quantity) || 0
    const price = parseFloat(newRecord.unitPrice) || 0
    const total = (qty * price).toFixed(2)
    setNewRecord(prev => ({ ...prev, amount: total }))
  }, [newRecord.quantity, newRecord.unitPrice])

  const selectProduct = (p: any) => {
    setNewRecord(prev => ({
      ...prev,
      productName: p.name,
      unitPrice: p.sellingPrice.toString(),
    }))
    setProductSearch("")
    toast({ title: language === 'en' ? "Product Selected" : "পণ্য সিলেক্ট করা হয়েছে" })
  }

  const bakiRecordsQuery = useMemoFirebase(() => {
    if (!user?.uid || !db || !detailsCustomer) return null;
    return query(
      collection(db, 'users', user.uid, 'customers', detailsCustomer.id, 'bakiRecords'),
      orderBy('takenDate', 'desc')
    );
  }, [user?.uid, db, detailsCustomer]);

  const { data: fbBakiRecords } = useCollection(bakiRecordsQuery);
  const currentBakiRecords = detailsCustomer ? (user ? (fbBakiRecords || []) : (detailsCustomer.bakiRecords || [])) : [];

  const handleOpenAddDialog = (open: boolean) => {
    setIsAddOpen(open)
    if (open) {
      setAddStep(1)
      setNewCustomer({ firstName: "", lastName: "", email: "", phone: "", address: "", totalDue: 0, segment: "Baki User" })
      setNewRecord({ productName: "", quantity: "1", unitPrice: "", amount: "0.00", promiseDate: new Date().toISOString().split('T')[0], note: "" })
      setProductSearch("")
    }
  }

  const handleAddCustomerAndBaki = () => {
    if (!newCustomer.firstName) return
    
    const customerId = Date.now().toString()
    const bakiAmount = parseFloat(newRecord.amount) || 0
    
    actions.addCustomer({
      ...newCustomer,
      id: customerId,
      totalDue: bakiAmount 
    })

    if (newRecord.productName && bakiAmount > 0) {
      actions.addBakiRecord(customerId, {
        productName: newRecord.productName,
        quantity: parseFloat(newRecord.quantity) || 1,
        amount: bakiAmount,
        promiseDate: new Date(newRecord.promiseDate).toISOString(),
        note: newRecord.note
      });
    }

    setIsAddOpen(false)
    toast({ title: language === 'en' ? "Customer Saved" : "কাস্টমার সেভ হয়েছে" })
  }

  const handleAddBakiRecordOnly = () => {
    if (!detailsCustomer || !newRecord.productName || !newRecord.amount) return;
    
    actions.addBakiRecord(detailsCustomer.id, {
      productName: newRecord.productName,
      quantity: parseFloat(newRecord.quantity) || 1,
      amount: parseFloat(newRecord.amount) || 0,
      promiseDate: new Date(newRecord.promiseDate).toISOString(),
      note: newRecord.note
    });

    setIsRecordAddOpen(false);
    toast({ title: "Baki Recorded" });
  }

  const filteredProducts = useMemo(() => {
    if (!productSearch) return []
    return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
  }, [products, productSearch])

  const totalMarketBaki = customers.reduce((acc, c) => acc + (c.totalDue || 0), 0)

  if (isLoading) return <div className="p-10 text-center animate-pulse text-accent font-bold">{t.loading}</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-accent" /> {t.bakiManagement}
          </h2>
          <p className="text-sm text-muted-foreground">{t.bakiDesc}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Dialog open={isAddOpen} onOpenChange={handleOpenAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 gap-2 flex-1 sm:flex-none h-12 shadow-lg font-bold">
                <Plus className="w-5 h-5" /> {t.addNewBakiUser}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-primary">{addStep === 1 ? t.registerNewCustomer : t.initialBakiDetails}</DialogTitle>
                <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  {addStep === 1 ? "Customer Profile Setup" : "Smart Baki A to Z"}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                {addStep === 1 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.firstName}</Label>
                        <Input className="h-11 bg-muted/10 border-accent/10" value={newCustomer.firstName} onChange={e => setNewCustomer({...newCustomer, firstName: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.lastName}</Label>
                        <Input className="h-11 bg-muted/10 border-accent/10" value={newCustomer.lastName} onChange={e => setNewCustomer({...newCustomer, lastName: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.phone}</Label>
                      <Input className="h-11 bg-muted/10 border-accent/10" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.address}</Label>
                      <Input className="h-11 bg-muted/10 border-accent/10" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="relative">
                      <Label className="text-[10px] font-black uppercase mb-1.5 block text-primary">{language === 'en' ? 'Search Product (A to Z)' : 'পণ্য খুঁজুন (A to Z)'}</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          placeholder={language === 'en' ? 'Type product name...' : 'পণ্যের নাম লিখুন...'}
                          value={productSearch}
                          onChange={e => setProductSearch(e.target.value)}
                          className="pl-9 bg-accent/5 h-11 focus-visible:ring-accent border-accent/20"
                        />
                      </div>
                      {filteredProducts.length > 0 && (
                        <Card className="absolute z-50 w-full mt-1 shadow-2xl border-accent/20 max-h-40 overflow-hidden bg-white animate-in slide-in-from-top-2">
                          <ScrollArea className="h-full">
                            {filteredProducts.map(p => (
                              <button key={p.id} onClick={() => selectProduct(p)} className="w-full text-left p-3 hover:bg-accent/10 border-b last:border-0 flex justify-between items-center group">
                                <div className="min-w-0">
                                  <span className="text-xs font-bold block truncate text-primary">{p.name}</span>
                                  <span className="text-[10px] text-muted-foreground font-black">Stock: {p.stock} {p.unit}</span>
                                </div>
                                <span className="text-xs font-black text-accent">{currency}{p.sellingPrice}</span>
                              </button>
                            ))}
                          </ScrollArea>
                        </Card>
                      )}
                    </div>
                    <div className="space-y-1.5 pt-2 border-t border-dashed">
                      <Label className="text-[10px] uppercase font-black text-muted-foreground">Confirm Product Name</Label>
                      <Input className="h-11 font-bold text-primary" value={newRecord.productName} onChange={e => setNewRecord({...newRecord, productName: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-black text-muted-foreground">Quantity</Label>
                        <Input type="number" step="0.01" className="h-11 font-bold" value={newRecord.quantity} onChange={e => setNewRecord({...newRecord, quantity: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-black text-muted-foreground">Unit Price ({currency})</Label>
                        <Input type="number" step="0.01" className="h-11 font-bold text-accent" value={newRecord.unitPrice} onChange={e => setNewRecord({...newRecord, unitPrice: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-black text-destructive text-[10px] uppercase flex justify-between items-center">
                        Total Owed (Auto Calculate)
                        <span className="bg-destructive/10 px-2 py-0.5 rounded-full lowercase font-medium">Auto</span>
                      </Label>
                      <Input type="number" step="0.01" className="bg-destructive/5 font-black text-2xl h-16 border-destructive/20 text-destructive text-center shadow-inner" value={newRecord.amount} onChange={e => setNewRecord({...newRecord, amount: e.target.value})} />
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-3">
                {addStep === 1 ? (
                  <Button className="w-full bg-accent h-14 text-lg font-black uppercase tracking-tight shadow-xl shadow-accent/20" onClick={() => setAddStep(2)} disabled={!newCustomer.firstName}>
                    Next: Add Baki Details <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" className="h-14 font-black uppercase text-xs border-accent/20" onClick={() => setAddStep(1)}>Back</Button>
                    <Button className="flex-1 bg-primary h-14 text-lg font-black uppercase tracking-tight shadow-xl" onClick={handleAddCustomerAndBaki}>
                      {t.saveProfileBaki}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-destructive/10 border-destructive/20 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:scale-110 transition-transform">
            <DollarSign className="w-12 h-12" />
          </div>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-destructive text-white rounded-xl shadow-lg shadow-destructive/20"><DollarSign className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] uppercase font-black opacity-60 tracking-widest">{t.totalUnpaidBaki}</p>
              <p className="text-2xl font-black text-destructive">{currency}{totalMarketBaki.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary text-white shadow-sm border-none relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
            <Users className="w-12 h-12" />
          </div>
           <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] uppercase font-black opacity-70 tracking-widest">{t.activeDebtors}</p>
              <p className="text-2xl font-black">{customers.filter(c => (c.totalDue || 0) > 0).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-accent/10 shadow-lg overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardHeader className="p-4 border-b bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t.searchBaki} className="pl-9 h-12 bg-white border-accent/10 shadow-inner focus-visible:ring-accent" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground italic gap-2">
              <Inbox className="w-12 h-12 mb-2 opacity-10" />
              <p className="text-sm font-bold uppercase tracking-widest opacity-20">{t.noData}</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="pl-6 font-black text-primary uppercase text-[10px] tracking-widest">{t.customerName}</TableHead>
                  <TableHead className="font-black text-primary uppercase text-[10px] tracking-widest">{t.phone}</TableHead>
                  <TableHead className="font-black text-primary uppercase text-[10px] tracking-widest">{t.currentBaki}</TableHead>
                  <TableHead className="text-right pr-6 font-black text-primary uppercase text-[10px] tracking-widest">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.filter(c => `${c.firstName} ${c.lastName} ${c.phone}`.toLowerCase().includes(search.toLowerCase())).map((c) => (
                  <TableRow key={c.id} className="hover:bg-accent/5 transition-all group">
                    <TableCell className="pl-6 py-5 font-black text-primary group-hover:text-accent transition-colors">{c.firstName} {c.lastName}</TableCell>
                    <TableCell className="text-xs font-bold text-muted-foreground/70">{c.phone}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-black shadow-sm",
                        c.totalDue > 0 ? 'bg-red-50 text-destructive border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
                      )}>
                        {currency}{c.totalDue?.toLocaleString() || '0'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button size="sm" variant="outline" className="h-9 px-4 gap-2 border-accent text-accent hover:bg-accent hover:text-white transition-all shadow-md font-black uppercase text-[10px] tracking-tighter" onClick={() => setDetailsCustomer(c)}>
                        <Eye className="w-3.5 h-3.5" /> {t.details}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!detailsCustomer} onOpenChange={(open) => !open && setDetailsCustomer(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col border-l-accent/10">
          <SheetHeader className="p-6 border-b bg-accent/5">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-3xl bg-accent text-white flex items-center justify-center text-3xl font-black shadow-xl shadow-accent/20 rotate-3">{detailsCustomer?.firstName?.[0]}</div>
              <div>
                <SheetTitle className="text-3xl font-black text-primary tracking-tight">{detailsCustomer?.firstName} {detailsCustomer?.lastName}</SheetTitle>
                <SheetDescription className="font-bold flex items-center gap-2 text-accent/70"><Package className="w-3.5 h-3.5" /> {detailsCustomer?.address || 'No Address Provided'}</SheetDescription>
              </div>
            </div>
            <div className="mt-8 flex gap-4">
              <div className="flex-1 bg-white p-5 rounded-3xl border-2 border-accent/10 shadow-inner">
                <p className="text-[10px] font-black uppercase opacity-50 tracking-[0.2em]">Total Market Debt</p>
                <p className="text-4xl font-black text-destructive">{currency}{detailsCustomer?.totalDue?.toLocaleString()}</p>
              </div>
              <Button className="h-auto bg-accent shadow-2xl font-black uppercase tracking-tight text-xs px-8 hover:bg-accent/90 transition-all active:scale-95 rounded-2xl" onClick={() => setIsRecordAddOpen(true)}>
                <Plus className="w-5 h-5 mr-2" /> Add Baki
              </Button>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1 p-6 bg-muted/5">
            <div className="space-y-5">
              <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] mb-4 border-b pb-2">History of Records</h4>
              {currentBakiRecords.map((record: any) => (
                <Card key={record.id} className={cn("border-none shadow-sm transition-all hover:shadow-xl hover:scale-[1.01]", record.status === 'paid' ? 'bg-green-50 opacity-60 grayscale' : 'bg-white')}>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-black text-primary flex items-center gap-2 text-base">
                          <Package className="w-4 h-4 text-accent" /> {record.productName}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-[9px] font-black bg-muted px-2 py-0.5 rounded-lg uppercase tracking-widest">Qty: {record.quantity}</Badge>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" /> Taken: {new Date(record.takenDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-primary">{currency}{record.amount.toLocaleString()}</p>
                        {record.status === 'paid' && <Badge className="bg-green-600 text-white border-none text-[8px] h-4 uppercase">Paid In Full</Badge>}
                      </div>
                    </div>
                    {record.status !== 'paid' && (
                      <div className="mt-5 pt-4 border-t border-dashed flex flex-wrap justify-between items-center gap-4">
                         <span className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                           <CheckCircle2 className="w-3.5 h-3.5" /> Promise: {new Date(record.promiseDate).toLocaleDateString()}
                         </span>
                         <Button size="sm" variant="outline" className="h-9 text-[10px] font-black uppercase tracking-tight text-accent border-accent/30 hover:bg-accent hover:text-white transition-all shadow-sm rounded-xl px-5" onClick={() => actions.payBakiRecord(detailsCustomer.id, record.id, record.amount - (record.paidAmount || 0), record)}>
                           Mark as Paid
                         </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {currentBakiRecords.length === 0 && (
                <div className="py-32 text-center text-muted-foreground text-xs font-black uppercase tracking-[0.2em] opacity-20 italic">No historical records found.</div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Dialog open={isRecordAddOpen} onOpenChange={setIsRecordAddOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] border-accent/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-primary uppercase tracking-tight flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg"><Plus className="w-6 h-6 text-accent" /></div>
              New Baki Record
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Select product and auto-calculate debt (A to Z).</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
             <div className="relative">
                <Label className="text-[10px] font-black uppercase mb-2 block text-primary">Search Inventory (A to Z)</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    value={productSearch} 
                    onChange={e => setProductSearch(e.target.value)} 
                    placeholder="Type product name to auto-fill..." 
                    className="pl-9 bg-accent/5 h-12 focus-visible:ring-accent border-accent/20 font-bold" 
                  />
                </div>
                {filteredProducts.length > 0 && (
                  <Card className="absolute z-50 w-full mt-1 max-h-40 overflow-hidden shadow-2xl border-accent/20 bg-white animate-in zoom-in-95">
                    <ScrollArea className="h-full">
                      {filteredProducts.map(p => (
                        <button key={p.id} onClick={() => selectProduct(p)} className="w-full text-left p-4 hover:bg-accent/10 border-b last:border-0 flex justify-between items-center group">
                          <div>
                            <span className="text-xs font-black block text-primary">{p.name}</span>
                            <span className="text-[9px] text-muted-foreground font-bold uppercase">Stock Left: {p.stock}</span>
                          </div>
                          <span className="text-sm font-black text-accent">{currency}{p.sellingPrice}</span>
                        </button>
                      ))}
                    </ScrollArea>
                  </Card>
                )}
             </div>
             <div className="space-y-1.5 pt-2 border-t border-dashed">
                <Label className="text-[10px] uppercase font-black text-muted-foreground">Confirm Product/Item Name</Label>
                <Input placeholder="Enter product name..." className="h-12 font-bold text-primary bg-muted/10 border-none shadow-inner" value={newRecord.productName} onChange={e => setNewRecord({...newRecord, productName: e.target.value})} />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground">Quantity</Label>
                  <Input type="number" step="0.01" className="h-12 font-black text-lg bg-muted/10 border-none shadow-inner" value={newRecord.quantity} onChange={e => setNewRecord({...newRecord, quantity: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground">Unit Price ({currency})</Label>
                  <Input type="number" step="0.01" className="h-12 font-black text-lg text-accent bg-muted/10 border-none shadow-inner" value={newRecord.unitPrice} onChange={e => setNewRecord({...newRecord, unitPrice: e.target.value})} />
                </div>
             </div>
             <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black text-destructive flex justify-between items-center">
                  Total Debt (Auto Calculation)
                  <span className="bg-destructive/10 px-2 py-0.5 rounded-full text-[8px] tracking-widest">Master Brain</span>
                </Label>
                <Input type="number" step="0.01" className="font-black text-destructive bg-destructive/5 text-3xl h-20 text-center border-2 border-destructive/20 shadow-xl rounded-2xl" value={newRecord.amount} onChange={e => setNewRecord({...newRecord, amount: e.target.value})} />
             </div>
             <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black text-muted-foreground">Payment Deadline Promise</Label>
                <Input type="date" className="h-12 font-bold text-primary bg-muted/10 border-none shadow-inner" value={newRecord.promiseDate} onChange={e => setNewRecord({...newRecord, promiseDate: e.target.value})} />
             </div>
          </div>
          <DialogFooter>
            <Button className="w-full bg-accent h-16 text-xl font-black uppercase tracking-widest shadow-2xl shadow-accent/20 transition-all active:scale-95 rounded-2xl" onClick={handleAddBakiRecordOnly}>
              Save Baki Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
