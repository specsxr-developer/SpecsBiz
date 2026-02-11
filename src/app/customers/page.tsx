
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
  X,
  UserEdit,
  AlertCircle,
  AlertTriangle,
  Lock
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
  
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null)
  const [isRecordAddOpen, setIsRecordAddOpen] = useState(false)
  const [isRecordEditOpen, setIsRecordEditOpen] = useState(false)
  const [isCustomerEditOpen, setIsCustomerEditOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  
  // LIVE Customer Object
  const detailsCustomer = useMemo(() => {
    return customers.find(c => c.id === activeCustomerId) || null
  }, [customers, activeCustomerId])

  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [newRecord, setNewRecord] = useState({
    productId: "",
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

  // Real-time Warnings
  const nameWarning = useMemo(() => {
    if (!newCustomer.firstName.trim()) return null;
    const fullName = (newCustomer.firstName + " " + (newCustomer.lastName || "")).toLowerCase().trim().replace(/\s+/g, ' ');
    const match = customers.find(c => {
      if (activeCustomerId && c.id === activeCustomerId) return false;
      const cFull = (c.firstName + " " + (c.lastName || "")).toLowerCase().trim().replace(/\s+/g, ' ');
      return cFull === fullName;
    });
    if (match) return language === 'bn' ? `'${match.firstName}' নামে কাস্টমার আছে!` : `Customer '${match.firstName}' exists!`;
    return null;
  }, [newCustomer.firstName, newCustomer.lastName, customers, language, activeCustomerId]);

  const phoneWarning = useMemo(() => {
    const rawPhone = newCustomer.phone.replace(/\D/g, '');
    if (rawPhone.length < 5) return null;
    const match = customers.find(c => {
      if (activeCustomerId && c.id === activeCustomerId) return false;
      return (c.phone || "").replace(/\D/g, '') === rawPhone;
    });
    if (match) return language === 'bn' ? `ফোন নম্বরটি '${match.firstName}' এর জন্য ব্যবহৃত!` : `Phone used by '${match.firstName}'!`;
    return null;
  }, [newCustomer.phone, customers, language, activeCustomerId]);

  useEffect(() => {
    const qty = parseFloat(newRecord.quantity) || 0
    const price = parseFloat(newRecord.unitPrice) || 0
    const total = (qty * price).toFixed(2)
    setNewRecord(prev => ({ ...prev, amount: total }))
  }, [newRecord.quantity, newRecord.unitPrice])

  const selectProduct = (p: any) => {
    setNewRecord(prev => ({
      ...prev,
      productId: p.id,
      productName: p.name,
      unitPrice: p.sellingPrice.toString(),
    }))
    setProductSearch("")
  }

  const bakiRecordsQuery = useMemoFirebase(() => {
    if (!user?.uid || !db || !activeCustomerId) return null;
    return query(
      collection(db, 'users', user.uid, 'customers', activeCustomerId, 'bakiRecords'),
      orderBy('takenDate', 'desc')
    );
  }, [user?.uid, db, activeCustomerId]);

  const { data: fbBakiRecords } = useCollection(bakiRecordsQuery);
  
  const currentBakiRecords = useMemo(() => {
    const rawRecords = activeCustomerId ? (user ? (fbBakiRecords || []) : (detailsCustomer?.bakiRecords || [])) : [];
    return rawRecords.filter((r: any) => r.status !== 'paid');
  }, [fbBakiRecords, detailsCustomer, user, activeCustomerId]);

  const handleAddCustomerAndBaki = () => {
    if (!newCustomer.firstName.trim()) return;
    const customerId = Date.now().toString()
    const bakiAmount = parseFloat(newRecord.amount) || 0
    actions.addCustomer({ ...newCustomer, id: customerId, totalDue: bakiAmount })
    
    if (newRecord.productName && bakiAmount > 0) {
      actions.addBakiRecord(customerId, {
        productId: newRecord.productId,
        productName: newRecord.productName,
        quantity: parseFloat(newRecord.quantity) || 1,
        amount: bakiAmount,
        promiseDate: new Date(newRecord.promiseDate).toISOString(),
        note: newRecord.note
      });
    }
    setIsAddOpen(false)
    toast({ title: "Saved Successfully" })
  }

  const handleUpdateCustomer = () => {
    if (!activeCustomerId) return;
    actions.updateCustomer(activeCustomerId, newCustomer);
    setIsCustomerEditOpen(false);
    toast({ title: "Updated" });
  }

  const handleDeleteCustomer = () => {
    if (!activeCustomerId || !detailsCustomer) return;
    if (detailsCustomer.totalDue > 0) {
      toast({ variant: "destructive", title: "Cannot Delete", description: "Clear all debts first!" });
      return;
    }
    actions.deleteCustomer(activeCustomerId);
    setActiveCustomerId(null);
    setIsDeleteConfirmOpen(false);
    setIsCustomerEditOpen(false);
    toast({ title: "Customer Removed" });
  }

  const handleAddBakiRecordOnly = () => {
    if (!activeCustomerId || !newRecord.productName) return;
    actions.addBakiRecord(activeCustomerId, {
      productId: newRecord.productId,
      productName: newRecord.productName,
      quantity: parseFloat(newRecord.quantity) || 1,
      amount: parseFloat(newRecord.amount) || 0,
      promiseDate: new Date(newRecord.promiseDate).toISOString(),
      note: newRecord.note
    });
    setIsRecordAddOpen(false);
    setNewRecord({ productId: "", productName: "", quantity: "1", unitPrice: "", amount: "0.00", promiseDate: new Date().toISOString().split('T')[0], note: "" })
  }

  const handleUpdateBakiRecord = () => {
    if (!activeCustomerId || !editingRecord) return;
    actions.updateBakiRecord(activeCustomerId, editingRecord.id, {
      productName: newRecord.productName,
      quantity: parseFloat(newRecord.quantity) || 1,
      amount: parseFloat(newRecord.amount) || 0,
      note: newRecord.note
    }, editingRecord.amount, editingRecord.productId, editingRecord.quantity);
    setIsRecordEditOpen(false);
    setEditingRecord(null);
  }

  const handleDeleteBakiRecord = (record: any) => {
    if (!activeCustomerId) return;
    const confirmDelete = window.confirm("Delete this entry?");
    if (confirmDelete) {
      const remaining = record.amount - (record.paidAmount || 0);
      actions.deleteBakiRecord(activeCustomerId, record.id, remaining, record.productId, record.quantity);
      toast({ title: "Removed" });
    }
  }

  const startEditingRecord = (record: any) => {
    setEditingRecord(record);
    const unitPrice = record.quantity > 0 ? (record.amount / record.quantity) : 0;
    setNewRecord({
      productId: record.productId || "",
      productName: record.productName,
      quantity: record.quantity.toString(),
      unitPrice: unitPrice.toString(),
      amount: record.amount.toString(),
      promiseDate: record.promiseDate ? new Date(record.promiseDate).toISOString().split('T')[0] : "",
      note: record.note || ""
    });
    setIsRecordEditOpen(true);
  }

  const startEditingCustomer = () => {
    if (!detailsCustomer) return;
    setNewCustomer({
      firstName: detailsCustomer.firstName,
      lastName: detailsCustomer.lastName || "",
      phone: detailsCustomer.phone || "",
      address: detailsCustomer.address || "",
      email: detailsCustomer.email || "",
      totalDue: detailsCustomer.totalDue || 0,
      segment: detailsCustomer.segment || "Baki User"
    });
    setIsCustomerEditOpen(true);
  }

  const filteredProducts = useMemo(() => {
    if (!productSearch) return []
    return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
  }, [products, productSearch])

  const totalMarketBaki = customers.reduce((acc, c) => acc + (c.totalDue || 0), 0)

  const displayCustomers = useMemo(() => {
    return customers
      .filter(c => {
        const matchesSearch = `${c.firstName} ${c.lastName} ${c.phone}`.toLowerCase().includes(search.toLowerCase());
        return search.trim() === "" ? (c.totalDue || 0) > 0 : matchesSearch;
      })
      .sort((a, b) => (b.totalDue || 0) - (a.totalDue || 0));
  }, [customers, search]);

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
        <Button className="bg-accent hover:bg-accent/90 gap-2 w-full sm:w-auto h-10 shadow-lg font-bold" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4" /> {t.addNewBakiUser}
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card className="bg-destructive/10 border-destructive/20 p-3">
          <p className="text-[8px] uppercase font-black opacity-60 tracking-widest">{t.totalUnpaidBaki}</p>
          <p className="text-lg md:text-2xl font-black text-destructive mt-1">{currency}{totalMarketBaki.toLocaleString()}</p>
        </Card>
        <Card className="bg-primary text-white p-3">
          <p className="text-[8px] uppercase font-black opacity-70 tracking-widest">{t.activeDebtors}</p>
          <p className="text-lg md:text-2xl font-black mt-1">{customers.filter(c => (c.totalDue || 0) > 0).length}</p>
        </Card>
      </div>

      <Card className="border-accent/10 shadow-lg bg-white/50 backdrop-blur-sm">
        <CardHeader className="p-3 border-b bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t.searchBaki} className="pl-9 h-10 bg-white" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {displayCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground italic gap-2">
              <Inbox className="w-8 h-8 opacity-10" />
              <p className="text-xs font-bold uppercase tracking-widest opacity-20">
                {search ? "No matches" : "All debts cleared!"}
              </p>
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
                {displayCustomers.map((c) => (
                  <TableRow key={c.id} className="hover:bg-accent/5">
                    <TableCell className="pl-4 py-3 font-bold text-xs text-primary">{c.firstName} {c.lastName}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-black",
                        (c.totalDue || 0) > 0 ? 'bg-red-50 text-destructive' : 'bg-green-50 text-green-600'
                      )}>
                        {currency}{c.totalDue?.toLocaleString() || '0'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setActiveCustomerId(c.id)}>
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

      {/* Sheet for Customer Baki Details */}
      <Sheet open={!!activeCustomerId} onOpenChange={(open) => !open && setActiveCustomerId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
          <SheetHeader className="p-4 border-b bg-accent/5">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-black flex items-center gap-2">
                {detailsCustomer?.firstName} {detailsCustomer?.lastName}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-accent" onClick={startEditingCustomer}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              </SheetTitle>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setActiveCustomerId(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-4 flex gap-3">
              <div className="flex-1 bg-white p-3 rounded-xl border-2 border-accent/10 shadow-inner">
                <p className="text-[8px] font-black uppercase opacity-50">Total Debt</p>
                <p className="text-xl font-black text-destructive">{currency}{detailsCustomer?.totalDue?.toLocaleString()}</p>
              </div>
              <Button className="bg-accent h-auto font-black uppercase text-[10px] px-4" onClick={() => setIsRecordAddOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add Baki
              </Button>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1 p-4 bg-muted/5">
            <div className="space-y-3">
              {currentBakiRecords.length === 0 ? (
                <div className="py-20 text-center opacity-30 italic flex flex-col items-center gap-3">
                  <CheckCircle2 className="w-10 h-10" />
                  <p className="text-xs font-black uppercase tracking-widest">ALL DEBTS CLEARED!</p>
                </div>
              ) : (
                currentBakiRecords.map((record: any) => (
                  <Card key={record.id} className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-bold text-xs text-primary">{record.productName}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[8px] h-4 font-black">Qty: {record.quantity}</Badge>
                            <span className="text-[8px] text-muted-foreground font-bold flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" /> {new Date(record.takenDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-sm text-primary">{currency}{record.amount.toLocaleString()}</p>
                          <div className="flex items-center gap-1 justify-end mt-1">
                            <button onClick={() => startEditingRecord(record)} className="p-1 text-accent"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteBakiRecord(record)} className="p-1 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                         <Button size="sm" variant="outline" className="h-7 text-[9px] font-black uppercase text-accent border-accent/30" onClick={() => actions.payBakiRecord(activeCustomerId!, record.id, record.amount - (record.paidAmount || 0), record)}>
                           <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Paid
                         </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Edit Profile Dialog */}
      <Dialog open={isCustomerEditOpen} onOpenChange={setIsCustomerEditOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription className="text-xs">Update contact info or remove profile.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase">First Name</Label>
                <Input value={newCustomer.firstName} onChange={e => setNewCustomer({...newCustomer, firstName: e.target.value})} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase">Last Name</Label>
                <Input value={newCustomer.lastName} onChange={e => setNewCustomer({...newCustomer, lastName: e.target.value})} className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase">Phone</Label>
              <Input value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase">Address</Label>
              <Input value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} className="h-11 rounded-xl" />
            </div>

            <div className="pt-4 border-t">
              <div className={cn(
                "p-4 rounded-2xl flex items-center justify-between",
                detailsCustomer?.totalDue > 0 ? "bg-amber-50 border border-amber-100" : "bg-red-50 border border-red-100"
              )}>
                <div className="flex-1 pr-4">
                  <p className="text-[10px] font-black uppercase opacity-60">Delete Customer</p>
                  <p className="text-xs font-medium mt-1">
                    {detailsCustomer?.totalDue > 0 
                      ? "Debt must be ৳0 to delete profile." 
                      : "Permanently remove this customer?"}
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className={cn("rounded-xl", detailsCustomer?.totalDue > 0 && "opacity-20 grayscale pointer-events-none")}
                  onClick={() => setIsDeleteConfirmOpen(true)}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter><Button className="w-full bg-primary h-14 rounded-2xl font-black uppercase" onClick={handleUpdateCustomer}>Update Profile</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Lock className="w-5 h-5" /> Master Delete
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <b>{detailsCustomer?.firstName}</b>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:flex-row flex-col">
            <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="flex-1 h-12 rounded-xl font-bold" onClick={handleDeleteCustomer}>Confirm Wipe</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Baki Record Dialog */}
      <Dialog open={isRecordEditOpen} onOpenChange={setIsRecordEditOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-[2rem]">
          <DialogHeader><DialogTitle>Edit Baki Entry</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Product</Label><Input value={newRecord.productName} onChange={e => setNewRecord({...newRecord, productName: e.target.value})} className="h-11 rounded-xl" /></div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[10px] uppercase font-black">Qty</Label><Input type="number" step="0.01" className="h-11 rounded-xl" value={newRecord.quantity} onChange={e => setNewRecord({...newRecord, quantity: e.target.value})} /></div>
                <div className="space-y-1.5"><Label className="text-[10px] uppercase font-black">Price</Label><Input type="number" step="0.01" className="h-11 rounded-xl" value={newRecord.unitPrice} onChange={e => setNewRecord({...newRecord, unitPrice: e.target.value})} /></div>
             </div>
             <div className="bg-accent/5 p-4 rounded-2xl text-center border border-accent/10">
                <p className="text-[8px] uppercase font-black opacity-50">Adjusted Total</p>
                <p className="text-2xl font-black text-primary">{currency}{newRecord.amount}</p>
             </div>
          </div>
          <DialogFooter><Button className="w-full bg-primary h-14 rounded-2xl font-black" onClick={handleUpdateBakiRecord}>Update Entry</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Baki to Existing Customer Dialog */}
      <Dialog open={isRecordAddOpen} onOpenChange={setIsRecordAddOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-[2rem]">
          <DialogHeader><DialogTitle>Add New Baki</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Label className="text-[10px] font-black uppercase mb-1.5 block">Select Product</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                <Input placeholder="Search product..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="h-11 rounded-xl" />
              </div>
              {filteredProducts.length > 0 && (
                <Card className="absolute z-50 w-full mt-1 max-h-40 overflow-hidden shadow-xl bg-white border-accent/10 rounded-xl">
                  <ScrollArea className="h-full">
                    {filteredProducts.map(p => (
                      <button key={p.id} onClick={() => selectProduct(p)} className="w-full text-left p-3 hover:bg-accent/5 border-b text-xs flex justify-between items-center">
                        <span className="font-bold">{p.name}</span>
                        <span className="font-black text-accent">{currency}{p.sellingPrice}</span>
                      </button>
                    ))}
                  </ScrollArea>
                </Card>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-[10px] uppercase font-black">Qty</Label><Input type="number" step="0.01" className="h-11 rounded-xl" value={newRecord.quantity} onChange={e => setNewRecord({...newRecord, quantity: e.target.value})} /></div>
              <div className="space-y-1.5"><Label className="text-[10px] uppercase font-black">Price</Label><Input type="number" step="0.01" className="h-11 rounded-xl" value={newRecord.unitPrice} onChange={e => setNewRecord({...newRecord, unitPrice: e.target.value})} /></div>
            </div>
            <div className="bg-accent/5 p-4 rounded-2xl text-center border border-accent/10">
              <p className="text-[8px] uppercase font-black opacity-50">Debt Amount</p>
              <p className="text-3xl font-black text-primary mt-1">{currency}{newRecord.amount}</p>
            </div>
          </div>
          <DialogFooter><Button className="w-full bg-accent h-14 rounded-2xl font-black uppercase" onClick={handleAddBakiRecordOnly}>Save Baki</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Customer Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle>{addStep === 1 ? t.registerNewCustomer : t.initialBakiDetails}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {addStep === 1 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase">{t.firstName}</Label>
                    <Input className={cn("h-10", nameWarning && "border-red-500")} value={newCustomer.firstName} onChange={e => setNewCustomer({...newCustomer, firstName: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase">{t.lastName}</Label>
                    <Input className="h-10" value={newCustomer.lastName} onChange={e => setNewCustomer({...newCustomer, lastName: e.target.value})} />
                  </div>
                </div>
                {nameWarning && <p className="text-[10px] font-bold text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {nameWarning}</p>}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase">{t.phone}</Label>
                  <Input className={cn("h-10", phoneWarning && "border-red-500")} value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                  {phoneWarning && <p className="text-[10px] font-bold text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {phoneWarning}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase">{t.address}</Label>
                  <Input className="h-10" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Label className="text-[10px] font-black uppercase mb-1.5 block">Search Product</Label>
                  <Input placeholder="Type..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="h-10" />
                  {filteredProducts.length > 0 && (
                    <Card className="absolute z-50 w-full mt-1 max-h-40 overflow-hidden shadow-xl bg-white border-accent/10">
                      <ScrollArea className="h-full">
                        {filteredProducts.map(p => (
                          <button key={p.id} onClick={() => selectProduct(p)} className="w-full text-left p-3 hover:bg-accent/10 border-b text-xs flex justify-between items-center">
                            <span className="font-bold">{p.name}</span>
                            <span className="font-black text-accent">{currency}{p.sellingPrice}</span>
                          </button>
                        ))}
                      </ScrollArea>
                    </Card>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className="text-[10px] uppercase font-black">Qty</Label><Input type="number" step="0.01" value={newRecord.quantity} onChange={e => setNewRecord({...newRecord, quantity: e.target.value})} /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] uppercase font-black">Price</Label><Input type="number" step="0.01" value={newRecord.unitPrice} onChange={e => setNewRecord({...newRecord, unitPrice: e.target.value})} /></div>
                </div>
                <div className="bg-destructive/5 p-4 rounded-xl text-center border-2 border-destructive/10">
                  <Label className="text-[10px] uppercase font-black text-destructive">Initial Baki</Label>
                  <p className="text-2xl font-black text-destructive">{currency}{newRecord.amount}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            {addStep === 1 ? (
              <Button className="w-full bg-accent h-12 font-black uppercase" onClick={() => setAddStep(2)} disabled={!newCustomer.firstName || !!nameWarning || !!phoneWarning}>Next</Button>
            ) : (
              <Button className="w-full bg-primary h-12 font-black uppercase" onClick={handleAddCustomerAndBaki}>Save Everything</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
