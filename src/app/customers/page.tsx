
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
  AlertCircle
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

  // Edit Customer Info State
  const [isCustomerEditOpen, setIsCustomerEditOpen] = useState(false)
  
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

  // --- REAL-TIME DUPLICATE WARNINGS ---
  const nameWarning = useMemo(() => {
    if (!newCustomer.firstName.trim()) return null;
    const fullName = (newCustomer.firstName + " " + (newCustomer.lastName || "")).toLowerCase().trim().replace(/\s+/g, ' ');
    const match = customers.find(c => {
      const cFull = (c.firstName + " " + (c.lastName || "")).toLowerCase().trim().replace(/\s+/g, ' ');
      return cFull === fullName || cFull.includes(fullName) || fullName.includes(cFull);
    });
    if (match) {
      return language === 'bn' ? `'${match.firstName} ${match.lastName}' নামে একজন গ্রাহক অলরেডি আছেন!` : `Customer '${match.firstName}' already exists!`;
    }
    return null;
  }, [newCustomer.firstName, newCustomer.lastName, customers, language]);

  const phoneWarning = useMemo(() => {
    const rawPhone = newCustomer.phone.replace(/\D/g, '');
    if (rawPhone.length < 5) return null;
    const match = customers.find(c => (c.phone || "").replace(/\D/g, '') === rawPhone);
    if (match) {
      return language === 'bn' ? `এই ফোন নম্বরটি '${match.firstName}' এর জন্য ব্যবহৃত হয়েছে!` : `Phone used by '${match.firstName}'!`;
    }
    return null;
  }, [newCustomer.phone, customers, language]);

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
      productId: p.id,
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
  
  // CRITICAL: Filter out PAID records so they don't clutter the Baki detail list
  const currentBakiRecords = useMemo(() => {
    const rawRecords = detailsCustomer ? (user ? (fbBakiRecords || []) : (detailsCustomer.bakiRecords || [])) : [];
    return rawRecords.filter((r: any) => r.status !== 'paid');
  }, [fbBakiRecords, detailsCustomer, user]);

  const handleOpenAddDialog = (open: boolean) => {
    setIsAddOpen(open)
    if (open) {
      setAddStep(1)
      setNewCustomer({ firstName: "", lastName: "", email: "", phone: "", address: "", totalDue: 0, segment: "Baki User" })
      setNewRecord({ productId: "", productName: "", quantity: "1", unitPrice: "", amount: "0.00", promiseDate: new Date().toISOString().split('T')[0], note: "" })
      setProductSearch("")
    }
  }

  const validateCustomer = (cust: any, isUpdate = false, originalId?: string) => {
    const fName = cust.firstName.trim();
    const lName = (cust.lastName || "").trim();
    const phone = (cust.phone || "").trim().replace(/\D/g, '');

    if (!fName) {
      toast({ variant: "destructive", title: language === 'bn' ? "প্রথম নাম আবশ্যক!" : "First name required!" });
      return false;
    }

    const normalizedFullName = (fName + " " + lName).toLowerCase().replace(/\s+/g, ' ');
    const isNameDuplicate = customers.some(c => {
      const cFullName = (c.firstName + " " + (c.lastName || "")).toLowerCase().replace(/\s+/g, ' ');
      const match = cFullName === normalizedFullName;
      return isUpdate ? (match && c.id !== originalId) : match;
    });

    if (isNameDuplicate) {
      toast({ variant: "destructive", title: language === 'bn' ? "ডুপ্লিকেট নাম!" : "Duplicate Name!" });
      return false;
    }

    if (phone) {
      const isPhoneDuplicate = customers.some(c => {
        const cPhone = (c.phone || "").replace(/\D/g, '');
        const match = cPhone === phone;
        return isUpdate ? (match && c.id !== originalId) : match;
      });
      if (isPhoneDuplicate) {
        toast({ variant: "destructive", title: language === 'bn' ? "নম্বরটি ব্যবহৃত হয়েছে!" : "Phone Already Used!" });
        return false;
      }
    }

    return true;
  }

  const handleAddCustomerAndBaki = () => {
    if (!validateCustomer(newCustomer)) return;

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
    toast({ title: language === 'en' ? "Customer Saved" : "কাস্টমার সেভ হয়েছে" })
  }

  const handleUpdateCustomer = () => {
    if (!detailsCustomer) return;
    if (!validateCustomer(newCustomer, true, detailsCustomer.id)) return;

    actions.updateCustomer(detailsCustomer.id, {
      firstName: newCustomer.firstName,
      lastName: newCustomer.lastName,
      phone: newCustomer.phone,
      address: newCustomer.address
    });
    setDetailsCustomer({ ...detailsCustomer, ...newCustomer });
    setIsCustomerEditOpen(false);
    toast({ title: language === 'en' ? "Profile Updated" : "প্রোফাইল আপডেট হয়েছে" });
  }

  const handleAddBakiRecordOnly = () => {
    if (!detailsCustomer || !newRecord.productName || !newRecord.amount) {
      toast({ variant: "destructive", title: "Missing Information" })
      return;
    }
    actions.addBakiRecord(detailsCustomer.id, {
      productId: newRecord.productId,
      productName: newRecord.productName,
      quantity: parseFloat(newRecord.quantity) || 1,
      amount: parseFloat(newRecord.amount) || 0,
      promiseDate: new Date(newRecord.promiseDate).toISOString(),
      note: newRecord.note
    });
    setIsRecordAddOpen(false);
    setNewRecord({ productId: "", productName: "", quantity: "1", unitPrice: "", amount: "0.00", promiseDate: new Date().toISOString().split('T')[0], note: "" })
    toast({ title: "Baki Recorded" });
  }

  const handleUpdateBakiRecord = () => {
    if (!detailsCustomer || !editingRecord || !newRecord.amount) return;
    
    actions.updateBakiRecord(detailsCustomer.id, editingRecord.id, {
      productName: newRecord.productName,
      quantity: parseFloat(newRecord.quantity) || 1,
      amount: parseFloat(newRecord.amount) || 0,
      note: newRecord.note
    }, editingRecord.amount, editingRecord.productId, editingRecord.quantity);
    
    setIsRecordEditOpen(false);
    setEditingRecord(null);
    toast({ title: "Record Updated" });
  }

  const handleDeleteBakiRecord = (record: any) => {
    if (!detailsCustomer) return;
    const confirmDelete = window.confirm("Are you sure?");
    if (confirmDelete) {
      actions.deleteBakiRecord(detailsCustomer.id, record.id, record.amount - (record.paidAmount || 0), record.productId, record.quantity);
      toast({ title: "Record Deleted" });
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
        if (search.trim() === "") {
          return (c.totalDue || 0) > 0;
        }
        return matchesSearch;
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
          <p className="text-[8px] uppercase font-black opacity-70 tracking-widest font-headline leading-none">{t.activeDebtors}</p>
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
          {displayCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground italic gap-2">
              <Inbox className="w-8 h-8 opacity-10" />
              <p className="text-xs font-bold uppercase tracking-widest opacity-20">
                {search ? "No matching customers" : "All debts are cleared!"}
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
                  <TableRow key={c.id} className="hover:bg-accent/5 group">
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

      {/* Add New Customer Dialog */}
      <Dialog open={isAddOpen} onOpenChange={handleOpenAddDialog}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-[2rem]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{addStep === 1 ? t.registerNewCustomer : t.initialBakiDetails}</DialogTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsAddOpen(false)}><X className="w-4 h-4" /></Button>
            </div>
            <DialogDescription className="text-[10px] font-bold opacity-60">Follow the steps to register a new debtor.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {addStep === 1 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase">{t.firstName}</Label>
                    <Input 
                      className={cn("h-10", nameWarning && "border-red-500 focus-visible:ring-red-500")} 
                      value={newCustomer.firstName} 
                      onChange={e => setNewCustomer({...newCustomer, firstName: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase">{t.lastName}</Label>
                    <Input className="h-10" value={newCustomer.lastName} onChange={e => setNewCustomer({...newCustomer, lastName: e.target.value})} />
                  </div>
                </div>
                {nameWarning && (
                  <p className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {nameWarning}
                  </p>
                )}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase">{t.phone}</Label>
                  <Input 
                    className={cn("h-10", phoneWarning && "border-red-500 focus-visible:ring-red-500")} 
                    value={newCustomer.phone} 
                    onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} 
                  />
                  {phoneWarning && (
                    <p className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {phoneWarning}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase">{t.address}</Label>
                  <Input className="h-10" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
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
              <Button 
                className="w-full bg-accent h-12 font-black uppercase" 
                onClick={() => setAddStep(2)} 
                disabled={!newCustomer.firstName || !!nameWarning || !!phoneWarning}
              >
                Next: Add Baki Details
              </Button>
            ) : (
              <Button className="w-full bg-primary h-12 font-black uppercase" onClick={handleAddCustomerAndBaki}>Save Customer & Baki</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Details Sheet */}
      <Sheet open={!!detailsCustomer} onOpenChange={(open) => !open && setDetailsCustomer(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
          <SheetHeader className="p-4 border-b bg-accent/5">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-black flex items-center gap-2">
                {detailsCustomer?.firstName} {detailsCustomer?.lastName}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-accent hover:bg-accent/10 rounded-full" onClick={startEditingCustomer}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              </SheetTitle>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-muted-foreground bg-white px-2 py-1 rounded-lg border">{detailsCustomer?.phone || 'No Phone'}</p>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10 text-muted-foreground" onClick={() => setDetailsCustomer(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <SheetDescription className="sr-only">Detailed credit history and info for {detailsCustomer?.firstName}.</SheetDescription>
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
                <div className="py-20 text-center text-muted-foreground opacity-30 italic flex flex-col items-center gap-3">
                  <CheckCircle2 className="w-10 h-10" />
                  <p className="text-xs font-black uppercase tracking-widest">All debts cleared!</p>
                </div>
              ) : (
                currentBakiRecords.map((record: any) => (
                  <Card key={record.id} className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-xs text-primary">{record.productName}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="secondary" className="text-[8px] h-4 font-black uppercase">Qty: {record.quantity}</Badge>
                            <span className="text-[8px] text-muted-foreground font-bold flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" /> {new Date(record.takenDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-sm text-primary">{currency}{record.amount.toLocaleString()}</p>
                          <div className="flex items-center gap-1 justify-end mt-1">
                            <button onClick={() => startEditingRecord(record)} className="p-1.5 hover:bg-accent/10 rounded-lg text-accent transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteBakiRecord(record)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                         <Button size="sm" variant="outline" className="h-7 text-[9px] font-black uppercase text-accent border-accent/30 hover:bg-accent hover:text-white shadow-sm" onClick={() => actions.payBakiRecord(detailsCustomer.id, record.id, record.amount - (record.paidAmount || 0), record)}>
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

      {/* Edit Customer Profile Dialog */}
      <Dialog open={isCustomerEditOpen} onOpenChange={setIsCustomerEditOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-[2rem]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Edit Profile</DialogTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsCustomerEditOpen(false)}><X className="w-4 h-4" /></Button>
            </div>
            <DialogDescription className="text-[10px] font-bold opacity-60">Update contact and address information.</DialogDescription>
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
              <Label className="text-[10px] font-black uppercase">Phone Number</Label>
              <Input value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase">Address</Label>
              <Input value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} className="h-11 rounded-xl" />
            </div>
          </div>
          <DialogFooter><Button className="w-full bg-primary h-14 rounded-2xl font-black uppercase" onClick={handleUpdateCustomer}>Save Profile Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Baki Record Dialog - FIXED: Added missing dialog */}
      <Dialog open={isRecordEditOpen} onOpenChange={setIsRecordEditOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-[2rem]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Edit Baki Record</DialogTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsRecordEditOpen(false)}><X className="w-4 h-4" /></Button>
            </div>
            <DialogDescription className="text-[10px] font-bold opacity-60">Modify the details of this credit entry.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase">Product Name</Label>
                <Input value={newRecord.productName} onChange={e => setNewRecord({...newRecord, productName: e.target.value})} className="h-11 rounded-xl" />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black">Quantity</Label>
                  <Input type="number" step="0.01" className="h-11 rounded-xl" value={newRecord.quantity} onChange={e => setNewRecord({...newRecord, quantity: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black">Unit Price</Label>
                  <Input type="number" step="0.01" className="h-11 rounded-xl" value={newRecord.unitPrice} onChange={e => setNewRecord({...newRecord, unitPrice: e.target.value})} />
                </div>
             </div>
             <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black">Note / Remarks</Label>
                <Input value={newRecord.note} onChange={e => setNewRecord({...newRecord, note: e.target.value})} className="h-11 rounded-xl" placeholder="Ex: promising to pay on Friday" />
             </div>
             <div className="bg-accent/5 p-4 rounded-2xl text-center border border-accent/10">
                <Label className="text-[10px] uppercase font-black text-accent">Adjusted Debt Amount</Label>
                <p className="text-3xl font-black text-primary mt-1">{currency}{newRecord.amount}</p>
             </div>
          </div>
          <DialogFooter>
            <Button className="w-full bg-primary h-14 rounded-2xl font-black uppercase shadow-xl" onClick={handleUpdateBakiRecord}>
              Update Baki Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Baki to Existing Customer Dialog */}
      <Dialog open={isRecordAddOpen} onOpenChange={setIsRecordAddOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-[2rem]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Add Baki Record</DialogTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsRecordAddOpen(false)}><X className="w-4 h-4" /></Button>
            </div>
            <DialogDescription className="text-[10px] font-bold opacity-60">Record a new credit transaction for this customer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Label className="text-[10px] font-black uppercase mb-1.5 block text-primary">Select Product</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                <Input placeholder="Type to search product..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="h-11 rounded-xl border-accent/20" />
              </div>
              {filteredProducts.length > 0 && (
                <Card className="absolute z-50 w-full mt-1 max-h-40 overflow-hidden shadow-xl bg-white border-accent/10 rounded-xl">
                  <ScrollArea className="h-full">
                    {filteredProducts.map(p => (
                      <button key={p.id} onClick={() => selectProduct(p)} className="w-full text-left p-3 hover:bg-accent/5 border-b text-xs flex justify-between items-center">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-[10px] uppercase font-black">Quantity</Label><Input type="number" step="0.01" className="h-11 rounded-xl" value={newRecord.quantity} onChange={e => setNewRecord({...newRecord, quantity: e.target.value})} /></div>
              <div className="space-y-1.5"><Label className="text-[10px] uppercase font-black">Unit Price</Label><Input type="number" step="0.01" className="h-11 rounded-xl" value={newRecord.unitPrice} onChange={e => setNewRecord({...newRecord, unitPrice: e.target.value})} /></div>
            </div>
            <div className="bg-accent/5 p-4 rounded-2xl text-center border border-accent/10">
              <Label className="text-[10px] uppercase font-black text-accent">New Debt Amount</Label>
              <p className="text-3xl font-black text-primary mt-1">{currency}{newRecord.amount}</p>
            </div>
          </div>
          <DialogFooter><Button className="w-full bg-accent h-14 rounded-2xl font-black uppercase" onClick={handleAddBakiRecordOnly}>Confirm & Save Baki</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
