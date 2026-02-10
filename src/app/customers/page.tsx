
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
  DollarSign,
  ShoppingCart,
  Edit2,
  Trash2,
  Calendar,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  
  // Edit Record State
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [isRecordEditOpen, setIsRecordEditOpen] = useState(false)
  
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

  // Auto-calculate total amount
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
    actions.addCustomer({ ...newCustomer, id: customerId, totalDue: bakiAmount })
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
    if (!detailsCustomer || !newRecord.productName || !newRecord.amount) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please select a product and amount." })
      return;
    }
    actions.addBakiRecord(detailsCustomer.id, {
      productName: newRecord.productName,
      quantity: parseFloat(newRecord.quantity) || 1,
      amount: parseFloat(newRecord.amount) || 0,
      promiseDate: new Date(newRecord.promiseDate).toISOString(),
      note: newRecord.note
    });
    setIsRecordAddOpen(false);
    setNewRecord({ productName: "", quantity: "1", unitPrice: "", amount: "0.00", promiseDate: new Date().toISOString().split('T')[0], note: "" })
    toast({ title: "Baki Recorded Successfully" });
  }

  const handleUpdateBakiRecord = () => {
    if (!detailsCustomer || !editingRecord || !newRecord.amount) return;
    
    actions.updateBakiRecord(detailsCustomer.id, editingRecord.id, {
      productName: newRecord.productName,
      quantity: parseFloat(newRecord.quantity) || 1,
      amount: parseFloat(newRecord.amount) || 0,
      note: newRecord.note
    }, editingRecord.amount);
    
    setIsRecordEditOpen(false);
    setEditingRecord(null);
    toast({ title: "Record Updated" });
  }

  const handleDeleteBakiRecord = (record: any) => {
    if (!detailsCustomer) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this record? This will reduce customer's total debt.");
    if (confirmDelete) {
      actions.deleteBakiRecord(detailsCustomer.id, record.id, record.amount - (record.paidAmount || 0));
      toast({ title: "Record Deleted" });
    }
  }

  const startEditing = (record: any) => {
    setEditingRecord(record);
    setNewRecord({
      productName: record.productName,
      quantity: record.quantity.toString(),
      unitPrice: (record.amount / record.quantity).toString(),
      amount: record.amount.toString(),
      promiseDate: record.promiseDate ? new Date(record.promiseDate).toISOString().split('T')[0] : "",
      note: record.note || ""
    });
    setIsRecordEditOpen(true);
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
          <h2 className="text-xl md:text-2xl font-bold font-headline text-primary flex items-center gap-2">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-accent" /> {t.bakiManagement}
          </h2>
          <p className="text-[10px] md:text-sm text-muted-foreground">{t.bakiDesc}</p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 gap-2 w-full sm:w-auto h-10 shadow-lg font-bold" onClick={() => handleOpenAddDialog(true)}>
          <Plus className="w-4 h-4" /> {t.addNewBakiUser}
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card className="bg-destructive/10 border-destructive/20 p-3 flex flex-col justify-center">
          <p className="text-[8px] uppercase font-black opacity-60 tracking-widest leading-none">{t.totalUnpaidBaki}</p>
          <p className="text-lg md:text-2xl font-black text-destructive mt-1">{currency}{totalMarketBaki.toLocaleString()}</p>
        </Card>
        <Card className="bg-primary text-white p-3 flex flex-col justify-center">
          <p className="text-[8px] uppercase font-black opacity-70 tracking-widest leading-none">{t.activeDebtors}</p>
          <p className="text-lg md:text-2xl font-black mt-1">{customers.filter(c => (c.totalDue || 0) > 0).length}</p>
        </Card>
      </div>

      <Card className="border-accent/10 shadow-lg overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardHeader className="p-3 border-b bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t.searchBaki} className="pl-9 h-10 bg-white" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground italic gap-2">
              <Inbox className="w-8 h-8 opacity-10" />
              <p className="text-xs font-bold uppercase tracking-widest opacity-20">{t.noData}</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="pl-4 font-black text-primary uppercase text-[10px] tracking-widest">{t.customerName}</TableHead>
                  <TableHead className="font-black text-primary uppercase text-[10px] tracking-widest">{t.currentBaki}</TableHead>
                  <TableHead className="text-right pr-4 font-black text-primary uppercase text-[10px] tracking-widest">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.filter(c => `${c.firstName} ${c.lastName} ${c.phone}`.toLowerCase().includes(search.toLowerCase())).map((c) => (
                  <TableRow key={c.id} className="hover:bg-accent/5 group">
                    <TableCell className="pl-4 py-3 font-bold text-xs text-primary">{c.firstName} {c.lastName}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-black",
                        c.totalDue > 0 ? 'bg-red-50 text-destructive' : 'bg-green-50 text-green-600'
                      )}>
                        {currency}{c.totalDue?.toLocaleString() || '0'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setDetailsCustomer(c)}>
                        <Eye className="w-4 h-4 text-accent" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Customer Details Sheet */}
      <Sheet open={!!detailsCustomer} onOpenChange={(open) => !open && setDetailsCustomer(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
          <SheetHeader className="p-4 border-b bg-accent/5">
            <SheetTitle className="text-xl font-black">{detailsCustomer?.firstName} {detailsCustomer?.lastName}</SheetTitle>
            <div className="mt-4 flex gap-3">
              <div className="flex-1 bg-white p-3 rounded-xl border-2 border-accent/10 shadow-inner">
                <p className="text-[8px] font-black uppercase opacity-50">Total Debt</p>
                <p className="text-xl font-black text-destructive">{currency}{detailsCustomer?.totalDue?.toLocaleString()}</p>
              </div>
              <Button 
                className="bg-accent h-auto font-black uppercase text-[10px] px-4" 
                onClick={() => {
                  setNewRecord({ productName: "", quantity: "1", unitPrice: "", amount: "0.00", promiseDate: new Date().toISOString().split('T')[0], note: "" });
                  setIsRecordAddOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Baki
              </Button>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1 p-4 bg-muted/5">
            <div className="space-y-3">
              {currentBakiRecords.map((record: any) => (
                <Card key={record.id} className={cn("border-none shadow-sm group/record", record.status === 'paid' ? 'bg-green-50/50' : 'bg-white')}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-primary truncate pr-4">{record.productName}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <Badge variant="secondary" className="text-[8px] h-4 px-1.5 font-black uppercase bg-muted/50 text-muted-foreground">Qty: {record.quantity}</Badge>
                          <span className="text-[8px] text-muted-foreground font-bold flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {new Date(record.takenDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm text-primary">{currency}{record.amount.toLocaleString()}</p>
                        {record.status === 'paid' ? (
                          <span className="text-[8px] text-green-600 font-bold uppercase">Paid</span>
                        ) : (
                          <div className="flex items-center gap-1 justify-end mt-1">
                            <button onClick={() => startEditing(record)} className="p-1 hover:bg-accent/10 rounded text-accent">
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleDeleteBakiRecord(record)} className="p-1 hover:bg-destructive/10 rounded text-destructive">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {record.status !== 'paid' && (
                      <div className="mt-3 flex justify-end">
                         <Button size="sm" variant="outline" className="h-7 text-[9px] font-black uppercase text-accent border-accent/30 hover:bg-accent hover:text-white" onClick={() => actions.payBakiRecord(detailsCustomer.id, record.id, record.amount - (record.paidAmount || 0), record)}>
                           Mark Paid
                         </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {currentBakiRecords.length === 0 && (
                <div className="text-center py-20 text-muted-foreground italic text-xs">
                  No baki records found for this customer.
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Add New Customer Dialog */}
      <Dialog open={isAddOpen} onOpenChange={handleOpenAddDialog}>
        <DialogContent className="w-[95vw] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{addStep === 1 ? t.registerNewCustomer : t.initialBakiDetails}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {addStep === 1 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase">{t.firstName}</Label>
                    <Input className="h-10" value={newCustomer.firstName} onChange={e => setNewCustomer({...newCustomer, firstName: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase">{t.lastName}</Label>
                    <Input className="h-10" value={newCustomer.lastName} onChange={e => setNewCustomer({...newCustomer, lastName: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase">{t.phone}</Label>
                  <Input className="h-10" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Label className="text-[10px] font-black uppercase mb-1.5 block text-primary">Search Product</Label>
                  <div className="relative">
                    <ShoppingCart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                    <Input placeholder="Type to search product..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="h-10 pl-9 border-accent/20" />
                  </div>
                  {filteredProducts.length > 0 && (
                    <Card className="absolute z-50 w-full mt-1 max-h-40 overflow-hidden shadow-xl bg-white border-accent/10">
                      <ScrollArea className="h-full">
                        {filteredProducts.map(p => (
                          <button key={p.id} onClick={() => selectProduct(p)} className="w-full text-left p-3 hover:bg-accent/10 border-b text-xs flex justify-between items-center transition-colors">
                            <span className="font-bold">{p.name}</span>
                            <span className="font-black text-accent">{currency}{p.sellingPrice}</span>
                          </button>
                        ))}
                      </ScrollArea>
                    </Card>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black">Quantity</Label>
                    <Input type="number" step="0.01" className="h-10" value={newRecord.quantity} onChange={e => setNewRecord({...newRecord, quantity: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black">Unit Price</Label>
                    <Input type="number" step="0.01" className="h-10" value={newRecord.unitPrice} onChange={e => setNewRecord({...newRecord, unitPrice: e.target.value})} />
                  </div>
                </div>
                <div className="bg-destructive/5 p-4 rounded-xl text-center border-2 border-destructive/10">
                  <Label className="text-[10px] uppercase font-black text-destructive">Total Owed (Auto)</Label>
                  <p className="text-2xl font-black text-destructive">{currency}{newRecord.amount}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            {addStep === 1 ? (
              <Button className="w-full bg-accent h-12 font-black uppercase" onClick={() => setAddStep(2)} disabled={!newCustomer.firstName}>Next: Add Baki Details</Button>
            ) : (
              <Button className="w-full bg-primary h-12 font-black uppercase" onClick={handleAddCustomerAndBaki}>Save Customer & Baki</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Baki Record to Existing Customer Dialog */}
      <Dialog open={isRecordAddOpen} onOpenChange={setIsRecordAddOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-primary font-black uppercase tracking-tighter">Add New Baki Record</DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase text-accent">Adding debt to: {detailsCustomer?.firstName} {detailsCustomer?.lastName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Label className="text-[10px] font-black uppercase mb-1.5 block text-primary">Select Product</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                <Input placeholder="Type to search product..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="h-11 rounded-xl border-accent/20" />
              </div>
              {filteredProducts.length > 0 && (
                <Card className="absolute z-50 w-full mt-1 max-h-40 overflow-hidden shadow-2xl bg-white border-accent/10 rounded-xl">
                  <ScrollArea className="h-full">
                    {filteredProducts.map(p => (
                      <button key={p.id} onClick={() => selectProduct(p)} className="w-full text-left p-3 hover:bg-accent/5 border-b text-xs flex justify-between items-center transition-colors">
                        <span className="font-bold">{p.name}</span>
                        <div className="text-right">
                          <span className="font-black text-accent block">{currency}{p.sellingPrice}</span>
                          <span className="text-[8px] opacity-50 uppercase font-black">Stock: {p.stock}</span>
                        </div>
                      </button>
                    ))}
                  </ScrollArea>
                </Card>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black opacity-60">Product Name</Label>
              <Input value={newRecord.productName} onChange={e => setNewRecord({...newRecord, productName: e.target.value})} className="h-11 rounded-xl" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black opacity-60">Quantity</Label>
                <Input type="number" step="0.01" className="h-11 rounded-xl" value={newRecord.quantity} onChange={e => setNewRecord({...newRecord, quantity: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black opacity-60">Unit Price ({currency})</Label>
                <Input type="number" step="0.01" className="h-11 rounded-xl" value={newRecord.unitPrice} onChange={e => setNewRecord({...newRecord, unitPrice: e.target.value})} />
              </div>
            </div>

            <div className="bg-accent/5 p-4 rounded-2xl text-center border border-accent/10 shadow-inner">
              <Label className="text-[10px] uppercase font-black text-accent tracking-widest">New Debt Amount</Label>
              <p className="text-3xl font-black text-primary mt-1">{currency}{newRecord.amount}</p>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full bg-accent hover:bg-accent/90 h-14 text-base font-black uppercase rounded-2xl shadow-xl transition-all active:scale-95" onClick={handleAddBakiRecordOnly}>
              Confirm & Save Baki
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Existing Baki Record Dialog */}
      <Dialog open={isRecordEditOpen} onOpenChange={setIsRecordEditOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-primary font-black uppercase tracking-tighter">Edit Baki Record</DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase text-accent">Modify existing entry for {detailsCustomer?.firstName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black opacity-60">Product Name</Label>
              <Input value={newRecord.productName} onChange={e => setNewRecord({...newRecord, productName: e.target.value})} className="h-11 rounded-xl" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black opacity-60">Quantity</Label>
                <Input type="number" step="0.01" className="h-11 rounded-xl" value={newRecord.quantity} onChange={e => setNewRecord({...newRecord, quantity: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black opacity-60">Unit Price ({currency})</Label>
                <Input type="number" step="0.01" className="h-11 rounded-xl" value={newRecord.unitPrice} onChange={e => setNewRecord({...newRecord, unitPrice: e.target.value})} />
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl text-center border border-amber-200 shadow-inner">
              <Label className="text-[10px] uppercase font-black text-amber-700 tracking-widest">Modified Debt Amount</Label>
              <p className="text-3xl font-black text-primary mt-1">{currency}{newRecord.amount}</p>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full bg-primary hover:bg-primary/90 h-14 text-base font-black uppercase rounded-2xl shadow-xl transition-all active:scale-95" onClick={handleUpdateBakiRecord}>
              Update & Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
