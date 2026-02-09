
"use client"

import { useState, useMemo } from "react"
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
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  DialogFooter
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
import { suggestCustomerSegments } from "@/ai/flows/suggest-customer-segments"
import { useToast } from "@/hooks/use-toast"
import { useBusinessData } from "@/hooks/use-business-data"
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"

export default function CustomersPage() {
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  const { customers, actions, isLoading, currency, products } = useBusinessData()
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<{ segments: string[], reasoning: string } | null>(null)
  const [search, setSearch] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  
  // Details Sheet States
  const [detailsCustomer, setDetailsCustomer] = useState<any>(null)
  const [isRecordAddOpen, setIsRecordAddOpen] = useState(false)
  const [newRecord, setNewRecord] = useState({
    productName: "",
    quantity: "",
    amount: "",
    promiseDate: new Date().toISOString().split('T')[0]
  })

  // Fetch Baki Records for selected customer
  const bakiRecordsQuery = useMemoFirebase(() => {
    if (!user?.uid || !db || !detailsCustomer) return null;
    return query(
      collection(db, 'users', user.uid, 'customers', detailsCustomer.id, 'bakiRecords'),
      orderBy('takenDate', 'desc')
    );
  }, [user?.uid, db, detailsCustomer]);

  const { data: fbBakiRecords } = useCollection(bakiRecordsQuery);
  
  // Local or FB baki records
  const currentBakiRecords = detailsCustomer 
    ? (user ? (fbBakiRecords || []) : (detailsCustomer.bakiRecords || []))
    : [];

  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    totalDue: 0,
    segment: "Baki User"
  })

  const handleAddCustomer = () => {
    if (!newCustomer.firstName) return
    actions.addCustomer({
      ...newCustomer,
      totalDue: parseFloat(newCustomer.totalDue.toString()) || 0
    })
    setNewCustomer({ firstName: "", lastName: "", email: "", phone: "", address: "", totalDue: 0, segment: "Baki User" })
    setIsAddOpen(false)
    toast({ title: "Customer Added" })
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

  const handleAddBakiRecord = () => {
    if (!detailsCustomer || !newRecord.productName || !newRecord.amount) return;
    
    actions.addBakiRecord(detailsCustomer.id, {
      productName: newRecord.productName,
      quantity: parseFloat(newRecord.quantity) || 1,
      amount: parseFloat(newRecord.amount) || 0,
      promiseDate: new Date(newRecord.promiseDate).toISOString()
    });

    setNewRecord({
      productName: "",
      quantity: "",
      amount: "",
      promiseDate: new Date().toISOString().split('T')[0]
    });
    setIsRecordAddOpen(false);
    toast({ title: "Baki Recorded" });
  }

  const totalMarketBaki = customers.reduce((acc, c) => acc + (c.totalDue || 0), 0)

  if (isLoading) return <div className="p-10 text-center animate-pulse text-accent font-bold">Syncing Baki Data...</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-accent" /> Baki Management
          </h2>
          <p className="text-sm text-muted-foreground">Detailed credit tracking for your customers.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 gap-2 flex-1 sm:flex-none shadow-lg">
                <Plus className="w-4 h-4" /> Add New Baki User
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Register New Customer</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">First Name</Label>
                    <Input className="h-9" value={newCustomer.firstName} onChange={e => setNewCustomer({...newCustomer, firstName: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Last Name</Label>
                    <Input className="h-9" value={newCustomer.lastName} onChange={e => setNewCustomer({...newCustomer, lastName: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone Number</Label>
                  <Input className="h-9" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Address</Label>
                  <Input className="h-9" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full bg-accent" onClick={handleAddCustomer}>Create Profile</Button>
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
              <p className="text-[10px] uppercase font-bold opacity-60">Total Unpaid Baki</p>
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
              <p className="text-[10px] uppercase font-bold opacity-70">Active Debtors</p>
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
              placeholder="Search by name or phone..." 
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
              <p className="text-xs italic">No baki users found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6 text-[10px] uppercase font-bold">Customer Name</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Phone</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Current Baki</TableHead>
                  <TableHead className="text-right pr-6 text-[10px] uppercase font-bold">Actions</TableHead>
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
                          <Eye className="w-4 h-4" /> Details
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2 text-xs" onClick={() => setEditingCustomer(c)}>
                              <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-xs text-destructive" onClick={() => actions.deleteCustomer(c.id)}>
                              <Trash className="w-3.5 h-3.5" /> Delete User
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
            <div className="mt-6 flex gap-4">
              <div className="flex-1 bg-white p-3 rounded-xl border-2 border-accent/20 shadow-sm">
                <p className="text-[10px] font-bold uppercase opacity-50">Total Owed</p>
                <p className="text-2xl font-black text-destructive">{currency}{detailsCustomer?.totalDue?.toLocaleString()}</p>
              </div>
              <Button className="h-full bg-accent hover:bg-accent/90 shadow-xl px-6 font-bold" onClick={() => setIsRecordAddOpen(true)}>
                <Plus className="w-5 h-5 mr-2" /> Add New Baki
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-2">
                <History className="w-4 h-4 text-accent" /> Baki Transaction History
              </h3>
              
              {currentBakiRecords.length === 0 ? (
                <div className="text-center py-20 opacity-30 italic">
                  <Package className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-xs">No detailed records for this user.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentBakiRecords.map((record: any) => (
                    <Card key={record.id} className="border-none shadow-sm bg-muted/30 hover:bg-muted/50 transition-colors group">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="space-y-1 min-w-0 flex-1">
                            <p className="font-bold text-primary flex items-center gap-2">
                              <Package className="w-3.5 h-3.5 text-accent" />
                              {record.productName}
                            </p>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                              <ArrowUpRight className="w-3 h-3" /> 
                              Taken: {new Date(record.takenDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-black text-destructive">{currency}{record.amount.toLocaleString()}</p>
                            <p className="text-[9px] font-medium uppercase text-muted-foreground">Qty: {record.quantity}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-dashed border-muted-foreground/20">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-blue-500" />
                            <span className="text-[10px] font-bold uppercase text-blue-600">
                              Promise: {new Date(record.promiseDate).toLocaleDateString()}
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-xs text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => actions.deleteBakiRecord(detailsCustomer.id, record.id, record.amount)}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark as Paid
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* New Baki Record Dialog */}
      <Dialog open={isRecordAddOpen} onOpenChange={setIsRecordAddOpen}>
        <DialogContent className="w-[95vw] max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Item to Baki List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Product Name</Label>
              <Input 
                placeholder="e.g. Ray-Ban Sunglasses" 
                value={newRecord.productName} 
                onChange={e => setNewRecord({...newRecord, productName: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Quantity</Label>
                <Input 
                  type="number" 
                  value={newRecord.quantity} 
                  onChange={e => setNewRecord({...newRecord, quantity: e.target.value})} 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Total Amount ({currency})</Label>
                <Input 
                  type="number" 
                  value={newRecord.amount} 
                  onChange={e => setNewRecord({...newRecord, amount: e.target.value})} 
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Payment Promise Date</Label>
              <Input 
                type="date" 
                value={newRecord.promiseDate} 
                onChange={e => setNewRecord({...newRecord, promiseDate: e.target.value})} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full bg-accent shadow-xl" onClick={handleAddBakiRecord}>Record This Baki</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
        <DialogContent className="w-[95vw] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Customer Profile</DialogTitle>
          </DialogHeader>
          {editingCustomer && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">First Name</Label>
                  <Input className="h-9" value={editingCustomer.firstName} onChange={e => setEditingCustomer({...editingCustomer, firstName: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Last Name</Label>
                  <Input className="h-9" value={editingCustomer.lastName} onChange={e => setEditingCustomer({...editingCustomer, lastName: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input className="h-9" value={editingCustomer.phone} onChange={e => setEditingCustomer({...editingCustomer, phone: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Address</Label>
                <Input className="h-9" value={editingCustomer.address} onChange={e => setEditingCustomer({...editingCustomer, address: e.target.value})} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="w-full bg-accent" onClick={handleUpdateCustomer}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
