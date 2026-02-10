
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
  Calendar,
  Package,
  Eye,
  History,
  CheckCircle2,
  X,
  CreditCard,
  ChevronLeft,
  FileText,
  MoreVertical,
  ShoppingCart,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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

  // Auto calculate amount when quantity or unit price changes
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

  // Fetch Baki Records for selected customer
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
                <DialogTitle>{addStep === 1 ? t.registerNewCustomer : t.initialBakiDetails}</DialogTitle>
                <DialogDescription>{addStep === 1 ? "Enter customer profile info." : "Record the debt details."}</DialogDescription>
              </DialogHeader>

              <div className="py-4">
                {addStep === 1 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>{t.firstName}</Label>
                        <Input value={newCustomer.firstName} onChange={e => setNewCustomer({...newCustomer, firstName: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t.lastName}</Label>
                        <Input value={newCustomer.lastName} onChange={e => setNewCustomer({...newCustomer, lastName: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t.phone}</Label>
                      <Input value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t.address}</Label>
                      <Input value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <Label className="text-xs font-bold uppercase mb-1.5 block">{language === 'en' ? 'Quick Product Search' : 'পণ্য খুঁজুন (অটো)'}</Label>
                      <Input 
                        placeholder={language === 'en' ? 'Type product name...' : 'পণ্যের নাম লিখুন...'}
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        className="bg-accent/5"
                      />
                      {filteredProducts.length > 0 && (
                        <Card className="absolute z-50 w-full mt-1 shadow-2xl border-accent/20 max-h-40 overflow-hidden">
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
                      <Label>Product Name</Label>
                      <Input value={newRecord.productName} onChange={e => setNewRecord({...newRecord, productName: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Qty</Label>
                        <Input type="number" value={newRecord.quantity} onChange={e => setNewRecord({...newRecord, quantity: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Unit Price</Label>
                        <Input type="number" value={newRecord.unitPrice} onChange={e => setNewRecord({...newRecord, unitPrice: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-destructive">Total Owed</Label>
                      <Input type="number" className="bg-destructive/5 font-black text-lg" value={newRecord.amount} onChange={e => setNewRecord({...newRecord, amount: e.target.value})} />
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                {addStep === 1 ? (
                  <Button className="w-full bg-accent" onClick={() => setAddStep(2)} disabled={!newCustomer.firstName}>
                    Next: Add Baki <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setAddStep(1)}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                    <Button className="flex-1 bg-primary" onClick={handleAddCustomerAndBaki}>{t.saveProfileBaki}</Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-destructive text-white rounded-xl shadow-lg"><DollarSign className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] uppercase font-bold opacity-60">{t.totalUnpaidBaki}</p>
              <p className="text-2xl font-black text-destructive">{currency}{totalMarketBaki.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary text-white">
           <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl"><Users className="w-6 h-6" /></div>
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
            <Input placeholder={t.searchBaki} className="pl-9 h-11 bg-white" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground italic"><Inbox className="w-12 h-12 mb-2 opacity-10" />{t.noData}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">{t.customerName}</TableHead>
                  <TableHead>{t.phone}</TableHead>
                  <TableHead>{t.currentBaki}</TableHead>
                  <TableHead className="text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.filter(c => `${c.firstName} ${c.lastName} ${c.phone}`.toLowerCase().includes(search.toLowerCase())).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="pl-6 py-4 font-bold">{c.firstName} {c.lastName}</TableCell>
                    <TableCell className="text-xs">{c.phone}</TableCell>
                    <TableCell className={`font-black ${c.totalDue > 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {currency}{c.totalDue?.toLocaleString() || '0'}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button size="sm" variant="outline" className="h-9 px-4 gap-2 border-accent text-accent" onClick={() => setDetailsCustomer(c)}>
                        <Eye className="w-4 h-4" /> {t.details}
                      </Button>
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
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
          <SheetHeader className="p-6 border-b bg-accent/5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-accent text-white flex items-center justify-center text-xl font-bold">{detailsCustomer?.firstName?.[0]}</div>
              <div>
                <SheetTitle className="text-2xl">{detailsCustomer?.firstName} {detailsCustomer?.lastName}</SheetTitle>
                <SheetDescription>{detailsCustomer?.address}</SheetDescription>
              </div>
            </div>
            <div className="mt-6 flex gap-4">
              <div className="flex-1 bg-white p-3 rounded-xl border-2 border-accent/20">
                <p className="text-[10px] font-bold uppercase opacity-50">Total Owed</p>
                <p className="text-2xl font-black text-destructive">{currency}{detailsCustomer?.totalDue?.toLocaleString()}</p>
              </div>
              <Button className="h-full bg-accent shadow-xl font-bold" onClick={() => setIsRecordAddOpen(true)}>
                <Plus className="w-5 h-5 mr-2" /> Add Baki
              </Button>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {currentBakiRecords.map((record: any) => (
                <Card key={record.id} className={cn("border-none shadow-sm", record.status === 'paid' ? 'bg-green-50' : 'bg-muted/30')}>
                  <CardContent className="p-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-bold text-primary flex items-center gap-2">
                          <Package className="w-3.5 h-3.5" /> {record.productName}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Taken: {new Date(record.takenDate).toLocaleDateString()}</p>
                      </div>
                      <p className="text-lg font-black text-primary">{currency}{record.amount.toLocaleString()}</p>
                    </div>
                    {record.status !== 'paid' && (
                      <div className="mt-4 pt-3 border-t border-dashed flex justify-between items-center">
                         <span className="text-[10px] font-bold text-blue-600 uppercase">Promise: {new Date(record.promiseDate).toLocaleDateString()}</span>
                         <Button size="sm" variant="outline" className="h-8 text-xs text-accent border-accent" onClick={() => actions.payBakiRecord(detailsCustomer.id, record.id, record.amount - (record.paidAmount || 0), record)}>
                           <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Paid
                         </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Add Baki Dialog */}
      <Dialog open={isRecordAddOpen} onOpenChange={setIsRecordAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Baki Record</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
             <div className="relative">
                <Label>Search Product</Label>
                <Input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Type product name..." className="bg-accent/5" />
                {filteredProducts.length > 0 && (
                  <Card className="absolute z-50 w-full mt-1 max-h-40 overflow-hidden shadow-xl">
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
             <Input placeholder="Product Name" value={newRecord.productName} onChange={e => setNewRecord({...newRecord, productName: e.target.value})} />
             <div className="grid grid-cols-2 gap-4">
                <Input type="number" placeholder="Qty" value={newRecord.quantity} onChange={e => setNewRecord({...newRecord, quantity: e.target.value})} />
                <Input type="number" placeholder="Unit Price" value={newRecord.unitPrice} onChange={e => setNewRecord({...newRecord, unitPrice: e.target.value})} />
             </div>
             <Input type="number" className="font-bold text-destructive" placeholder="Total" value={newRecord.amount} onChange={e => setNewRecord({...newRecord, amount: e.target.value})} />
             <Input type="date" value={newRecord.promiseDate} onChange={e => setNewRecord({...newRecord, promiseDate: e.target.value})} />
          </div>
          <DialogFooter><Button className="w-full bg-accent" onClick={handleAddBakiRecordOnly}>Save Baki</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
