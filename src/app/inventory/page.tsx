
"use client"

import { useState, useMemo, useEffect, useRef } from "react"
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
  AlertCircle,
  BellRing,
  Image as ImageIcon,
  Upload
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

  // --- REAL-TIME DUPLICATE WARNING ---
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

  const startEditing = (p: any) => {
    setEditingProduct({
      ...p,
      purchasePrice: p.purchasePrice.toString(),
      sellingPrice: p.sellingPrice.toString(),
      stock: p.stock.toString(),
      alertThreshold: (p.alertThreshold || 5).toString()
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
                              <p className="text-[8px] md:text-[9px] text-accent uppercase font-bold mt-0.5">{p.category || 'N/A'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-[10px] font-black text-primary">{currency}{p.sellingPrice}</p>
                          <p className="text-[8px] text-muted-foreground font-bold">{t.buyPrice}: {currency}{p.purchasePrice}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter w-fit", 
                              isLowStock ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"
                            )}>
                              {p.stock} {p.unit}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg" onClick={() => startEditing(p)}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/5 rounded-lg" onClick={() => {
                              const pass = prompt("Enter 'specsxr' to delete:");
                              if (pass === 'specsxr') actions.deleteProduct(p.id);
                            }}>
                              <Trash className="w-3.5 h-3.5" />
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
                <Trash className="w-3 h-3 mr-1" /> Remove
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
