
"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { 
  Users, 
  Search, 
  Plus, 
  Eye, 
  CheckCircle2, 
  Edit2, 
  Trash2, 
  Calendar, 
  X, 
  AlertTriangle, 
  Lock,
  Inbox,
  PackageSearch,
  ShoppingCart,
  Tag,
  FileText,
  DollarSign,
  Clock,
  Phone,
  MapPin,
  History,
  TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { useBusinessData } from "@/hooks/use-business-data"
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"

const COMMON_UNITS = ["KG", "PCS", "GM", "LTR", "BOX", "PKT", "DZ"]

function CustomersPageContent() {
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  const searchParams = useSearchParams()
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
  const [isRecordDeleteOpen, setIsRecordDeleteOpen] = useState(false)
  const [deletePass, setDeletePass] = useState("")
  const [recordToDelete, setRecordToDelete] = useState<any>(null)

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentRecord, setPaymentRecord] = useState<any>(null)
  
  const detailsCustomer = useMemo(() => {
    return customers.find(c => c.id === activeCustomerId) || null
  }, [customers, activeCustomerId])

  const [editingRecord, setEditingRecord] = useState<any>(null)
  
  const [newRecord, setNewRecord] = useState({
    productId: "",
    productName: "",
    quantity: "1",
    unit: "",
    unitPrice: "",
    amount: "0",
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

  // Calculations for current item being added/edited
  const currentItemCalc = useMemo(() => {
    const p = products.find(p => p.id === newRecord.productId);
    const buyPrice = p?.purchasePrice || 0;
    const qty = parseFloat(newRecord.quantity) || 0;
    const sellPrice = parseFloat(newRecord.unitPrice) || 0;
    const itemTotal = qty * sellPrice;
    const itemProfit = (sellPrice - buyPrice) * qty;
    return { itemTotal, itemProfit, buyPrice, baseUnit: p?.unit || '' };
  }, [newRecord.productId, newRecord.quantity, newRecord.unitPrice, products]);

  const handleUnitSwitch = (targetUnit: string) => {
    const current = newRecord.unit.toLowerCase();
    const target = targetUnit.toLowerCase();
    if (current === target) return;

    let qty = parseFloat(newRecord.quantity) || 0;
    let price = parseFloat(newRecord.unitPrice) || 0;

    if (current === 'kg' && target === 'gm') {
      qty = qty * 1000;
      price = price / 1000;
    } else if (current === 'gm' && target === 'kg') {
      qty = qty / 1000;
      price = price * 1000;
    }

    setNewRecord(prev => ({
      ...prev,
      unit: targetUnit,
      quantity: qty.toString(),
      unitPrice: price.toString(),
      amount: (qty * price).toFixed(2)
    }));
  }

  // Handle auto-open profile from URL
  useEffect(() => {
    const id = searchParams.get('id')
    if (id && customers.length > 0) {
      const exists = customers.find(c => c.id === id)
      if (exists) setActiveCustomerId(id)
    }
  }, [searchParams, customers])

  const nameWarning = useMemo(() => {
    if (!newCustomer.firstName.trim()) return null;
    const fullName = (newCustomer.firstName + " " + (newCustomer.lastName || "")).toLowerCase().trim();
    const match = customers.find(c => {
      if (activeCustomerId && c.id === activeCustomerId) return false;
      const cFull = (c.firstName + " " + (c.lastName || "")).toLowerCase().trim();
      return cFull === fullName;
    });
    if (match) return language === 'bn' ? `'${match.firstName}' নামে আছে!` : `Exist as '${match.firstName}'!`;
    return null;
  }, [newCustomer.firstName, newCustomer.lastName, customers, language, activeCustomerId]);

  const phoneWarning = useMemo(() => {
    const rawPhone = newCustomer.phone.replace(/\D/g, '');
    if (rawPhone.length < 5) return null;
    const match = customers.find(c => {
      if (activeCustomerId && c.id === activeCustomerId) return false;
      return (c.phone || "").replace(/\D/g, '') === rawPhone;
    });
    if (match) return language === 'bn' ? `ফোন নম্বরটি ব্যবহৃত!` : `Phone already used!`;
    return null;
  }, [newCustomer.phone, customers, language, activeCustomerId]);

  // Sync amount when quantity or unitPrice changes (for standard manual inputs)
  useEffect(() => {
    const qty = parseFloat(newRecord.quantity) || 0;
    const price = parseFloat(newRecord.unitPrice) || 0;
    const total = (qty * price).toFixed(2);
    if (total !== newRecord.amount) {
      setNewRecord(prev => ({ ...prev, amount: total }));
    }
  }, [newRecord.quantity, newRecord.unitPrice]);

  const selectProduct = (p: any) => {
    setNewRecord(prev => ({
      ...prev,
      productId: p.id,
      productName: p.name,
      unitPrice: p.sellingPrice.toString(),
      unit: p.unit || "",
      quantity: "1"
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
    return [...rawRecords].sort((a, b) => new Date(b.takenDate).getTime() - new Date(a.takenDate).getTime());
  }, [fbBakiRecords, detailsCustomer, user, activeCustomerId]);

  const handleAddCustomerAndBaki = () => {
    if (!newCustomer.firstName.trim()) return;
    const customerId = Date.now().toString()
    const bakiAmount = parseFloat(newRecord.amount) || 0
    
    actions.addCustomer({ ...newCustomer, id: customerId, totalDue: 0 })
    
    if (bakiAmount > 0) {
      actions.addBakiRecord(customerId, {
        productId: newRecord.productId,
        productName: newRecord.productName || (language === 'bn' ? "নতুন বাকি" : "New Debt"),
        quantity: parseFloat(newRecord.quantity) || 1,
        unit: newRecord.unit,
        amount: bakiAmount,
        promiseDate: new Date(newRecord.promiseDate).toISOString(),
        note: newRecord.note
      });
    }
    
    setIsAddOpen(false)
    setAddStep(1)
    setNewCustomer({ firstName: "", lastName: "", email: "", phone: "", address: "", totalDue: 0, segment: "Baki User" })
    setNewRecord({ productId: "", productName: "", quantity: "1", unit: "", unitPrice: "", amount: "0", promiseDate: new Date().toISOString().split('T')[0], note: "" })
    toast({ title: "Customer & Baki Saved" })
  }

  const handleUpdateCustomer = () => {
    if (!activeCustomerId) return;
    actions.updateCustomer(activeCustomerId, newCustomer);
    setIsCustomerEditOpen(false);
    toast({ title: "Profile Updated" });
  }

  const handleDeleteCustomer = () => {
    if (!activeCustomerId) return;
    if (deletePass === "specsxr") {
      actions.deleteCustomer(activeCustomerId);
      setActiveCustomerId(null);
      setIsDeleteConfirmOpen(false);
      setIsCustomerEditOpen(false);
      setDeletePass("");
      toast({ title: "Customer Account Wiped" });
    } else {
      toast({ variant: "destructive", title: "Access Denied", description: "Incorrect master key." });
    }
  }

  const handleAddBakiRecordOnly = () => {
    if (!activeCustomerId || (!newRecord.productName && !newRecord.amount)) return;
    actions.addBakiRecord(activeCustomerId, {
      productId: newRecord.productId,
      productName: newRecord.productName || (language === 'bn' ? "নতুন বাকি" : "New Debt"),
      quantity: parseFloat(newRecord.quantity) || 1,
      unit: newRecord.unit,
      amount: parseFloat(newRecord.amount) || 0,
      promiseDate: new Date(newRecord.promiseDate).toISOString(),
      note: newRecord.note
    });
    setIsRecordAddOpen(false);
    setNewRecord({ productId: "", productName: "", quantity: "1", unit: "", unitPrice: "", amount: "0", promiseDate: new Date().toISOString().split('T')[0], note: "" })
  }

  const handleUpdateBakiRecord = () => {
    if (!activeCustomerId || !editingRecord) return;
    actions.updateBakiRecord(activeCustomerId, editingRecord.id, {
      productName: newRecord.productName,
      quantity: parseFloat(newRecord.quantity) || 1,
      unit: newRecord.unit,
      amount: parseFloat(newRecord.amount) || 0,
      note: newRecord.note,
      promiseDate: newRecord.promiseDate ? new Date(newRecord.promiseDate).toISOString() : null
    }, editingRecord.amount, editingRecord.productId, editingRecord.quantity);
    setIsRecordEditOpen(false);
    setEditingRecord(null);
    toast({ title: "Entry Updated" });
  }

  const startDeletingRecord = (record: any) => {
    setRecordToDelete(record);
    setDeletePass("");
    setIsRecordDeleteOpen(true);
  }

  const confirmDeleteBakiRecord = () => {
    if (!activeCustomerId || !recordToDelete) return;
    if (deletePass === "specsxr") {
      const remaining = recordToDelete.amount - (recordToDelete.paidAmount || 0);
      actions.deleteBakiRecord(activeCustomerId, recordToDelete.id, remaining, recordToDelete.productId, recordToDelete.quantity);
      setIsRecordDeleteOpen(false);
      setRecordToDelete(null);
      setDeletePass("");
      toast({ title: "History Entry Removed" });
    } else {
      toast({ variant: "destructive", title: "Invalid Key" });
    }
  }

  const handlePayment = () => {
    if (!activeCustomerId || !paymentRecord || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    actions.payBakiRecord(activeCustomerId, paymentRecord.id, amount, paymentRecord);
    setIsPaymentDialogOpen(false);
    setPaymentRecord(null);
    setPaymentAmount("");
    toast({ title: "Payment Recorded" });
  }

  const startEditingRecord = (record: any) => {
    setEditingRecord(record);
    const unitPrice = record.quantity > 0 ? (record.amount / record.quantity) : record.amount;
    setNewRecord({
      productId: record.productId || "",
      productName: record.productName,
      quantity: record.quantity.toString(),
      unit: record.unit || "",
      unitPrice: unitPrice.toFixed(2),
      amount: record.amount.toString(),
      promiseDate: record.promiseDate ? new Date(record.promiseDate).toISOString().split('T')[0] : "",
      note: record.note || ""
    });
    setIsRecordEditOpen(true);
  }

  const startEditingCustomer = () => {
    if (!detailsCustomer) return;
    setNewCustomer({
      firstName: detailsCustomer.firstName || "",
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
        const fullName = `${c.firstName || ''} ${c.lastName || ''} ${c.phone || ''}`.toLowerCase();
        return fullName.includes(search.toLowerCase());
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
        <Button className="bg-accent hover:bg-accent/90 gap-2 w-full sm:w-auto h-10 shadow-lg font-black uppercase" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4" /> {t.addNewBakiUser}
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-2">
        <Card className="bg-destructive/10 border-destructive/20 p-3">
          <p className="text-[8px] uppercase font-black opacity-60 tracking-widest">{t.totalUnpaidBaki}</p>
          <p className="text-lg md:text-2xl font-black text-destructive mt-1">{currency}{totalMarketBaki.toLocaleString()}</p>
        </Card>
        <Card className="bg-primary text-white p-3">
          <p className="text-[8px] uppercase font-black opacity-70 tracking-widest">{t.activeDebtors}</p>
          <p className="text-lg md:text-2xl font-black mt-1">{customers.filter(c => (c.totalDue || 0) > 0).length}</p>
        </Card>
      </div>

      <Card className="border-accent/10 shadow-lg bg-white/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="p-3 border-b bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t.searchBaki} className="pl-9 h-10 bg-white rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {displayCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground italic gap-2">
              <Inbox className="w-8 h-8 opacity-10" />
              <p className="text-xs font-bold uppercase tracking-widest opacity-20">
                {search ? "No matches" : "No customers registered"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 p-4 md:p-6 bg-muted/5">
              {displayCustomers.map((c) => (
                <Card 
                  key={c.id} 
                  className="overflow-hidden border-accent/10 shadow-sm hover:shadow-md transition-all rounded-[1.5rem] bg-white cursor-pointer group active:scale-[0.98]"
                  onClick={() => setActiveCustomerId(c.id)}
                >
                  <div className="p-4 md:p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-inner group-hover:bg-accent group-hover:text-white transition-colors shrink-0">
                        <Users className="w-6 h-6 md:w-7 md:h-7" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm md:text-lg font-black text-primary leading-tight truncate group-hover:text-accent transition-colors">
                          {c.firstName || c.lastName ? `${c.firstName || ''} ${c.lastName || ''}` : 'Untitled Customer'}
                        </h3>
                        <div className="flex flex-col gap-1 mt-1">
                          <p className="text-[10px] md:text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-accent" /> {c.phone || 'No phone provided'}
                          </p>
                          {c.address && (
                            <p className="text-[9px] md:text-[10px] font-medium text-muted-foreground truncate flex items-center gap-1.5">
                              <MapPin className="w-2.5 h-2.5 text-accent" /> {c.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-[8px] md:text-[9px] font-black uppercase opacity-50 mb-1 tracking-widest">{t.currentBaki}</p>
                      <div className={cn(
                        "px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-sm md:text-base font-black shadow-sm transition-all",
                        (c.totalDue || 0) > 0 ? 'bg-red-50 text-destructive border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
                      )}>
                        {currency}{c.totalDue?.toLocaleString() || '0'}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!activeCustomerId} onOpenChange={(open) => !open && setActiveCustomerId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col border-l-accent/20">
          <SheetHeader className="p-6 border-b bg-accent/5 shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl md:text-2xl font-black flex items-center gap-3 text-primary uppercase tracking-tighter">
                <div className="p-2 bg-accent/10 rounded-xl"><Users className="w-6 h-6 text-accent" /></div>
                {detailsCustomer?.firstName || detailsCustomer?.lastName ? `${detailsCustomer?.firstName || ''} ${detailsCustomer?.lastName || ''}` : 'Customer Profile'}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-accent hover:bg-accent/10 rounded-full" onClick={startEditingCustomer}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              </SheetTitle>
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-white/50" onClick={() => setActiveCustomerId(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="mt-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-white p-4 rounded-2xl border-2 border-accent/10 shadow-inner flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-black uppercase opacity-50 tracking-widest">Total Outstanding</p>
                  <p className="text-2xl font-black text-destructive">{currency}{detailsCustomer?.totalDue?.toLocaleString()}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center border border-red-100"><DollarSign className="w-5 h-5 text-destructive" /></div>
              </div>
              <Button className="bg-accent h-auto font-black uppercase text-[10px] md:text-xs px-6 py-4 shadow-xl rounded-2xl gap-2 active:scale-95" onClick={() => setIsRecordAddOpen(true)}>
                <Plus className="w-5 h-5" /> Add New Baki
              </Button>
            </div>
          </SheetHeader>
          
          <div className="bg-muted/30 px-6 py-3 border-b flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <History className="w-4 h-4 text-accent" /> Full Transaction Ledger
            </p>
            <Badge variant="outline" className="text-[9px] font-bold border-accent/20 text-accent uppercase">{currentBakiRecords.length} Records</Badge>
          </div>

          <ScrollArea className="flex-1 p-4 md:p-6 bg-muted/5">
            <div className="space-y-5">
              {currentBakiRecords.length === 0 ? (
                <div className="py-24 text-center opacity-30 italic flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center"><CheckCircle2 className="w-10 h-10" /></div>
                  <p className="text-xs font-black uppercase tracking-widest">No transaction history found</p>
                </div>
              ) : (
                currentBakiRecords.map((record: any) => (
                  <Card key={record.id} className={cn(
                    "border border-accent/10 shadow-sm bg-white hover:shadow-md transition-all rounded-[1.5rem] overflow-hidden group",
                    record.status === 'paid' && "opacity-60 bg-muted/5"
                  )}>
                    <CardContent className="p-0">
                      <div className="p-4 md:p-5 bg-accent/5 border-b border-accent/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-xl shadow-sm border border-accent/10">
                            <Calendar className="w-4 h-4 text-accent" />
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-primary uppercase">{new Date(record.takenDate).toLocaleDateString()}</p>
                            <p className="text-[9px] font-bold text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3 text-accent" /> 
                              {new Date(record.takenDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        {record.status === 'paid' ? (
                          <Badge className="bg-green-100 text-green-700 border-none text-[9px] font-black px-3 h-6 rounded-lg uppercase tracking-tighter">
                            Full Paid
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-600 border border-amber-100 text-[9px] font-black px-3 h-6 rounded-lg uppercase tracking-tighter">
                            Pending
                          </Badge>
                        )}
                      </div>

                      <div className="p-5 space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-3 flex-1 min-w-0">
                            <div>
                              <Label className="text-[8px] font-black uppercase text-muted-foreground opacity-60 block mb-1">Item Details</Label>
                              <h4 className="font-black text-sm text-primary leading-tight truncate">{record.productName}</h4>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3">
                              <Badge className="bg-primary text-white border-none text-[10px] font-black px-3 h-7 rounded-xl uppercase tracking-tighter">
                                Qty: {record.quantity} {record.unit || 'PCS'}
                              </Badge>
                              <div className="h-4 w-px bg-muted mx-1 hidden sm:block" />
                              <p className="text-[10px] font-bold text-muted-foreground">Unit: {currency}{(record.amount / (record.quantity || 1)).toFixed(2)}</p>
                            </div>
                            
                            {(record.note || record.promiseDate) && (
                              <div className="grid grid-cols-1 gap-2 mt-2">
                                {record.note && (
                                  <div className="bg-muted/30 p-2.5 rounded-xl border border-black/5 flex items-start gap-2">
                                    <FileText className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                                    <p className="text-[10px] text-muted-foreground italic leading-relaxed">{record.note}</p>
                                  </div>
                                )}
                                {record.promiseDate && record.status !== 'paid' && (
                                  <div className="flex items-center gap-2 text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl w-fit border border-amber-100 shadow-sm">
                                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                                    <span>Promise: {new Date(record.promiseDate).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="text-right shrink-0 flex flex-col items-end gap-3">
                            <div className="bg-primary/5 p-3 rounded-2xl border border-primary/10 shadow-inner min-w-[100px]">
                              <p className="text-[8px] font-black uppercase opacity-50 mb-1">Total Due</p>
                              <p className="font-black text-xl text-primary">{currency}{record.amount.toLocaleString()}</p>
                              {record.status !== 'paid' && record.paidAmount > 0 && (
                                <p className="text-[9px] font-bold text-green-600 mt-1">Paid: {currency}{record.paidAmount}</p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-accent hover:bg-accent/10 rounded-xl" onClick={() => startEditingRecord(record)}>
                                <Edit2 className="w-4.5 h-4.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => startDeletingRecord(record)}>
                                <Trash2 className="w-4.5 h-4.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {record.status !== 'paid' && (
                          <div className="pt-4 border-t border-accent/5 flex justify-end">
                             <Button 
                               className="bg-accent hover:bg-accent/90 h-12 text-xs font-black uppercase text-white px-8 rounded-2xl transition-all shadow-xl shadow-accent/10 gap-2 active:scale-95" 
                               onClick={() => {
                                 setPaymentRecord(record);
                                 setPaymentAmount((record.amount - (record.paidAmount || 0)).toString());
                                 setIsPaymentDialogOpen(true);
                               }}
                             >
                               <CheckCircle2 className="w-4 h-4" /> Record Payment
                             </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Dialog open={isRecordDeleteOpen} onOpenChange={isRecordDeleteOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem]">
          <DialogHeader>
            <div className="flex items-center gap-3 text-destructive mb-2">
              <div className="p-2 bg-red-50 rounded-xl"><Lock className="w-6 h-6" /></div>
              <div>
                <DialogTitle className="font-black uppercase tracking-tighter">Security Authorization</DialogTitle>
                <DialogDescription className="text-xs">Master key required to delete history.</DialogDescription>
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-2">
              {language === 'bn' ? 'এই ইতিহাসটি চিরতরে মুছে যাবে এবং কাস্টমারের ব্যালেন্সে এটি প্রভাব ফেলবে। নিশ্চিত করতে সিক্রেট কী দিন।' : 'This record will be permanently removed and customer balance will be adjusted. Enter key to confirm.'}
            </p>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label className="text-[10px] font-black uppercase text-muted-foreground opacity-70 tracking-widest">Master Access Key</Label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              className="h-14 rounded-2xl text-2xl font-black text-center bg-accent/5 border-accent/10" 
              value={deletePass} 
              onChange={e => setDeletePass(e.target.value)} 
            />
          </div>
          <DialogFooter>
            <Button variant="destructive" className="w-full h-14 rounded-2xl font-black uppercase shadow-xl transition-all active:scale-95" onClick={confirmDeleteBakiRecord}>
              Authorize & Wipe Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2.5rem]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-2xl shadow-sm border border-green-100"><DollarSign className="w-7 h-7 text-green-600" /></div>
              <div>
                <DialogTitle className="text-xl font-black text-primary tracking-tighter">Receive Payment</DialogTitle>
                <DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">Settling dues for {paymentRecord?.productName}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="bg-primary/5 p-5 rounded-[1.5rem] text-center border-2 border-primary/10 shadow-inner">
              <p className="text-[10px] font-black uppercase opacity-50 mb-1 tracking-widest">Remaining Due</p>
              <p className="text-3xl font-black text-destructive">{currency}{(paymentRecord?.amount - (paymentRecord?.paidAmount || 0)).toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Amount Paying Now</Label>
              <Input 
                type="number" 
                step="0.01" 
                className="h-16 text-3xl font-black text-center bg-accent/5 border-accent/20 rounded-[1.2rem] shadow-sm focus-visible:ring-accent" 
                value={paymentAmount} 
                onChange={e => setPaymentAmount(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full bg-teal-700 hover:bg-teal-800 h-16 rounded-[1.5rem] font-black uppercase text-lg shadow-2xl transition-all active:scale-95 gap-2" onClick={handlePayment}>
              <CheckCircle2 className="w-6 h-6" /> Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RE-USABLE CALCULATION FORM PART */}
      {/* Used in Edit Baki, Add Baki, and New User Wizard Step 2 */}
      {/* Pass props to render calculation logic */}
      
      <Dialog open={isRecordEditOpen} onOpenChange={setIsRecordEditOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[550px] rounded-[2.5rem] p-0 overflow-hidden border-accent/20 shadow-2xl">
          <DialogHeader className="p-6 bg-accent/5 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-xl"><Edit2 className="w-6 h-6 text-accent" /></div>
                <div>
                  <DialogTitle className="text-xl font-black text-primary uppercase tracking-tighter">Edit Baki Entry</DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase opacity-60">Complete A to Z record adjustment.</DialogDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsRecordEditOpen(false)}><X className="w-4 h-4" /></Button>
            </div>
          </DialogHeader>
          <div className="p-6 space-y-5 bg-white max-h-[70vh] overflow-y-auto">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Product Name</Label>
              <Input value={newRecord.productName} onChange={e => setNewRecord({...newRecord, productName: e.target.value})} className="h-12 rounded-xl bg-accent/5 border-accent/10 font-bold" />
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-[9px] font-black uppercase text-muted-foreground">Qty</Label>
                  {(newRecord.unit?.toLowerCase() === 'kg' || newRecord.unit?.toLowerCase() === 'gm') && (
                    <div className="flex gap-1">
                      <button onClick={() => handleUnitSwitch('KG')} className={cn("text-[8px] px-1.5 py-0.5 rounded border font-black", newRecord.unit?.toUpperCase() === 'KG' ? "bg-accent text-white border-accent" : "bg-white text-accent border-accent/20")}>KG</button>
                      <button onClick={() => handleUnitSwitch('GM')} className={cn("text-[8px] px-1.5 py-0.5 rounded border font-black", newRecord.unit?.toUpperCase() === 'GM' ? "bg-accent text-white border-accent" : "bg-white text-accent border-accent/20")}>GM</button>
                    </div>
                  )}
                </div>
                <Input type="number" step="0.01" className="h-11 bg-accent/5 border-accent/10 text-lg font-black" value={newRecord.quantity} onChange={(e) => setNewRecord({...newRecord, quantity: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-muted-foreground">Unit Price ({currency})</Label>
                <Input type="number" step="0.01" className="h-11 bg-accent/5 border-accent/10 text-lg font-black text-accent" value={newRecord.unitPrice} onChange={(e) => setNewRecord({...newRecord, unitPrice: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-muted-foreground">Amount (৳)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  className="h-11 bg-emerald-50/50 border-emerald-100 text-lg font-black text-emerald-700" 
                  placeholder="৳"
                  value={newRecord.amount}
                  onChange={(e) => {
                    const amt = parseFloat(e.target.value) || 0;
                    const price = parseFloat(newRecord.unitPrice) || 1;
                    setNewRecord({...newRecord, amount: e.target.value, quantity: (amt / price).toFixed(2)});
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 p-3 bg-muted/30 rounded-xl border border-muted flex justify-between items-center">
                <span className="text-[9px] font-black uppercase text-muted-foreground">Item Total</span>
                <span className="text-sm font-black text-primary">{currency}{parseFloat(newRecord.amount).toLocaleString()}</span>
              </div>
              <div className={cn("flex-1 p-3 rounded-xl border flex justify-between items-center", currentItemCalc.itemProfit < 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100")}>
                <span className={cn("text-[9px] font-black uppercase", currentItemCalc.itemProfit < 0 ? "text-red-600" : "text-emerald-600")}>{currentItemCalc.itemProfit < 0 ? 'Loss' : 'Lav'}</span>
                <span className={cn("text-sm font-black", currentItemCalc.itemProfit < 0 ? "text-red-600" : "text-emerald-700")}>{currentItemCalc.itemProfit < 0 ? '-' : '+'}{currency}{Math.abs(currentItemCalc.itemProfit).toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black text-muted-foreground">Debt Remark / Note</Label>
                <Input placeholder="Add any details..." className="h-12 rounded-xl" value={newRecord.note} onChange={e => setNewRecord({...newRecord, note: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black text-muted-foreground">Promise Date</Label>
                <Input type="date" className="h-12 rounded-xl bg-muted/20 border-none" value={newRecord.promiseDate} onChange={e => setNewRecord({...newRecord, promiseDate: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-muted/20 border-t">
            <Button className="w-full bg-primary hover:bg-primary/90 h-14 rounded-2xl font-black uppercase shadow-xl transition-all active:scale-95" onClick={handleUpdateBakiRecord}>
              Update Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRecordAddOpen} onOpenChange={setIsRecordAddOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[550px] rounded-[2.5rem] p-0 overflow-hidden border-accent/20 shadow-2xl">
          <DialogHeader className="p-6 bg-accent/5 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-xl"><ShoppingCart className="w-6 h-6 text-accent" /></div>
                <div>
                  <DialogTitle className="text-xl font-black text-primary uppercase tracking-tighter">Add Baki Record</DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase opacity-60">Detailed product & debt entry.</DialogDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsRecordAddOpen(false)}><X className="w-4 h-4" /></Button>
            </div>
          </DialogHeader>
          <div className="p-6 space-y-5 bg-white max-h-[70vh] overflow-y-auto">
            <div className="relative">
              <Label className="text-[10px] font-black uppercase mb-1.5 block text-muted-foreground">Search or Type Product</Label>
              <div className="relative">
                <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                <Input placeholder="Start typing product name..." value={productSearch || newRecord.productName} onChange={e => { setProductSearch(e.target.value); setNewRecord({...newRecord, productName: e.target.value}) }} className="pl-10 h-12 rounded-xl bg-accent/5 border-accent/10" />
              </div>
              {filteredProducts.length > 0 && (
                <Card className="absolute z-50 w-full mt-1 max-h-48 overflow-hidden shadow-2xl bg-white border-accent/10 rounded-xl animate-in slide-in-from-top-2">
                  <ScrollArea className="h-full">
                    {filteredProducts.map(p => (
                      <button key={p.id} onClick={() => selectProduct(p)} className="w-full text-left p-3 hover:bg-accent/5 border-b last:border-0 text-xs flex justify-between items-center group">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold group-hover:text-accent transition-colors truncate">{p.name}</p>
                          <p className="text-[9px] text-muted-foreground uppercase">{p.category || 'General'}</p>
                        </div>
                        <Badge variant="outline" className="font-black text-accent border-accent/20 bg-accent/5 shrink-0">
                          {currency}{p.sellingPrice} / {p.unit || 'pcs'}
                        </Badge>
                      </button>
                    ))}
                  </ScrollArea>
                </Card>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-[9px] font-black uppercase text-muted-foreground">Qty</Label>
                  {(newRecord.unit?.toLowerCase() === 'kg' || newRecord.unit?.toLowerCase() === 'gm') && (
                    <div className="flex gap-1">
                      <button onClick={() => handleUnitSwitch('KG')} className={cn("text-[8px] px-1.5 py-0.5 rounded border font-black", newRecord.unit?.toUpperCase() === 'KG' ? "bg-accent text-white border-accent" : "bg-white text-accent border-accent/20")}>KG</button>
                      <button onClick={() => handleUnitSwitch('GM')} className={cn("text-[8px] px-1.5 py-0.5 rounded border font-black", newRecord.unit?.toUpperCase() === 'GM' ? "bg-accent text-white border-accent" : "bg-white text-accent border-accent/20")}>GM</button>
                    </div>
                  )}
                </div>
                <Input type="number" step="0.01" className="h-11 bg-accent/5 border-accent/10 text-lg font-black" value={newRecord.quantity} onChange={(e) => setNewRecord({...newRecord, quantity: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-muted-foreground">Unit Price ({currency})</Label>
                <Input type="number" step="0.01" className="h-11 bg-accent/5 border-accent/10 text-lg font-black text-accent" value={newRecord.unitPrice} onChange={(e) => setNewRecord({...newRecord, unitPrice: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-muted-foreground">Amount (৳)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  className="h-11 bg-emerald-50/50 border-emerald-100 text-lg font-black text-emerald-700" 
                  placeholder="৳"
                  value={newRecord.amount}
                  onChange={(e) => {
                    const amt = parseFloat(e.target.value) || 0;
                    const price = parseFloat(newRecord.unitPrice) || 1;
                    setNewRecord({...newRecord, amount: e.target.value, quantity: (amt / price).toFixed(2)});
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 p-3 bg-muted/30 rounded-xl border border-muted flex justify-between items-center">
                <span className="text-[9px] font-black uppercase text-muted-foreground">Item Total</span>
                <span className="text-sm font-black text-primary">{currency}{parseFloat(newRecord.amount).toLocaleString()}</span>
              </div>
              <div className={cn("flex-1 p-3 rounded-xl border flex justify-between items-center", currentItemCalc.itemProfit < 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100")}>
                <span className={cn("text-[9px] font-black uppercase", currentItemCalc.itemProfit < 0 ? "text-red-600" : "text-emerald-600")}>{currentItemCalc.itemProfit < 0 ? 'Loss' : 'Lav'}</span>
                <span className={cn("text-sm font-black", currentItemCalc.itemProfit < 0 ? "text-red-600" : "text-emerald-700")}>{currentItemCalc.itemProfit < 0 ? '-' : '+'}{currency}{Math.abs(currentItemCalc.itemProfit).toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black text-muted-foreground">Promise Date</Label>
                <Input type="date" className="h-12 rounded-xl bg-muted/20 border-none" value={newRecord.promiseDate} onChange={e => setNewRecord({...newRecord, promiseDate: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black text-muted-foreground">Additional Note</Label>
                <Input placeholder="Add any details..." className="h-12 rounded-xl" value={newRecord.note} onChange={e => setNewRecord({...newRecord, note: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-muted/20 border-t">
            <Button className="w-full bg-accent hover:bg-accent/90 h-14 rounded-2xl font-black uppercase shadow-xl transition-all active:scale-95" onClick={handleAddBakiRecordOnly}>
              Confirm & Save Baki
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[550px] rounded-[2.5rem] p-0 overflow-hidden border-accent/20 shadow-2xl">
          <DialogHeader className="p-6 bg-primary text-white border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl border border-white/20"><Users className="w-6 h-6 text-accent" /></div>
                <div>
                  <DialogTitle className="text-xl font-black uppercase tracking-tighter">{addStep === 1 ? t.addNewBakiUser : 'Detailed Baki Entry'}</DialogTitle>
                  <p className="text-[9px] font-bold uppercase opacity-60 tracking-[0.2em]">Step {addStep} of 2</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10" onClick={() => setIsAddOpen(false)}><X className="w-4 h-4" /></Button>
            </div>
          </DialogHeader>
          <div className="p-6 bg-white max-h-[75vh] overflow-y-auto">
            {addStep === 1 ? (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase text-primary mb-1 block">{t.firstName}</Label>
                    <Input 
                      placeholder="e.g. Rohim"
                      className={cn("h-12 rounded-xl bg-accent/5 focus:ring-primary", nameWarning && "border-red-500")} 
                      value={newCustomer.firstName} 
                      onChange={e => setNewCustomer({...newCustomer, firstName: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase text-primary mb-1 block">{t.lastName}</Label>
                    <Input 
                      placeholder="e.g. Mia"
                      className="h-12 rounded-xl bg-accent/5 focus:ring-primary" 
                      value={newCustomer.lastName} 
                      onChange={e => setNewCustomer({...newCustomer, lastName: e.target.value})} 
                    />
                  </div>
                </div>
                {nameWarning && <p className="text-[10px] font-bold text-red-600 flex items-center gap-1 -mt-3"><AlertTriangle className="w-3 h-3" /> {nameWarning}</p>}
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase text-primary mb-1 block">{t.phone}</Label>
                  <Input 
                    placeholder="017XXXXXXXX"
                    className={cn("h-12 rounded-xl bg-accent/5 focus:ring-primary", phoneWarning && "border-red-500")} 
                    value={newCustomer.phone} 
                    onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} 
                  />
                  {phoneWarning && <p className="text-[10px] font-bold text-red-600 flex items-center gap-1 mt-1"><AlertTriangle className="w-3 h-3" /> {phoneWarning}</p>}
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase text-primary mb-1 block">{t.address}</Label>
                  <Input 
                    placeholder="e.g. Dhaka, Bangladesh"
                    className="h-12 rounded-xl bg-accent/5 focus:ring-primary" 
                    value={newCustomer.address} 
                    onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} 
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative">
                  <Label className="text-[10px] font-black uppercase mb-1.5 block text-muted-foreground">Select Product</Label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent opacity-50" />
                    <Input 
                      placeholder="Start typing product name..." 
                      value={productSearch || newRecord.productName} 
                      onChange={e => { setProductSearch(e.target.value); setNewRecord({...newRecord, productName: e.target.value}) }} 
                      className="pl-10 h-12 rounded-xl bg-accent/5 border-accent/10 font-bold" 
                    />
                  </div>
                  {filteredProducts.length > 0 && (
                    <Card className="absolute z-50 w-full mt-1 max-h-40 overflow-hidden shadow-2xl bg-white border-accent/10 rounded-xl">
                      <ScrollArea className="h-full">
                        {filteredProducts.map(p => (
                          <button key={p.id} onClick={() => selectProduct(p)} className="w-full text-left p-3 hover:bg-accent/5 border-b last:border-0 text-xs flex justify-between items-center group">
                            <span className="font-bold group-hover:text-accent">{p.name}</span>
                            <span className="font-black text-accent">{currency}{p.sellingPrice} / {p.unit || 'pcs'}</span>
                          </button>
                        ))}
                      </ScrollArea>
                    </Card>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground">Qty</Label>
                      {(newRecord.unit?.toLowerCase() === 'kg' || newRecord.unit?.toLowerCase() === 'gm') && (
                        <div className="flex gap-1">
                          <button onClick={() => handleUnitSwitch('KG')} className={cn("text-[8px] px-1.5 py-0.5 rounded border font-black", newRecord.unit?.toUpperCase() === 'KG' ? "bg-accent text-white border-accent" : "bg-white text-accent border-accent/20")}>KG</button>
                          <button onClick={() => handleUnitSwitch('GM')} className={cn("text-[8px] px-1.5 py-0.5 rounded border font-black", newRecord.unit?.toUpperCase() === 'GM' ? "bg-accent text-white border-accent" : "bg-white text-accent border-accent/20")}>GM</button>
                        </div>
                      )}
                    </div>
                    <Input type="number" step="0.01" className="h-11 bg-accent/5 border-accent/10 text-lg font-black" value={newRecord.quantity} onChange={(e) => setNewRecord({...newRecord, quantity: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Unit Price</Label>
                    <Input type="number" step="0.01" className="h-11 bg-accent/5 border-accent/10 text-lg font-black text-accent" value={newRecord.unitPrice} onChange={(e) => setNewRecord({...newRecord, unitPrice: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Amount (৳)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      className="h-11 bg-emerald-50/50 border-emerald-100 text-lg font-black text-emerald-700" 
                      placeholder="৳"
                      value={newRecord.amount}
                      onChange={(e) => {
                        const amt = parseFloat(e.target.value) || 0;
                        const price = parseFloat(newRecord.unitPrice) || 1;
                        setNewRecord({...newRecord, amount: e.target.value, quantity: (amt / price).toFixed(2)});
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 p-3 bg-muted/30 rounded-xl border border-muted flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase text-muted-foreground">Item Total</span>
                    <span className="text-sm font-black text-primary">{currency}{parseFloat(newRecord.amount).toLocaleString()}</span>
                  </div>
                  <div className={cn("flex-1 p-3 rounded-xl border flex justify-between items-center", currentItemCalc.itemProfit < 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100")}>
                    <span className={cn("text-[9px] font-black uppercase", currentItemCalc.itemProfit < 0 ? "text-red-600" : "text-emerald-600")}>{currentItemCalc.itemProfit < 0 ? 'Loss' : 'Lav'}</span>
                    <span className={cn("text-sm font-black", currentItemCalc.itemProfit < 0 ? "text-red-600" : "text-emerald-700")}>{currentItemCalc.itemProfit < 0 ? '-' : '+'}{currency}{Math.abs(currentItemCalc.itemProfit).toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground">Debt Reason/Note</Label>
                    <Input placeholder="Short note..." className="h-12 rounded-xl" value={newRecord.note} onChange={e => setNewRecord({...newRecord, note: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground">Promise Date</Label>
                    <Input type="date" className="h-12 rounded-xl" value={newRecord.promiseDate} onChange={e => setNewRecord({...newRecord, promiseDate: e.target.value})} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="p-6 bg-muted/20 border-t">
            {addStep === 1 ? (
              <Button className="w-full bg-primary h-14 rounded-2xl font-black uppercase shadow-xl transition-all active:scale-95" onClick={() => setAddStep(2)} disabled={!newCustomer.firstName || !!nameWarning || !!phoneWarning}>
                Next: Add Baki Details
              </Button>
            ) : (
              <div className="flex gap-3 w-full">
                <Button variant="outline" className="h-14 rounded-2xl font-black uppercase px-6" onClick={() => setAddStep(1)}>Back</Button>
                <Button className="flex-1 bg-accent hover:bg-accent/90 h-14 rounded-2xl font-black uppercase shadow-xl transition-all active:scale-95" onClick={handleAddCustomerAndBaki}>
                  Save Everything
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCustomerEditOpen} onOpenChange={setIsCustomerEditOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription className="text-xs">Update info or wipe profile.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">First Name</Label><Input value={newCustomer.firstName} onChange={e => setNewCustomer({...newCustomer, firstName: e.target.value})} className="h-11 rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Last Name</Label><Input value={newCustomer.lastName} onChange={e => setNewCustomer({...newCustomer, lastName: e.target.value})} className="h-11 rounded-xl" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Phone</Label><Input value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="h-11 rounded-xl" /></div>
            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Address</Label><Input value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} className="h-11 rounded-xl" /></div>
            <div className="pt-4 border-t">
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <p className="text-[10px] font-black uppercase opacity-60">Delete Customer</p>
                  <p className="text-xs font-medium mt-1">Permanently remove this customer and all history?</p>
                </div>
                <Button variant="destructive" size="icon" className="rounded-xl shadow-lg" onClick={() => setIsDeleteConfirmOpen(true)}><Trash2 className="w-5 h-5" /></Button>
              </div>
            </div>
          </div>
          <DialogFooter><Button className="w-full bg-primary h-14 rounded-2xl font-black uppercase" onClick={handleUpdateCustomer}>Update Profile</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><Lock className="w-5 h-5" /> Master Delete</DialogTitle>
            <DialogDescription>Enter secret key 'specsxr' to permanently wipe this customer.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label className="text-[10px] font-black uppercase">Master Access Key</Label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              className="h-12 rounded-xl" 
              value={deletePass} 
              onChange={e => setDeletePass(e.target.value)} 
            />
          </div>
          <DialogFooter><Button variant="destructive" className="w-full h-12 rounded-xl font-bold" onClick={handleDeleteCustomer}>Confirm Wipe</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center animate-pulse text-accent font-bold">Loading...</div>}>
      <CustomersPageContent />
    </Suspense>
  )
}
