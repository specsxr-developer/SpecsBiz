
"use client"

import { useState } from "react"
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  MoreVertical, 
  Edit, 
  Trash,
  ScanBarcode,
  Inbox,
  Scale
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

export default function InventoryPage() {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
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

  // Sample units
  const units = ["pcs", "kg", "gm", "ltr", "meter", "box", "dozen"]

  const [products, setProducts] = useState<any[]>([])

  const handleAIDescription = async () => {
    if (!newProduct.name || !newProduct.category) {
      toast({
        title: "Missing Info",
        description: "Please enter a product name and category first.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateProductDescription({
        productName: newProduct.name,
        productCategory: newProduct.category,
        keyFeatures: newProduct.features,
        targetAudience: "General Business Professionals"
      })
      setNewProduct(prev => ({ ...prev, description: result.description }))
      toast({ title: "AI Perfected!", description: "Product description generated successfully." })
    } catch (error) {
      toast({ title: "AI Error", description: "Failed to generate description.", variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddProduct = () => {
    const p = {
      id: Date.now(),
      name: newProduct.name,
      category: newProduct.category,
      stock: parseFloat(newProduct.stock) || 0,
      purchasePrice: parseFloat(newProduct.purchasePrice) || 0,
      sellingPrice: parseFloat(newProduct.sellingPrice) || 0,
      unit: newProduct.unit,
      sku: `SKU-${Math.floor(Math.random() * 1000)}`
    }
    setProducts([p, ...products])
    setNewProduct({ name: "", category: "", features: "", description: "", purchasePrice: "", sellingPrice: "", stock: "", unit: "pcs" })
    toast({ title: "Product Added", description: `${p.name} has been added to inventory.` })
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
            <Package className="w-6 h-6 text-accent" /> Inventory
          </h2>
          <p className="text-muted-foreground">Manage your stock, units, and profit margins.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-accent text-accent">
            <ScanBarcode className="w-4 h-4 mr-2" /> Scan Barcode
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90">
                <Plus className="w-4 h-4 mr-2" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <CardDescription>Enter product details and set units for fractional sales.</CardDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right text-xs">Name</Label>
                  <Input 
                    id="name" 
                    className="col-span-3" 
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right text-xs">Category</Label>
                  <Input 
                    id="category" 
                    className="col-span-3" 
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unit" className="text-right text-xs">Unit Type</Label>
                  <Select 
                    value={newProduct.unit} 
                    onValueChange={(val) => setNewProduct({...newProduct, unit: val})}
                  >
                    <SelectTrigger className="col-span-3">
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
                  <div className="grid grid-cols-2 items-center gap-2">
                    <Label htmlFor="purchase" className="text-right text-xs">Buy Price</Label>
                    <Input 
                      id="purchase" 
                      type="number" 
                      step="0.01"
                      value={newProduct.purchasePrice}
                      onChange={e => setNewProduct({...newProduct, purchasePrice: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 items-center gap-2">
                    <Label htmlFor="sell" className="text-right text-xs">Sell Price</Label>
                    <Input 
                      id="sell" 
                      type="number" 
                      step="0.01"
                      value={newProduct.sellingPrice}
                      onChange={e => setNewProduct({...newProduct, sellingPrice: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock" className="text-right text-xs">Initial Stock</Label>
                  <Input 
                    id="stock" 
                    type="number" 
                    step="0.01"
                    className="col-span-3"
                    value={newProduct.stock}
                    onChange={e => setNewProduct({...newProduct, stock: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right mt-2 text-xs">Description</Label>
                  <div className="col-span-3 space-y-2">
                    <Textarea 
                      id="description" 
                      className="min-h-[80px]" 
                      value={newProduct.description}
                      onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                    />
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="w-full gap-2 text-xs" 
                      onClick={handleAIDescription}
                      disabled={isGenerating}
                    >
                      <Sparkles className="w-3.5 h-3.5" /> 
                      {isGenerating ? "Perfecting..." : "Generate AI Description"}
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-accent" onClick={handleAddProduct}>Save Product</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search inventory..." className="pl-9" />
            </div>
            <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
              <div className="p-4 rounded-full bg-muted">
                <Package className="w-10 h-10 opacity-20" />
              </div>
              <div className="text-center">
                <p className="font-semibold">No products found</p>
                <p className="text-sm">Start by adding your first product with units.</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Buy Price</TableHead>
                  <TableHead>Sell Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <div>
                        {p.name}
                        <div className="text-[10px] text-accent uppercase font-bold">{p.unit}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{p.sku}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">${p.purchasePrice.toFixed(2)}</TableCell>
                    <TableCell className="font-bold text-primary">${p.sellingPrice.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className={p.stock < 5 ? "text-red-500 font-bold" : ""}>
                          {p.stock}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase">{p.unit}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2"><Edit className="w-4 h-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive"><Trash className="w-4 h-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
