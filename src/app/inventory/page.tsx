
"use client"

import { useState, useMemo, useEffect } from "react"
import { 
  Package, 
  Plus, 
  Search, 
  Sparkles, 
  MoreVertical, 
  Trash,
  Inbox,
  Edit2,
  Printer,
  Filter,
  Download,
  Calendar,
  Settings2,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  PackagePlus,
  Lock,
  X,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
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
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { generateProductDescription } from "@/ai/flows/generate-product-description"
import { useToast } from "@/hooks/use-toast"
import { useBusinessData } from "@/hooks/use-business-data"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"

export default function InventoryPage() {
  const { toast } = useToast()
  const { products, actions, isLoading, currency, language } = useBusinessData()
  const t = translations[language]
  
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [isAddOpen, setIsAddOpen] = useState(false)
  
  // Edit State
  const [editingProduct, setEditingProduct] = useState<any>(null)
  
  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deletePass, setDeletePass] = useState("")

  // Restock State
  const [restockProduct, setRestockProduct] = useState<any>(null)
  const [restockQty, setRestockQty] = useState("")
  const [restockPrice, setRestockPrice] = useState("")

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
    unit: "pcs"
  })

  // --- REAL-TIME DUPLICATE WARNING ---
  const duplicateWarning = useMemo(() => {
    if (!newProduct.name.trim()) return null;
    const currentName = newProduct.name.toLowerCase().trim();
    const match = products.find(p => {
      const pName = p.name.toLowerCase().trim();
      return pName === currentName || pName.includes(currentName) || currentName.includes(pName);
    });
    if (match) {
      return language === 'bn' 
        ? `'${match.name}' নামে মিল পাওয়া গেছে! একই পণ্য দুবার যোগ করবেন না।` 
        : `A similar product '${match.name}' already exists!`;
    }
    return null;
  }, [newProduct.name, products, language]);

  const editDuplicateWarning = useMemo(() => {
    if (!editingProduct?.name?.trim()) return null;
    const currentName = editingProduct.name.toLowerCase().trim();
    const match = products.find(p => {
      if (p.id === editingProduct.id) return false;
      const pName = p.name.toLowerCase().trim();
      return pName === currentName || pName.includes(currentName) || currentName.includes(pName);
    });
    if (match) {
      return language === 'bn' 
        ? `'${match.name}' নামে মিল পাওয়া গেছে!` 
        : `A similar product '${match.name}' already exists!`;
    }
    return null;
  }, [editingProduct?.name, products, language, editingProduct?.id]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = filterCategory === "all" || p.category === filterCategory
      return matchesSearch && matchesCategory
    })
  }, [products, search, filterCategory])

  const validateProduct = (prod: any, isUpdate = false, originalId?: string) => {
    const name = prod.name.trim();
    const buyPrice = parseFloat(prod.purchasePrice) || 0;
    const sellPrice = parseFloat(prod.sellingPrice) || 0;
    const stock = parseFloat(prod.stock) || 0;

    if (!name) {
      toast({ variant: "destructive", title: language === 'bn' ? "নাম দিন!" : "Name required!" });
      return false;
    }

    // Strict Duplicate Check
    const normalizedName = name.toLowerCase().trim();
    const isDuplicate = products.some(p => {
      const pName = p.name.toLowerCase().trim();
      const match = pName === normalizedName || pName.includes(normalizedName) || normalizedName.includes(pName);
      return isUpdate ? (match && p.id !== originalId) : match;
    });

    if (isDuplicate) {
      toast({
        variant: "destructive",
        title: language === 'bn' ? "ডুপ্লিকেট পণ্য!" : "Duplicate Product!",
        description: language === 'bn' 
          ? `'${name}' নামে মিল পাওয়া গেছে। অনুগ্রহ করে আলাদা নাম দিন।` 
          : `'${name}' is too similar to an existing product.`,
      });
      return false;
    }

    if (sellPrice > 0 && sellPrice < buyPrice) {
      toast({
        variant: "destructive",
        title: language === 'bn' ? "সাবধান: লোকসান হচ্ছে!" : "Warning: Potential Loss!",
        description: language === 'bn' ? "বিক্রয় মূল্য কেনা দামের চেয়ে কম!" : "Selling price is lower than purchase price.",
      });
      return false;
    }

    return true;
  }

  const handleAddProduct = () => {
    if (!validateProduct(newProduct)) return;

    actions.addProduct({
      ...newProduct,
      stock: parseFloat(newProduct.stock) || 0,
      purchasePrice: parseFloat(newProduct.purchasePrice) || 0,
      sellingPrice: parseFloat(newProduct.sellingPrice) || 0,
    })
    setNewProduct({ name: "", category: "", purchasePrice: "", sellingPrice: "", stock: "", unit: "pcs" })
    setIsAddOpen(false)
    toast({ title: language === 'en' ? "Product Added Successfully" : "পণ্য সফলভাবে যোগ করা হয়েছে" })
  }

  const handleUpdateProduct = () => {
    if (!editingProduct) return;
    if (!validateProduct(editingProduct, true, editingProduct.id)) return;

    actions.updateProduct(editingProduct.id, {
      ...editingProduct,
      stock: parseFloat(editingProduct.stock) || 0,
      purchasePrice: parseFloat(editingProduct.purchasePrice) || 0,
      sellingPrice: parseFloat(editingProduct.sellingPrice) || 0,
    });
    setEditingProduct(null);
    toast({ title: language === 'en' ? "Product Updated" : "পণ্যের তথ্য আপডেট করা হয়েছে" });
  }

  const handleAuthorizedDelete = () => {
    if (deletePass === "specsxr") {
      if (deleteId) {
        actions.deleteProduct(deleteId);
        toast({ title: "Product Permanently Removed" });
      }
      setDeleteId(null);
      setDeletePass("");
    } else {
      toast({ variant: "destructive", title: "Access Denied", description: "Wrong secret password." });
      setDeletePass("");
    }
  }

  const handleRestock = () => {
    if (!restockProduct || !restockQty) return;
    const qtyNum = parseFloat(restockQty);
    const priceNum = parseFloat(restockPrice) || restockProduct.purchasePrice;

    if (qtyNum <= 0) {
      toast({ variant: "destructive", title: "Invalid quantity" });
      return;
    }

    actions.addRestock(restockProduct.id, qtyNum, priceNum);
    setRestockProduct(null);
    setRestockQty("");
    setRestockPrice("");
    toast({ title: "Stock Updated & Recorded" });
  }

  const startEditing = (p: any) => {
    setEditingProduct({
      ...p,
      purchasePrice: p.purchasePrice.toString(),
      sellingPrice: p.sellingPrice.toString(),
      stock: p.stock.toString()
    });
  }

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
          <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-primary font-black uppercase tracking-tighter">{t.addProduct}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase">{language === 'en' ? 'Name' : 'নাম'}</Label>
                <Input 
                  value={newProduct.name} 
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
                  className={cn("h-11 rounded-xl", duplicateWarning && "border-red-500 focus-visible:ring-red-500")}
                  placeholder={language === 'bn' ? "পণ্যের নাম লিখুন..." : "Enter product name..."}
                />
                {duplicateWarning && (
                  <p className="text-[10px] font-bold text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" /> {duplicateWarning}
                  </p>
                )}
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
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase">{t.stock} ({newProduct.unit})</Label>
                <Input type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="h-11 rounded-xl" />
              </div>
            </div>
            <DialogFooter>
              <Button 
                className="bg-accent w-full h-12 rounded-xl font-black uppercase" 
                onClick={handleAddProduct}
                disabled={!!duplicateWarning || !newProduct.name.trim()}
              >
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
            <div className="min-w-[700px]">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-[9px] md:text-[10px] uppercase font-black pl-4">{t.productNameCat}</TableHead>
                    <TableHead className="text-[9px] md:text-[10px] uppercase font-black">{t.pricing}</TableHead>
                    <TableHead className="text-[9px] md:text-[10px] uppercase font-black">{t.stockLevel}</TableHead>
                    <TableHead className="text-right pr-4 font-black text-[9px] md:text-[10px] uppercase">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((p) => (
                    <TableRow key={p.id} className="hover:bg-accent/5 transition-all group">
                      <TableCell className="p-3 pl-4">
                        <p className="text-xs font-black text-primary leading-tight">{p.name}</p>
                        <p className="text-[8px] md:text-[9px] text-accent uppercase font-bold mt-0.5">{p.category || 'N/A'}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-[10px] font-black text-primary">{currency}{p.sellingPrice}</p>
                        <p className="text-[8px] text-muted-foreground font-bold">{t.buyPrice}: {currency}{p.purchasePrice}</p>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter", 
                          p.stock < 5 ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"
                        )}>
                          {p.stock} {p.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="outline" size="sm" className="h-8 text-[9px] font-black uppercase border-accent text-accent hover:bg-accent hover:text-white rounded-lg transition-all active:scale-95" onClick={() => {
                            setRestockProduct(p);
                            setRestockPrice(p.purchasePrice.toString());
                          }}>
                            <PackagePlus className="w-3.5 h-3.5 mr-1" /> {t.restock}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg" onClick={() => startEditing(p)}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/5 rounded-lg" onClick={() => setDeleteId(p.id)}>
                            <Trash className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-primary font-black uppercase tracking-tighter">Edit Product Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase">Product Name</Label>
              <Input 
                value={editingProduct?.name || ""} 
                onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} 
                className={cn("h-11 rounded-xl", editDuplicateWarning && "border-red-500 focus-visible:ring-red-500")} 
              />
              {editDuplicateWarning && (
                <p className="text-[10px] font-bold text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {editDuplicateWarning}
                </p>
              )}
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
                <Label className="text-[10px] font-black uppercase">Purchase Price ({currency})</Label>
                <Input type="number" value={editingProduct?.purchasePrice || ""} onChange={e => setEditingProduct({...editingProduct, purchasePrice: e.target.value})} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase">Selling Price ({currency})</Label>
                <Input type="number" value={editingProduct?.sellingPrice || ""} onChange={e => setEditingProduct({...editingProduct, sellingPrice: e.target.value})} className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase">Manual Stock Adjust ({editingProduct?.unit})</Label>
              <Input type="number" value={editingProduct?.stock || ""} onChange={e => setEditingProduct({...editingProduct, stock: e.target.value})} className="h-11 rounded-xl border-orange-200 focus:ring-orange-500" />
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="w-full bg-primary h-14 rounded-2xl font-black uppercase shadow-xl" 
              onClick={handleUpdateProduct}
              disabled={!!editDuplicateWarning || !editingProduct?.name?.trim()}
            >
              Save All Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Authorized Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-black uppercase">
              <Lock className="w-5 h-5" /> Permanent Deletion
            </DialogTitle>
            <DialogDescription>
              Enter secret key 'specsxr' to confirm deletion.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label className="text-xs font-bold uppercase opacity-70">Secret Access Key</Label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              className="h-12 text-lg font-bold rounded-xl"
              value={deletePass}
              onChange={e => setDeletePass(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="destructive" className="w-full h-12 text-base font-black uppercase rounded-xl shadow-lg" onClick={handleAuthorizedDelete}>
              Authorize & Wipe Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restock Dialog */}
      <Dialog open={!!restockProduct} onOpenChange={(open) => !open && setRestockProduct(null)}>
        <DialogContent className="w-[95vw] sm:max-w-[400px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary font-black uppercase tracking-tighter">
              <PackagePlus className="w-5 h-5 text-accent" /> {t.newStockEntry}
            </DialogTitle>
            <DialogDescription className="font-black text-accent text-xs">{restockProduct?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase opacity-60 tracking-widest">{t.buyQty} ({restockProduct?.unit})</Label>
              <Input type="number" value={restockQty} onChange={e => setRestockQty(e.target.value)} placeholder="0.00" className="h-12 text-lg font-black rounded-xl border-accent/20 focus:ring-accent" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase opacity-60 tracking-widest">{t.buyPrice} ({currency})</Label>
              <Input type="number" value={restockPrice} onChange={e => setRestockPrice(e.target.value)} className="h-12 text-lg font-black text-accent rounded-xl border-accent/20 focus:ring-accent" />
            </div>
            <div className="bg-accent/5 p-4 rounded-2xl border border-accent/10 text-center shadow-inner">
              <p className="text-[8px] font-black uppercase opacity-50 tracking-widest">{t.totalCostSpent}</p>
              <p className="text-2xl font-black text-primary">{currency}{((parseFloat(restockQty) || 0) * (parseFloat(restockPrice) || 0)).toLocaleString()}</p>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full bg-accent hover:bg-accent/90 h-14 text-base font-black uppercase rounded-2xl shadow-xl transition-all active:scale-95" onClick={handleRestock} disabled={!restockQty}>
              Confirm Restock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
