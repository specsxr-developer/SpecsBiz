
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
    price: "",
    stock: ""
  })

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
      stock: parseInt(newProduct.stock) || 0,
      price: `$${newProduct.price}`,
      sku: `SKU-${Math.floor(Math.random() * 1000)}`
    }
    setProducts([p, ...products])
    setNewProduct({ name: "", category: "", features: "", description: "", price: "", stock: "" })
    toast({ title: "Product Added", description: `${p.name} has been added to inventory.` })
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
            <Package className="w-6 h-6 text-accent" /> Inventory
          </h2>
          <p className="text-muted-foreground">Manage your stock and products with ease.</p>
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
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <CardDescription>Fill in the details below. Use AI to perfect your description.</CardDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input 
                    id="name" 
                    className="col-span-3" 
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">Category</Label>
                  <Input 
                    id="category" 
                    className="col-span-3" 
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="features" className="text-right">Features</Label>
                  <Input 
                    id="features" 
                    placeholder="Lightweight, UV400, Polarized" 
                    className="col-span-3" 
                    value={newProduct.features}
                    onChange={e => setNewProduct({...newProduct, features: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right mt-2">Description</Label>
                  <div className="col-span-3 space-y-2">
                    <Textarea 
                      id="description" 
                      className="min-h-[100px]" 
                      value={newProduct.description}
                      onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                    />
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="w-full gap-2" 
                      onClick={handleAIDescription}
                      disabled={isGenerating}
                    >
                      <Sparkles className="w-3.5 h-3.5" /> 
                      {isGenerating ? "Perfecting..." : "AI Perfect Data"}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid grid-cols-2 items-center gap-4">
                    <Label htmlFor="price" className="text-right">Price</Label>
                    <Input 
                      id="price" 
                      type="number" 
                      value={newProduct.price}
                      onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 items-center gap-4">
                    <Label htmlFor="stock" className="text-right">Stock</Label>
                    <Input 
                      id="stock" 
                      type="number" 
                      value={newProduct.stock}
                      onChange={e => setNewProduct({...newProduct, stock: e.target.value})}
                    />
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
                <p className="text-sm">Start by adding your first product to the inventory.</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{p.sku}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell>
                      <span className={p.stock < 10 ? "text-red-500 font-bold" : ""}>
                        {p.stock}
                      </span>
                    </TableCell>
                    <TableCell>{p.price}</TableCell>
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
