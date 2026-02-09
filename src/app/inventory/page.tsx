"use client"

import { useState } from "react"
import { 
  Package, 
  Plus, 
  Search, 
  Sparkles, 
  MoreVertical, 
  Trash,
  Inbox,
  Edit2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  DialogFooter
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
import { generateProductDescription } from "@/ai/flows/generate-product-description"
import { useToast } from "@/hooks/use-toast"
import { useBusinessData } from "@/hooks/use-business-data"

export default function InventoryPage() {
  const { toast } = useToast()
  const { products, actions, isLoading, currency } = useBusinessData()
  const [isGenerating, setIsGenerating] = useState(false)
  const [search, setSearch] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)

  const units = ["pcs", "kg", "gm", "ltr", "meter", "box", "dozen"]

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    features: "",
    description: "",
    purchasePrice: "",
    sellingPrice: "",
    stock: "",
    unit: "pcs"
  })

  const handleAIDescription = async (isEdit = false) => {
    const target = isEdit ? editingProduct : newProduct;
    if (!target.name || !target.category) {
      toast({ title: "Missing Info", description: "Enter name and category first.", variant: "destructive" })
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateProductDescription({
        productName: target.name,
        productCategory: target.category,
        keyFeatures: target.features || "",
        targetAudience: "General Customers"
      })
      if (isEdit) {
        setEditingProduct({ ...editingProduct, description: result.description })
      } else {
        setNewProduct(prev => ({ ...prev, description: result.description }))
      }
      toast({ title: "AI Description Ready" })
    } catch (error) {
      toast({ title: "AI Error", variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.sellingPrice) return;
    actions.addProduct({
      name: newProduct.name,
      category: newProduct.category,
      stock: parseFloat(newProduct.stock) || 0,
      purchasePrice: parseFloat(newProduct.purchasePrice) || 0,
      sellingPrice: parseFloat(newProduct.sellingPrice) || 0,
      unit: newProduct.unit,
      description: newProduct.description,
      sku: `SKU-${Math.floor(Math.random() * 1000)}`
    })
    setNewProduct({ name: "", category: "", features: "", description: "", purchasePrice: "", sellingPrice: "", stock: "", unit: "pcs" })
    setIsAddOpen(false)
    toast({ title: "Product Added" })
  }

  const handleUpdateProduct = () => {
    if (!editingProduct.name || !editingProduct.sellingPrice) return;
    actions.updateProduct(editingProduct.id, {
      ...editingProduct,
      stock: parseFloat(editingProduct.stock) || 0,
      purchasePrice: parseFloat(editingProduct.purchasePrice) || 0,
      sellingPrice: parseFloat(editingProduct.sellingPrice) || 0,
    })
    setEditingProduct(null)
    toast({ title: "Product Updated" })
  }

  const openEditDialog = (product: any) => {
    // Break execution context to ensure dropdown closes and pointer-events are restored
    setTimeout(() => {
      setEditingProduct(product)
    }, 10)
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-headline text-primary flex items-center gap-2">
            <Package className="w-5 h-5 md:w-6 md:h-6 text-accent" /> Inventory
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">Manage your stock and profit margins.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <CardDescription>Enter product details for stock management.</CardDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="name" className="sm:text-right text-xs">Name</Label>
                <Input className="sm:col-span-3 h-9" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label className="sm:text-right text-xs">Category</Label>
                <Input className="sm:col-span-3 h-9" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label className="sm:text-right text-xs">Unit Type</Label>
                <Select value={newProduct.unit} onValueChange={(val) => setNewProduct({...newProduct, unit: val})}>
                  <SelectTrigger className="sm:col-span-3 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(u => (
                      <SelectItem key={u} value={u}>{u.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase opacity-70">Buy Price (per {newProduct.unit})</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">{currency}</span>
                    <Input type="number" step="0.01" className="pl-8" value={newProduct.purchasePrice} onChange={e => setNewProduct({...newProduct, purchasePrice: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase opacity-70">Sell Price (per {newProduct.unit})</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">{currency}</span>
                    <Input type="number" step="0.01" className="pl-8" value={newProduct.sellingPrice} onChange={e => setNewProduct({...newProduct, sellingPrice: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label className="sm:text-right text-xs">Stock ({newProduct.unit})</Label>
                <Input type="number" step="0.01" className="sm:col-span-3 h-9" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-4">
                <Label className="sm:text-right mt-2 text-xs">Description</Label>
                <div className="sm:col-span-3 space-y-2">
                  <Textarea className="min-h-[60px] text-xs" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
                  <Button size="sm" variant="secondary" className="w-full gap-2 text-[10px]" onClick={() => handleAIDescription(false)} disabled={isGenerating}>
                    <Sparkles className="w-3.5 h-3.5" /> {isGenerating ? "Analyzing..." : "AI Generate Description"}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button className="bg-accent w-full" onClick={handleAddProduct}>Save Product</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search inventory..." 
              className="pl-9 h-9 text-sm" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-10 text-xs">Loading...</div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2 text-center">
              <Inbox className="w-8 h-8 opacity-20" />
              <p className="text-xs italic">No products found.</p>
            </div>
          ) : (
            <div className="min-w-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Product</TableHead>
                    <TableHead className="text-xs">Buy Price</TableHead>
                    <TableHead className="text-xs">Sell Price</TableHead>
                    <TableHead className="text-xs">Stock</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products
                    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
                    .map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium p-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{p.name}</p>
                          <div className="text-[9px] text-accent uppercase font-bold">{p.category || 'No Category'} • {p.unit}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">{currency}{p.purchasePrice?.toFixed(2)} / {p.unit}</TableCell>
                      <TableCell className="font-bold text-primary text-[10px] md:text-xs">{currency}{p.sellingPrice?.toFixed(2)} / {p.unit}</TableCell>
                      <TableCell className="text-[10px] md:text-xs">
                        <span className={p.stock < 5 ? "text-red-500 font-bold" : ""}>{p.stock} {p.unit}</span>
                      </TableCell>
                      <TableCell className="p-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-3.5 h-3.5" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2 text-xs" onClick={() => openEditDialog(p)}>
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive text-xs" onClick={() => actions.deleteProduct(p.id)}>
                              <Trash className="w-3.5 h-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label className="sm:text-right text-xs">Name</Label>
                <Input className="sm:col-span-3 h-9" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label className="sm:text-right text-xs">Category</Label>
                <Input className="sm:col-span-3 h-9" value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label className="sm:text-right text-xs">Unit Type</Label>
                <Select value={editingProduct.unit} onValueChange={(val) => setEditingProduct({...editingProduct, unit: val})}>
                  <SelectTrigger className="sm:col-span-3 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(u => (
                      <SelectItem key={u} value={u}>{u.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase opacity-70">Buy Price (per {editingProduct.unit})</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">{currency}</span>
                    <Input type="number" step="0.01" className="pl-8" value={editingProduct.purchasePrice} onChange={e => setEditingProduct({...editingProduct, purchasePrice: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase opacity-70">Sell Price (per {editingProduct.unit})</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">{currency}</span>
                    <Input type="number" step="0.01" className="pl-8" value={editingProduct.sellingPrice} onChange={e => setEditingProduct({...editingProduct, sellingPrice: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label className="sm:text-right text-xs">Stock ({editingProduct.unit})</Label>
                <Input type="number" step="0.01" className="sm:col-span-3 h-9" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-4">
                <Label className="sm:text-right mt-2 text-xs">Description</Label>
                <div className="sm:col-span-3 space-y-2">
                  <Textarea className="min-h-[60px] text-xs" value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                  <Button size="sm" variant="secondary" className="w-full gap-2 text-[10px]" onClick={() => handleAIDescription(true)} disabled={isGenerating}>
                    <Sparkles className="w-3.5 h-3.5" /> {isGenerating ? "Analyzing..." : "AI Generate Description"}
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="bg-accent w-full" onClick={handleUpdateProduct}>Update Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
