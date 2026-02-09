
"use client"

import { useState } from "react"
import { 
  Package, 
  Plus, 
  Search, 
  Sparkles, 
  MoreVertical, 
  Trash,
  Inbox
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
  const { products, actions, isLoading } = useBusinessData()
  const [isGenerating, setIsGenerating] = useState(false)
  const [search, setSearch] = useState("")
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

  const units = ["pcs", "kg", "gm", "ltr", "meter", "box", "dozen"]

  const handleAIDescription = async () => {
    if (!newProduct.name || !newProduct.category) {
      toast({ title: "Missing Info", description: "Enter name and category first.", variant: "destructive" })
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateProductDescription({
        productName: newProduct.name,
        productCategory: newProduct.category,
        keyFeatures: newProduct.features,
        targetAudience: "General Customers"
      })
      setNewProduct(prev => ({ ...prev, description: result.description }))
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
      sku: `SKU-${Math.floor(Math.random() * 1000)}`
    })
    
    setNewProduct({ name: "", category: "", features: "", description: "", purchasePrice: "", sellingPrice: "", stock: "", unit: "pcs" })
    toast({ title: "Product Added" })
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
        
        <Dialog>
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
                <Input id="name" className="sm:col-span-3 h-9" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="category" className="sm:text-right text-xs">Category</Label>
                <Input id="category" className="sm:col-span-3 h-9" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="unit" className="sm:text-right text-xs">Unit Type</Label>
                <Select value={newProduct.unit} onValueChange={(val) => setNewProduct({...newProduct, unit: val})}>
                  <SelectTrigger className="sm:col-span-3 h-9">
                    <SelectValue placeholder="Select Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(u => (
                      <SelectItem key={u} value={u}>{u.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-1 gap-1.5">
                  <Label className="text-xs">Buy Price</Label>
                  <Input type="number" step="0.01" className="h-9" value={newProduct.purchasePrice} onChange={e => setNewProduct({...newProduct, purchasePrice: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  <Label className="text-xs">Sell Price</Label>
                  <Input type="number" step="0.01" className="h-9" value={newProduct.sellingPrice} onChange={e => setNewProduct({...newProduct, sellingPrice: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="stock" className="sm:text-right text-xs">Stock</Label>
                <Input id="stock" type="number" step="0.01" className="sm:col-span-3 h-9" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
                <Label className="sm:text-right mt-2 text-xs">Description</Label>
                <div className="sm:col-span-3 space-y-2">
                  <Textarea className="min-h-[60px] text-xs" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
                  <Button size="sm" variant="secondary" className="w-full gap-2 text-[10px]" onClick={handleAIDescription} disabled={isGenerating}>
                    <Sparkles className="w-3.5 h-3.5" /> {isGenerating ? "Analyzing..." : "AI Generate Description"}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-accent w-full" onClick={handleAddProduct}>Save Product</Button>
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
                    <TableHead className="text-[10px] md:text-xs">Product</TableHead>
                    <TableHead className="text-[10px] md:text-xs">Buy</TableHead>
                    <TableHead className="text-[10px] md:text-xs">Sell</TableHead>
                    <TableHead className="text-[10px] md:text-xs">Stock</TableHead>
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
                          <p className="text-xs truncate">{p.name}</p>
                          <div className="text-[9px] text-accent uppercase font-bold">{p.unit}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">${p.purchasePrice?.toFixed(2)}</TableCell>
                      <TableCell className="font-bold text-primary text-[10px] md:text-xs">${p.sellingPrice?.toFixed(2)}</TableCell>
                      <TableCell className="text-[10px] md:text-xs">
                        <span className={p.stock < 5 ? "text-red-500 font-bold" : ""}>{p.stock}</span>
                      </TableCell>
                      <TableCell className="p-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-3.5 h-3.5" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
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
    </div>
  )
}
