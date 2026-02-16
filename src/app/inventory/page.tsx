
"use client"

import { useState, useMemo } from "react"
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  PackagePlus,
  Image as ImageIcon,
  Upload,
  AlertCircle,
  TrendingUp,
  FileText,
  DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { useBusinessData } from "@/hooks/use-business-data"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"
import { InventoryAd } from "@/components/inventory-ad"

export default function InventoryPage() {
  const { toast } = useToast()
  const { products, actions, isLoading, currency, language } = useBusinessData()
  const t = translations[language]
  
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [isAddOpen, setIsAddOpen] = useState(false)
  
  // Edit State
  const [editingProduct, setEditingProduct] = useState<any>(null)
  
  // Restock State
  const [restockProduct, setRestockProduct] = useState<any>(null)
  const [restockQty, setRestockQty] = useState("")
  const [restockPrice, setRestockPrice] = useState("")
  const [restockSellPrice, setRestockSellPrice] = useState("")
  const [restockNote, setRestockNote] = useState("")

  const units = ["pcs", "kg", "gm", "ltr", "meter", "box", "dozen"]

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean))
    return Array.from(cats)
  }, [products])

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    purchasePrice: "",
    sellingPrice: "",
    stock: "",
    unit: "pcs",
    alertThreshold: "5",
    imageUrl: ""
  })

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'new' | 'edit') => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      if (type === 'new') {
        setNewProduct(prev => ({ ...prev, imageUrl: base64 }))
      } else {
        setEditingProduct((prev: any) => ({ ...prev, imageUrl: base64 }))
      }
    }
    reader.readAsDataURL(file)
  }

  const duplicateWarning = useMemo(() => {
    if (!newProduct.name.trim()) return null;
    const currentName = newProduct.name.toLowerCase().trim();
    const match = products.find(p => p.name.toLowerCase().trim() === currentName);
    if (match) return language === 'bn' ? `'${match.name}' আছে!` : `Product exists!`;
    return null;
  }, [newProduct.name, products, language]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = filterCategory === "all" || p.category === filterCategory
      return matchesSearch && matchesCategory
    })
  }, [products, search, filterCategory])

  const handleAddProduct = () => {
    if (!newProduct.name.trim()) return;
    actions.addProduct({
      ...newProduct,
      stock: parseFloat(newProduct.stock) || 0,
      purchasePrice: parseFloat(newProduct.purchasePrice) || 0,
      sellingPrice: parseFloat(newProduct.sellingPrice) || 0,
      alertThreshold: parseFloat(newProduct.alertThreshold) || 5
    })
    setNewProduct({ name: "", category: "", purchasePrice: "", sellingPrice: "", stock: "", unit: "pcs", alertThreshold: "5", imageUrl: "" })
    setIsAddOpen(false)
    toast({ title: t.saveProduct })
  }

  const handleUpdateProduct = () => {
    if (!editingProduct) return;
    actions.updateProduct(editingProduct.id, {
      ...editingProduct,
      stock: parseFloat(editingProduct.stock) || 0,
      purchasePrice: parseFloat(editingProduct.purchasePrice) || 0,
      sellingPrice: parseFloat(editingProduct.sellingPrice) || 0,
      alertThreshold: parseFloat(editingProduct.alertThreshold) || 5
    });
    setEditingProduct(null);
    toast({ title: t.updateChanges });
  }

  const handleRestock = () => {
    if (!restockProduct || !restockQty || !restockPrice) return;
    actions.addRestock(
      restockProduct.id, 
      parseFloat(restockQty), 
      parseFloat(restockPrice), 
      parseFloat(restockSellPrice) || restockProduct.sellingPrice,
      restockNote
    );
    setRestockProduct(null);
    setRestockQty("");
    setRestockPrice("");
    setRestockSellPrice("");
    setRestockNote("");
    toast({ title: "Stock Updated Successfully" });
  }

  const startEditing = (p: any) => {
    setEditingProduct({
      ...p,
      purchasePrice: (p.purchasePrice || 0).toString(),
      sellingPrice: (p.sellingPrice || 0).toString(),
      stock: (p.stock || 0).toString(),
      alertThreshold: (p.alertThreshold || 5).toString()
    });
  }

  const startRestocking = (p: any) => {
    setRestockProduct(p);
    setRestockPrice((p.purchasePrice || 0).toString());
    setRestockSellPrice((p.sellingPrice || 0).toString());
    setRestockQty("");
    setRestockNote("");
  }

  const restockTotalCost = useMemo(() => {
    const qty = parseFloat(restockQty) || 0;
    const price = parseFloat(restockPrice) || 0;
    return (qty * price).toLocaleString();
  }, [restockQty, restockPrice]);

  if (isLoading) return <div className="p-10 text-center animate-pulse text-accent font-bold">{t.loading}</div>

  return (
    <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-10 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-headline text-primary flex items-center gap-2">
            <Package className="w-5 h-5 md:w-6 md:h-6 text-accent" /> {t.inventory}
          </h2>
          <p className="text-[10px] md:text-sm text-muted-foreground">{t.manageStock}</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 w-full sm:w-auto shadow-lg h-10 md:h-11 font-black uppercase text-[10px] md:text-xs">
              <Plus className="w-4 h-4 mr-2" /> {t.addProduct}
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-[2.5rem]">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-primary font-black uppercase tracking-tighter">{t.addProduct}</DialogTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsAddOpen(false)}><X className="w-4 h-4" /></Button>
              </div>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-32 h-32 rounded-2xl bg-muted flex items-center justify-center border-2 border-dashed overflow-hidden">
                  {newProduct.imageUrl ? (
                    <img src={newProduct.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-10 h-10 opacity-20" />
                  )}
                  <Label htmlFor="new-image" className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity text-white">
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-[8px] font-black uppercase">Upload</span>
                  </Label>
                  <input id="new-image" type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'new')} />
                </div>
                <Label className="text-[10px] font-black uppercase">{t.mainPhoto}</Label>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase">{language === 'en' ? 'Name' : 'নাম'}</Label>
                <Input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className={cn("h-11 rounded-xl", duplicateWarning && "border-amber-500")} />
                {duplicateWarning && <p className="text-[10px] font-bold text-amber-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {duplicateWarning}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase">{language === 'en' ? 'Category' : 'ক্যাটাগরি'}</Label>
                  <Input value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase">{t.unitType}</Label>
                  <Select value={newProduct.unit} onValueChange={(val) => setNewProduct({...newProduct, unit: val})}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{units.map(u => <SelectItem key={u} value={u}>{u.toUpperCase()}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase">{t.buyPrice}</Label>
                  <Input type="number" value={newProduct.purchasePrice} onChange={e => setNewProduct({...newProduct, purchasePrice: e.target.value})} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase">{t.sellPrice}</Label>
                  <Input type="number" value={newProduct.sellingPrice} onChange={e => setNewProduct({...newProduct, sellingPrice: e.target.value})} className="h-11 rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase">{t.stock}</Label>
                  <Input type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase">Min. Alert</Label>
                  <Input type="number" value={newProduct.alertThreshold} onChange={e => setNewProduct({...newProduct, alertThreshold: e.target.value})} className="h-11 rounded-xl" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button className="bg-accent w-full h-12 rounded-xl font-black uppercase" onClick={handleAddProduct} disabled={!newProduct.name.trim()}>
                {t.saveProduct}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-accent/10 overflow-hidden bg-white/50 backdrop-blur-sm mx-1">
        <CardHeader className="p-3 md:p-4 border-b flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t.searchInventory} className="pl-9 h-10 md:h-11 bg-white border-accent/10 rounded-xl text-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full md:w-[180px] bg-white h-10 md:h-11 rounded-xl text-xs"><SelectValue placeholder={t.allCategories} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allCategories}</SelectItem>
              {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div className="min-w-[850px]">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-[9px] md:text-[10px] uppercase font-black pl-4">{t.productNameCat}</TableHead>
                    <TableHead className="text-[9px] md:text-[10px] uppercase font-black">{t.pricing}</TableHead>
                    <TableHead className="text-[9px] md:text-[10px] uppercase font-black text-center">{t.stockLevel}</TableHead>
                    <TableHead className="text-right pr-4 font-black text-[9px] md:text-[10px] uppercase">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((p) => {
                    const threshold = p.alertThreshold || 5;
                    const isLowStock = p.stock <= threshold;
                    return (
                      <TableRow key={p.id} className="hover:bg-accent/5 transition-all group">
                        <TableCell className="p-3 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5 opacity-20" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-black text-primary leading-tight">{p.name}</p>
                              <p className="text-[8px] md:text-[9px] text-accent font-bold uppercase mt-0.5">{p.category || 'N/A'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-black text-primary leading-tight">{currency}{p.sellingPrice?.toLocaleString()}</p>
                          <p className="text-[9px] text-muted-foreground font-bold mt-0.5">Buy Price: {currency}{p.purchasePrice?.toLocaleString()}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter w-fit border", 
                              isLowStock ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-700 border-green-100"
                            )}>
                              {p.stock} {p.unit?.toUpperCase() || 'PCS'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-600 hover:text-white font-black text-[9px] uppercase px-3 gap-1.5 transition-all"
                              onClick={() => startRestocking(p)}
                            >
                              <PackagePlus className="w-3.5 h-3.5" /> RESTOCK
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg" onClick={() => startEditing(p)}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/5 rounded-lg" onClick={() => {
                              const pass = prompt("Enter 'specsxr' to delete:");
                              if (pass === 'specsxr') actions.deleteProduct(p.id);
                            }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Ads Section */}
      <div className="mt-6 px-1">
        <InventoryAd />
      </div>

      {/* Restock Dialog */}
      <Dialog open={!!restockProduct} onOpenChange={(open) => !open && setRestockProduct(null)}>
        <DialogContent className="w-[95vw] sm:max-w-[450px] rounded-[2.5rem] p-0 overflow-hidden border-teal-100 shadow-2xl">
          <DialogHeader className="p-6 bg-teal-50/50 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-600 rounded-xl shadow-lg shadow-teal-200">
                  <PackagePlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black text-primary tracking-tighter">Restock Item</DialogTitle>
                  <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest">{restockProduct?.name} | {restockProduct?.category || 'General'}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-teal-100" onClick={() => setRestockProduct(null)}><X className="w-4 h-4" /></Button>
            </div>
          </DialogHeader>
          
          <div className="p-6 space-y-5 bg-white max-h-[70vh] overflow-y-auto">
            <div className="bg-primary/5 p-4 rounded-2xl flex items-center justify-between border border-primary/10 shadow-inner">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary opacity-40" />
                <span className="text-[10px] font-black uppercase text-primary/60">Current Stock</span>
              </div>
              <Badge className="bg-primary text-white border-none font-black text-[10px] px-3 h-6">
                {restockProduct?.stock} {restockProduct?.unit?.toUpperCase()}
              </Badge>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" /> Quantity to Add
              </Label>
              <Input 
                type="number" 
                value={restockQty} 
                onChange={e => setRestockQty(e.target.value)} 
                className="h-14 text-2xl font-black bg-teal-50/20 border-teal-100 focus-visible:ring-teal-500 rounded-2xl transition-all" 
                placeholder="0.00" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="w-3 h-3" /> New Buy Price ({currency})
                </Label>
                <Input 
                  type="number" 
                  value={restockPrice} 
                  onChange={e => setRestockPrice(e.target.value)} 
                  className="h-12 text-lg font-black border-accent/10 rounded-xl bg-accent/5" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-emerald-600" /> New Sell Price ({currency})
                </Label>
                <Input 
                  type="number" 
                  value={restockSellPrice} 
                  onChange={e => setRestockSellPrice(e.target.value)} 
                  className="h-12 text-lg font-black border-emerald-100 rounded-xl bg-emerald-50/30" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> Remark / Note (Optional)
              </Label>
              <Input 
                value={restockNote} 
                onChange={e => setRestockNote(e.target.value)} 
                className="h-12 rounded-xl border-black/5" 
                placeholder="e.g. Bought from new supplier" 
              />
            </div>

            <div className="bg-teal-600 p-5 rounded-2xl text-center shadow-xl shadow-teal-100 border-2 border-white/20">
              <p className="text-[9px] font-black uppercase text-white/70 tracking-[0.2em] mb-1">Total Entry Cost</p>
              <p className="text-4xl font-black text-white">{currency}{restockTotalCost}</p>
            </div>
          </div>

          <DialogFooter className="p-6 bg-muted/20 border-t">
            <Button 
              className="w-full bg-teal-600 hover:bg-teal-700 h-16 rounded-2xl font-black uppercase shadow-2xl transition-all active:scale-95 text-lg" 
              onClick={handleRestock} 
              disabled={!restockQty || !restockPrice}
            >
              Confirm Restock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-[2rem]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-primary font-black uppercase tracking-tighter">Edit Product Details</DialogTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setEditingProduct(null)}><X className="w-4 h-4" /></Button>
            </div>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-32 h-32 rounded-2xl bg-muted flex items-center justify-center border-2 border-dashed overflow-hidden">
                {editingProduct?.imageUrl ? (
                  <img src={editingProduct.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-10 h-10 opacity-20" />
                )}
                <Label htmlFor="edit-image" className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity text-white">
                  <Upload className="w-6 h-6 mb-1" />
                  <span className="text-[8px] font-black uppercase">Change Photo</span>
                </Label>
                <input id="edit-image" type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'edit')} />
              </div>
              <Button variant="ghost" size="sm" className="h-6 text-[8px] font-black uppercase text-destructive" onClick={() => setEditingProduct({...editingProduct, imageUrl: ""})}>
                <Trash2 className="w-3 h-3 mr-1" /> Remove
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase">Product Name</Label>
              <Input value={editingProduct?.name || ""} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="h-11 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase">Category</Label>
                <Input value={editingProduct?.category || ""} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase">Unit Type</Label>
                <Select value={editingProduct?.unit || "pcs"} onValueChange={(val) => setEditingProduct({...editingProduct, unit: val})}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{units.map(u => <SelectItem key={u} value={u}>{u.toUpperCase()}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase">Purchase Price</Label>
                <Input type="number" value={editingProduct?.purchasePrice || ""} onChange={e => setEditingProduct({...editingProduct, purchasePrice: e.target.value})} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase">Selling Price</Label>
                <Input type="number" value={editingProduct?.sellingPrice || ""} onChange={e => setEditingProduct({...editingProduct, sellingPrice: e.target.value})} className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase">Current Stock</Label>
                <Input type="number" value={editingProduct?.stock || ""} onChange={e => setEditingProduct({...editingProduct, stock: e.target.value})} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase">Low Stock Alert</Label>
                <Input type="number" value={editingProduct?.alertThreshold || "5"} onChange={e => setEditingProduct({...editingProduct, alertThreshold: e.target.value})} className="h-11 rounded-xl" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full bg-primary h-14 rounded-2xl font-black uppercase shadow-xl" onClick={handleUpdateProduct}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
