
"use client"

import { useState, useMemo, useEffect } from "react"
import { 
  Users, 
  Search, 
  Sparkles, 
  MoreHorizontal,
  Inbox,
  Plus,
  MapPin,
  Trash,
  Edit2,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Package,
  Eye,
  History,
  CheckCircle2,
  X,
  CreditCard,
  Receipt,
  ArrowRight,
  ChevronLeft,
  FileText,
  MoreVertical,
  ShoppingCart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
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
  const [addStep, setAddStep] = useState(1) // 1: Profile, 2: Baki Details
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  
  // Details Sheet States
  const [detailsCustomer, setDetailsCustomer] = useState<any>(null)
  const [isRecordAddOpen, setIsRecordAddOpen] = useState(false)
  
  // New Record State
  const [newRecord, setNewRecord] = useState({
    productName: "",
    quantity: "1",
    unitPrice: "",
    amount: "",
    promiseDate: new Date().toISOString().split('T')[0],
    note: ""
  })

  // Edit Baki State
  const [editingBakiRecord, setEditingBakiRecord] = useState<any>(null)

  // Partial Payment State
  const [paymentDialogRecord, setPaymentDialogRecord] = useState<any>(null)
  const [paymentAmount, setPaymentAmount] = useState("")

  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    totalDue: 0,
    segment: "Baki User"
  })

  // Auto calculate amount when quantity or unit price changes
  useEffect(() => {
    const qty = parseFloat(newRecord.quantity) || 0
    const price = parseFloat(newRecord.unitPrice) || 0
    const total = (qty * price).toFixed(2)
    setNewRecord(prev => ({ ...prev, amount: total }))
  }, [newRecord.quantity, newRecord.unitPrice])

  // Reset dialog state when opening
  const handleOpenAddDialog = (open: boolean) => {
    setIsAddOpen(open)
    if (open) {
      setAddStep(1)
      setNewCustomer({ firstName: "", lastName: "", email: "", phone: "", address: "", totalDue: 0, segment: "Baki User" })
      setNewRecord({ productName: "", quantity: "1", unitPrice: "", amount: "0.00", promiseDate: new Date().toISOString().split('T')[0], note: "" })
      setProductSearch("")
    }
  }

  const selectProduct = (p: any) => {
    setNewRecord(prev => ({
      ...prev,
      productName: p.name,
      unitPrice: p.sellingPrice.toString(),
    }))
    setProductSearch("")
    toast({ title: language === 'en' ? "Product Selected" : "পণ্য সিলেক্ট করা হয়েছে" })
  }

  // Fetch Baki Records for selected customer
  const bakiRecordsQuery = useMemoFirebase(() => {
    if (!user?.uid || !db || !detailsCustomer) return null;
    return query(
      collection(db, 'users', user.uid, 'customers', detailsCustomer.id, 'bakiRecords'),
      orderBy('takenDate', 'desc')
    );
  }, [user?.uid, db, detailsCustomer]);

  const { data: fbBakiRecords } = useCollection(bakiRecordsQuery);
  
  const currentBakiRecords = detailsCustomer 
    ? (user ? (fbBakiRecords || []) : (detailsCustomer.bakiRecords || []))
    : [];

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
    toast({ 
      title: language === 'en' ? "Customer Registered" : "কাস্টমার রেজিস্টার হয়েছে", 
      description: language === 'en' ? "Profile and initial baki record saved." : "প্রোফাইল এবং বাকির হিসাব সেভ হয়েছে।" 
    })
  }

  const handleUpdateCustomer = () => {
    if (!editingCustomer.firstName) return
    actions.updateCustomer(editingCustomer.id, {
      ...editingCustomer,
      totalDue: parseFloat(editingCustomer.totalDue.toString()) || 0
    })
    setEditingCustomer(null)
    toast({ title: "Profile Updated" })
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

    setNewRecord({
      productName: "",
      quantity: "1",
      unitPrice: "",
      amount: "0.00",
      promiseDate: new Date().toISOString().split('T')[0],
      note: ""
    });
    setIsRecordAddOpen(false);
    toast({ title: "Baki Recorded" });
  }

  const handleUpdateBakiRecord = () => {
    if (!detailsCustomer || !editingBakiRecord) return;
    const amount = parseFloat(editingBakiRecord.amount);
    const oldAmount = parseFloat(currentBakiRecords.find(r => r.id === editingBakiRecord.id)?.amount || 0);

    actions.updateBakiRecord(detailsCustomer.id, editingBakiRecord.id, {
      ...editingBakiRecord,
      amount: amount,
      quantity: parseFloat(editingBakiRecord.quantity) || 1,
      promiseDate: new Date(editingBakiRecord.promiseDate).toISOString()
    }, oldAmount);

    setEditingBakiRecord(null);
    toast({ title: "Record Updated" });
  }

  const handleDeleteBakiRecord = (recordId: string, amount: number, paid: number) => {
    if (!detailsCustomer) return;
    const remaining = amount - paid;
    actions.deleteBakiRecord(detailsCustomer.id, recordId, remaining);
    toast({ title: "Record Deleted" });
  }

  const handleMakePayment = () => {
    if (!detailsCustomer || !paymentDialogRecord || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    actions.payBakiRecord(detailsCustomer.id, paymentDialogRecord.id, amount, paymentDialogRecord);
    
    setPaymentAmount("");
    setPaymentDialogRecord(null);
    toast({ title: "Payment Recorded", description: `${currency}${amount} received.` });
  }

  const totalMarketBaki = customers.reduce((acc, c) => acc + (c.totalDue || 0), 0)

  // Filter products for dropdown
  const filteredProducts = useMemo(() => {
    if (!productSearch) return []
    return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
  }, [products, productSearch])

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
              <Button className="bg-accent hover:bg-accent/90 gap-2 flex-1 sm:flex-none h-12 shadow-lg font-bold text-base">
                <Plus className="w-5 h-5" /> {t.addNewBakiUser}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[500px] overflow-hidden p-0 border-accent/20">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="text-xl font-headline flex items-center gap-2">
                  {addStep === 1 ? t.registerNewCustomer : t.initialBakiDetails}
                  <Badge variant="secondary" className="ml-auto text-[10px] uppercase font-bold">{t.step} {addStep}/2</Badge>
                </DialogTitle>
                <DialogDescription>
                  {addStep === 1 
                    ? (language === 'en' ? "Start by creating the customer's identity profile." : "কাস্টমারের নাম ও প্রোফাইল তৈরি করুন।")
                    : (language === 'en' ? `Now record the products taken on credit by ${newCustomer.firstName}.` : `${newCustomer.firstName}-এর বাকির হিসাব লিখুন।`)
                  }
                </DialogDescription>
              </DialogHeader>

              <div className="p-6">
                {addStep === 1 ? (
                  <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase opacity-70">{t.firstName}</Label>
                        <Input className="h-11 border-accent/20" placeholder="e.g. Rahim" value={newCustomer.firstName} onChange={e => setNewCustomer({...newCustomer, firstName: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase opacity-70">{t.lastName}</Label>
                        <Input className="h-11 border-accent/20" placeholder="e.g. Uddin" value={newCustomer.lastName} onChange={e => setNewCustomer({...newCustomer, lastName: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase opacity-70">{t.phone}</Label>
                      <Input className="h-11 border-accent/20" placeholder="01XXX-XXXXXX" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase opacity-70">{t.address}</Label>
                      <Input className="h-11 border-accent/20" placeholder="House, Road, Area..." value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                    {/* Smart Product Search */}
                    <div className="space-y-1.5 relative">
                      <Label className="text-xs font-bold uppercase opacity-70 flex items-center gap-2">
                        <ShoppingCart className="w-3 h-3" /> {language === 'en' ? 'Quick Product Select (A to Z)' : 'পণ্য নির্বাচন করুন (অটো)'}
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          className="h-11 pl-10 border-accent/30 bg-accent/5 focus-visible:ring-accent" 
                          placeholder={language === 'en' ? 'Search inventory...' : 'পণ্যের নাম দিয়ে খুঁজুন...'}
                          value={productSearch}
                          onChange={e => setProductSearch(e.target.value)}
                        />
                      </div>
                      {filteredProducts.length > 0 && (
                        <Card className="absolute z-50 w-full mt-1 shadow-2xl border-accent/20 max-h-48 overflow-hidden">
                          <ScrollArea className="h-full">
                            {filteredProducts.map(p => (
                              <button 
                                key={p.id} 
                                onClick={() => selectProduct(p)}
                                className="w-full text-left p-3 hover:bg-accent/10 transition-colors border-b last:border-0 flex justify-between items-center"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold truncate">{p.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{language === 'en' ? 'Stock' : 'স্টক'}: {p.stock} {p.unit}</p>
                                </div>
                                <span className="text-xs font-black text-accent">{currency}{p.sellingPrice}</span>
                              </button>
                            ))}
                          </ScrollArea>
                        </Card>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase opacity-70">{t.language === 'en' ? 'Product Name' : 'পণ্যের নাম'}</Label>
                      <Input className="h-11 border-accent/20" placeholder="e.g. Super Power Battery" value={newRecord.productName} onChange={e => setNewRecord({...newRecord, productName: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase opacity-70">{language === 'en' ? 'Qty' : 'পরিমাণ'}</Label>
                        <Input type="number" step="0.01" className="h-11 border-accent/20" value={newRecord.quantity} onChange={e => setNewRecord({...newRecord, quantity: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase opacity-70">{language === 'en' ? 'Unit Price' : 'দর'}</Label>
                        <Input type="number" step="0.01" className="h-11 border-accent/20" value={newRecord.unitPrice} onChange={e => setNewRecord({...newRecord, unitPrice: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase opacity-70">{t.language === 'en' ? 'Total' : 'মোট বকেয়া'}</Label>
                        <Input type="number" step="0.01" className="h-11 border-accent/20 font-black text-destructive bg-destructive/5" placeholder="0.00" value={newRecord.amount} onChange={e => setNewRecord({...newRecord, amount: e.target.value})} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase opacity-70">{t.promiseDate}</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="date" className="h-11 pl-10 border-accent/20" value={newRecord.promiseDate} onChange={e => setNewRecord({...newRecord, promiseDate: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase opacity-70">{t.noteRemarks}</Label>
                      <Textarea 
                        className="border-accent/20 text-xs min-h-[60px]" 
                        placeholder="Add extra details here..." 
                        value={newRecord.note} 
                        onChange={e => setNewRecord({...newRecord, note: e.target.value})} 
                      />
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="p-6 bg-muted/20 border-t flex flex-row gap-3">
                {addStep === 1 ? (
                  <>
                    <Button variant="ghost" className="flex-1 h-12" onClick={() => handleAddCustomerAndBaki()} disabled={!newCustomer.firstName}>{t.language === 'en' ? 'Skip Baki' : 'বাকি ছাড়া সেভ করুন'}</Button>
                    <Button className="flex-1 bg-accent h-12 text-base font-bold shadow-lg" onClick={() => setAddStep(2)} disabled={!newCustomer.firstName}>
                      {t.nextAddBaki} <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="icon" className="h-12 w-12 shrink-0 border border-accent/10" onClick={() => setAddStep(1)}>
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button className="flex-1 bg-primary hover:bg-primary/90 h-12 text-base font-bold shadow-xl" onClick={handleAddCustomerAndBaki} disabled={!newRecord.productName || !newRecord.amount}>
                      <CheckCircle2 className="mr-2 w-5 h-5 text-accent" /> {t.saveProfileBaki}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="bg-destructive/10 border-destructive/20 shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-destructive text-white rounded-xl shadow-lg">
               <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold opacity-60">{t.totalUnpaidBaki}</p>
              <p className="text-2xl font-black text-destructive">{currency}{totalMarketBaki.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary text-white border-none shadow-lg">
           <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
               <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold opacity-70">{t.activeDebtors}</p>
              <p className="text-2xl font-black">{customers.filter(c => (c.totalDue || 0) > 0).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-accent/10 shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder={t.searchBaki} 
              className="pl-9 h-11 bg-white" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4 text-center">
              <Inbox className="w-12 h-12 opacity-10" />
              <p className="text-xs italic">{t.noData}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6 text-[10px] uppercase font-bold">{t.customerName}</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">{t.phone}</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">{t.currentBaki}</TableHead>
                  <TableHead className="text-right pr-6 text-[10px] uppercase font-bold">{t.language === 'en' ? 'Actions' : 'অ্যাকশন'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers
                  .filter(c => `${c.firstName} ${c.lastName} ${c.phone}`.toLowerCase().includes(search.toLowerCase()))
                  .map((c) => (
                  <TableRow key={c.id} className="group">
                    <TableCell className="pl-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-primary group-hover:text-accent transition-colors">{c.firstName} {c.lastName}</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{c.address || 'No address'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium">{c.phone}</TableCell>
                    <TableCell>
                      <span className={`text-sm font-black ${c.totalDue > 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {currency}{c.totalDue?.toLocaleString() || '0'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-9 px-4 gap-2 border-accent text-accent hover:bg-accent/5 font-bold"
                          onClick={() => setDetailsCustomer(c)}
                        >
                          <Eye className="w-4 h-4" /> {t.details}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2 text-xs" onClick={() => setEditingCustomer(c)}>
                              <Edit2 className="w-3.5 h-3.5" /> {t.edit}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-xs text-destructive" onClick={() => actions.deleteCustomer(c.id)}>
                              <Trash className="w-3.5 h-3.5" /> {t.delete}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Sheet */}
      <Sheet open={!!detailsCustomer} onOpenChange={(open) => !open && setDetailsCustomer(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col overflow-hidden">
          <SheetHeader className="p-6 border-b bg-accent/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-accent text-white flex items-center justify-center text-xl font-bold shadow-lg shrink-0">
                  {detailsCustomer?.firstName?.[0]}
                </div>
                <div className="min-w-0">
                  <SheetTitle className="text-2xl font-headline truncate">{detailsCustomer?.firstName} {detailsCustomer?.lastName}</SheetTitle>
                  <SheetDescription className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> {detailsCustomer?.address}
                  </SheetDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDetailsCustomer(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="mt-6 flex gap-4">
              <div className="flex-1 bg-white p-3 rounded-xl border-2 border-accent/20 shadow-sm">
                <p className="text-[10px] font-bold uppercase opacity-50">{t.language === 'en' ? 'Total Owed' : 'মোট বকেয়া'}</p>
                <p className="text-2xl font-black text-destructive">{currency}{detailsCustomer?.totalDue?.toLocaleString()}</p>
              </div>
              <Button className="h-full bg-accent hover:bg-accent/90 shadow-xl px-6 font-bold" onClick={() => setIsRecordAddOpen(true)}>
                <Plus className="w-5 h-5 mr-2" /> {t.language === 'en' ? 'Add Baki' : 'বাকি যোগ করুন'}
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-2">
                <History className="w-4 h-4 text-accent" /> {t.language === 'en' ? 'Baki Transaction History' : 'বাকির ট্রানজিশন হিস্ট্রি'}
              </h3>
              
              {currentBakiRecords.length === 0 ? (
                <div className="text-center py-20 opacity-30 italic">
                  <Package className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-xs">{t.noData}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentBakiRecords.map((record: any) => {
                    const paidAmount = record.paidAmount || 0;
                    const remainingAmount = record.amount - paidAmount;
                    const progress = (paidAmount / record.amount) * 100;
                    
                    return (
                      <Card key={record.id} className={`border-none shadow-sm transition-colors group relative ${record.status === 'paid' ? 'bg-green-50 opacity-70' : 'bg-muted/30 hover:bg-muted/50'}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="font-bold text-primary flex items-center gap-2">
                                <Package className={`w-3.5 h-3.5 ${record.status === 'paid' ? 'text-green-600' : 'text-accent'}`} />
                                {record.productName}
                                {record.status === 'paid' && <Badge className="bg-green-600 ml-2 text-[9px] h-4">{t.paid}</Badge>}
                              </div>
                              <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> 
                                {t.language === 'en' ? 'Taken' : 'নেওয়া হয়েছে'}: {new Date(record.takenDate).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right shrink-0 flex items-start gap-2">
                              <div>
                                <p className="text-lg font-black text-primary">{currency}{record.amount.toLocaleString()}</p>
                                <p className="text-[9px] font-medium uppercase text-muted-foreground">Qty: {record.quantity}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="gap-2 text-xs" onClick={() => setEditingBakiRecord({...record, promiseDate: record.promiseDate.split('T')[0]})}>
                                    <Edit2 className="w-3.5 h-3.5" /> {t.edit}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="gap-2 text-xs text-destructive" onClick={() => handleDeleteBakiRecord(record.id, record.amount, record.paidAmount)}>
                                    <Trash className="w-3.5 h-3.5" /> {t.delete}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          
                          {record.note && (
                            <div className="bg-white/50 p-2 rounded border border-dashed border-accent/20 mb-3 flex items-start gap-2">
                               <FileText className="w-3 h-3 text-accent mt-0.5" />
                               <p className="text-[10px] text-muted-foreground italic leading-relaxed">{record.note}</p>
                            </div>
                          )}

                          {record.status !== 'paid' && (
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-[10px] font-bold uppercase">
                                <span className="text-green-600">{t.paid}: {currency}{paidAmount.toLocaleString()}</span>
                                <span className="text-destructive">{t.unpaid}: {currency}{remainingAmount.toLocaleString()}</span>
                              </div>
                              <Progress value={progress} className="h-1.5 bg-muted" />
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t border-dashed border-muted-foreground/20">
                            <div className="flex items-center gap-1.5">
                              <ArrowUpRight className="w-3 h-3 text-blue-500" />
                              <span className="text-[10px] font-bold uppercase text-blue-600">
                                {t.language === 'en' ? 'Promise' : 'প্রমিজ'}: {new Date(record.promiseDate).toLocaleDateString()}
                              </span>
                            </div>
                            
                            {record.status !== 'paid' && (
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 text-xs border-accent text-accent hover:bg-accent/5"
                                  onClick={() => setPaymentDialogRecord(record)}
                                >
                                  <CreditCard className="w-3.5 h-3.5 mr-1" /> {t.language === 'en' ? 'Pay Part' : 'কিছু অংশ জমা'}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 text-xs text-destructive hover:bg-destructive/5"
                                  onClick={() => actions.payBakiRecord(detailsCustomer.id, record.id, remainingAmount, record)}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {t.language === 'en' ? 'Mark Paid' : 'সব জমা'}
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Separate Add Baki Dialog for existing customer */}
      <Dialog open={isRecordAddOpen} onOpenChange={setIsRecordAddOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{t.language === 'en' ? 'Add New Baki' : 'নতুন বাকি লিখুন'}</DialogTitle>
            <DialogDescription>{detailsCustomer?.firstName}-এর নতুন হিসেব যোগ করুন।</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             {/* Product selection logic same as add flow */}
             <div className="space-y-1.5 relative">
                <Label className="text-xs font-bold uppercase opacity-70">{language === 'en' ? 'Quick Select' : 'পণ্য খুঁজুন'}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    className="h-11 pl-10 border-accent/30 bg-accent/5" 
                    placeholder={language === 'en' ? 'Type product name...' : 'পণ্যের নাম লিখুন...'}
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                  />
                </div>
                {filteredProducts.length > 0 && (
                  <Card className="absolute z-50 w-full mt-1 shadow-xl border-accent/20 max-h-40 overflow-hidden">
                    <ScrollArea className="h-full">
                      {filteredProducts.map(p => (
                        <button key={p.id} onClick={() => selectProduct(p)} className="w-full text-left p-3 hover:bg-accent/10 border-b last:border-0 flex justify-between">
                          <span className="text-xs font-bold">{p.name}</span>
                          <span className="text-xs font-black text-accent">{currency}{p.sellingPrice}</span>
                        </button>
                      ))}
                    </ScrollArea>
                  </Card>
                )}
             </div>
             
             <div className="space-y-1.5">
                <Label className="text-xs">{t.language === 'en' ? 'Product Name' : 'পণ্যের নাম'}</Label>
                <Input value={newRecord.productName} onChange={e => setNewRecord({...newRecord, productName: e.target.value})} />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">{language === 'en' ? 'Quantity' : 'পরিমাণ'}</Label>
                  <Input type="number" value={newRecord.quantity} onChange={e => setNewRecord({...newRecord, quantity: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{language === 'en' ? 'Unit Price' : 'দর'}</Label>
                  <Input type="number" value={newRecord.unitPrice} onChange={e => setNewRecord({...newRecord, unitPrice: e.target.value})} />
                </div>
             </div>

             <div className="space-y-1.5">
                <Label className="text-xs font-black text-destructive">{language === 'en' ? 'Total Owed' : 'মোট বকেয়া'}</Label>
                <Input type="number" className="h-12 text-lg font-bold bg-destructive/5 border-destructive/20" value={newRecord.amount} onChange={e => setNewRecord({...newRecord, amount: e.target.value})} />
             </div>

             <div className="space-y-1.5">
                <Label className="text-xs">{t.promiseDate}</Label>
                <Input type="date" value={newRecord.promiseDate} onChange={e => setNewRecord({...newRecord, promiseDate: e.target.value})} />
             </div>
          </div>
          <DialogFooter>
            <Button className="w-full h-12 bg-accent" onClick={handleAddBakiRecordOnly}>{t.language === 'en' ? 'Record Baki' : 'বাকি সেভ করুন'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Partial Payment Dialog */}
      <Dialog open={!!paymentDialogRecord} onOpenChange={(open) => !open && setPaymentDialogRecord(null)}>
        <DialogContent className="w-[95vw] max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t.language === 'en' ? 'Receive Payment' : 'টাকা গ্রহণ করুন'}</DialogTitle>
            <DialogDescription>
              {t.language === 'en' ? 'Record a payment for:' : 'টাকা জমা নিন:'} {paymentDialogRecord?.productName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/30 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-xs">
                <span>{t.language === 'en' ? 'Total Bill' : 'মোট বিল'}:</span>
                <span className="font-bold">{currency}{paymentDialogRecord?.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>{t.paid}:</span>
                <span className="font-bold text-green-600">{currency}{(paymentDialogRecord?.paidAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-dashed font-black">
                <span>{t.unpaid}:</span>
                <span className="text-destructive">{currency}{(paymentDialogRecord?.amount - (paymentDialogRecord?.paidAmount || 0)).toLocaleString()}</span>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs">{t.language === 'en' ? 'Amount Received' : 'গ্রহীত টাকার পরিমাণ'} ({currency})</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                className="h-12 text-lg font-bold"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full bg-accent h-12 text-lg shadow-xl" onClick={handleMakePayment}>
              {t.language === 'en' ? 'Record Payment' : 'পেমেন্ট সেভ করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
