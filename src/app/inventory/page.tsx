
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
  Check
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
import { generateProductDescription } from "@/ai/flows/generate-product-description"
import { useToast } from "@/hooks/use-toast"
import { useBusinessData } from "@/hooks/use-business-data"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { cn } from "@/lib/utils"

export default function InventoryPage() {
  const { toast } = useToast()
  const { products, sales, actions, isLoading, currency } = useBusinessData()
  const [isGenerating, setIsGenerating] = useState(false)
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [reportDate, setReportDate] = useState("")

  // Print Settings State
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)
  const [printFilters, setPrintFilters] = useState({
    category: "all",
    stockStatus: "all", // all, low, out, healthy
    performance: "all", // all, mostSold, leastSold
  })
  const [printColumns, setPrintColumns] = useState({
    name: true,
    category: true,
    buyPrice: true,
    sellPrice: true,
    stock: true,
    salesCount: true
  })

  // Hydration fix for date
  useEffect(() => {
    setReportDate(new Date().toLocaleString())
  }, [])

  const units = ["pcs", "kg", "gm", "ltr", "meter", "box", "dozen"]

  // Calculate total units sold for each product
  const productSalesStats = useMemo(() => {
    const stats: Record<string, number> = {}
    sales.forEach(s => {
      if (!s.isBakiPayment && s.items) {
        s.items.forEach((item: any) => {
          stats[item.id] = (stats[item.id] || 0) + (item.quantity || 0)
        })
      }
    })
    return stats
  }, [sales])

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean))
    return Array.from(cats)
  }, [products])

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

  // Filter products for the UI list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = filterCategory === "all" || p.category === filterCategory
      return matchesSearch && matchesCategory
    })
  }, [products, search, filterCategory])

  // Filter products for PRINT based on specialized criteria
  const printableProducts = useMemo(() => {
    let result = [...products]

    // 1. Category Filter
    if (printFilters.category !== "all") {
      result = result.filter(p => p.category === printFilters.category)
    }

    // 2. Stock Status Filter
    if (printFilters.stockStatus === "low") {
      result = result.filter(p => p.stock > 0 && p.stock < 5)
    } else if (printFilters.stockStatus === "out") {
      result = result.filter(p => p.stock <= 0)
    } else if (printFilters.stockStatus === "healthy") {
      result = result.filter(p => p.stock >= 10)
    }

    // 3. Performance Sorting
    if (printFilters.performance === "mostSold") {
      result.sort((a, b) => (productSalesStats[b.id] || 0) - (productSalesStats[a.id] || 0))
    } else if (printFilters.performance === "leastSold") {
      result.sort((a, b) => (productSalesStats[a.id] || 0) - (productSalesStats[b.id] || 0))
    }

    return result
  }, [products, printFilters, productSalesStats])

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
    setTimeout(() => {
      setEditingProduct(product)
    }, 10)
  }

  const handlePrint = () => {
    setIsPrintDialogOpen(false)
    // Delay print to allow dialog to close and printable products to render
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.print();
      }
    }, 500)
  }

  const logoUrl = PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Print Only Header */}
      <div className="hidden print:flex flex-col items-center justify-center mb-8 border-b pb-6 w-full text-center">
        <div className="flex items-center gap-4 mb-2">
          {logoUrl && (
            <img 
              src={logoUrl} 
              alt="SpecsBiz Logo" 
              className="h-16 w-16 object-contain"
            />
          )}
          <h1 className="text-4xl font-black text-primary font-headline">SpecsBiz</h1>
        </div>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Inventory Intelligence Report</p>
        <div className="text-[10px] mt-2 opacity-60 font-medium flex items-center gap-2 justify-center">
          <Calendar className="w-3 h-3" /> Report Date: {reportDate || "Loading..."}
        </div>
        
        <div className="mt-4 flex gap-2 flex-wrap justify-center">
          <span className="text-[9px] bg-muted px-2 py-1 rounded border">Category: {printFilters.category.toUpperCase()}</span>
          <span className="text-[9px] bg-muted px-2 py-1 rounded border">Stock Filter: {printFilters.stockStatus.toUpperCase()}</span>
          <span className="text-[9px] bg-muted px-2 py-1 rounded border">Performance Sort: {printFilters.performance.toUpperCase()}</span>
        </div>
      </div>

      {/* Print Only Table */}
      <div className="hidden print:block">
        <Table>
          <TableHeader>
            <TableRow>
              {printColumns.name && <TableHead className="font-bold text-black uppercase text-[10px]">Product Name</TableHead>}
              {printColumns.category && <TableHead className="font-bold text-black uppercase text-[10px]">Category</TableHead>}
              {printColumns.buyPrice && <TableHead className="font-bold text-black uppercase text-[10px]">Buy Price</TableHead>}
              {printColumns.sellPrice && <TableHead className="font-bold text-black uppercase text-[10px]">Sell Price</TableHead>}
              {printColumns.stock && <TableHead className="font-bold text-black uppercase text-[10px]">Stock Level</TableHead>}
              {printColumns.salesCount && <TableHead className="font-bold text-black uppercase text-[10px]">Units Sold</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {printableProducts.map((p) => (
              <TableRow key={p.id}>
                {printColumns.name && <TableCell className="text-sm font-bold">{p.name}</TableCell>}
                {printColumns.category && <TableCell className="text-[10px]">{p.category || 'N/A'}</TableCell>}
                {printColumns.buyPrice && <TableCell className="text-[10px]">{currency}{p.purchasePrice?.toLocaleString()}</TableCell>}
                {printColumns.sellPrice && <TableCell className="text-[10px] font-bold">{currency}{p.sellingPrice?.toLocaleString()}</TableCell>}
                {printColumns.stock && (
                  <TableCell className={cn("text-xs", p.stock < 5 ? "text-red-600 font-bold" : "")}>
                    {p.stock} {p.unit}
                  </TableCell>
                )}
                {printColumns.salesCount && <TableCell className="text-xs font-bold text-blue-600">{productSalesStats[p.id] || 0}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-headline text-primary flex items-center gap-2">
            <Package className="w-5 h-5 md:w-6 md:h-6 text-accent" /> Inventory
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">Manage your stock and profit margins.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="flex-1 sm:flex-none gap-2 border-primary text-primary shadow-sm hover:bg-primary/5" 
                disabled={products.length === 0}
              >
                <Printer className="w-4 h-4" /> Print Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-accent" /> Print Configuration
                </DialogTitle>
                <DialogDescription>
                  Configure exactly which items and data you want to print.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Select Items to Include</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px]">Category</Label>
                        <Select value={printFilters.category} onValueChange={(v) => setPrintFilters({...printFilters, category: v})}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px]">Stock Status</Label>
                        <Select value={printFilters.stockStatus} onValueChange={(v) => setPrintFilters({...printFilters, stockStatus: v})}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Items</SelectItem>
                            <SelectItem value="low">Low Stock (&lt; 5)</SelectItem>
                            <SelectItem value="out">Out of Stock</SelectItem>
                            <SelectItem value="healthy">Healthy Stock (&gt; 10)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Ordering & Priority</Label>
                    <Select value={printFilters.performance} onValueChange={(v) => setPrintFilters({...printFilters, performance: v})}>
                      <SelectTrigger className="h-10 border-accent/20">
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alphabetical (A-Z)</SelectItem>
                        <SelectItem value="mostSold">Most Sold Units First</SelectItem>
                        <SelectItem value="leastSold">Least Sold Units First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Report Columns</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.entries(printColumns).map(([key, val]) => (
                        <div key={key} className="flex items-center space-x-2 bg-muted/30 p-2 rounded-lg border border-transparent hover:border-accent/20 transition-colors">
                          <Switch 
                            id={`col-${key}`} 
                            checked={val} 
                            onCheckedChange={(checked) => setPrintColumns({...printColumns, [key]: checked})} 
                          />
                          <Label htmlFor={`col-${key}`} className="text-[10px] capitalize cursor-pointer">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-600 shrink-0" />
                  <p className="text-[10px] text-blue-700 leading-relaxed">
                    <strong>Smart Report Info:</strong> Your report will include current live stock levels and total unit sales for the selected criteria.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button className="w-full bg-accent h-12 text-lg shadow-xl" onClick={handlePrint}>
                  <Printer className="w-5 h-5 mr-2" /> Generate & Print Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 flex-1 sm:flex-none shadow-lg">
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
      </div>

      <Card className="print:hidden shadow-sm border-accent/10">
        <CardHeader className="p-4 border-b flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search inventory by name..." 
              className="pl-9 h-10 bg-white shadow-inner" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-[180px] bg-white h-10">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-10 text-xs">Loading...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2 text-center">
              <Inbox className="w-8 h-8 opacity-20" />
              <p className="text-xs italic">No products found for this filter.</p>
            </div>
          ) : (
            <div className="min-w-[600px]">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-xs font-bold uppercase">Product Name & Category</TableHead>
                    <TableHead className="text-xs font-bold uppercase">Performance</TableHead>
                    <TableHead className="text-xs font-bold uppercase">Pricing</TableHead>
                    <TableHead className="text-xs font-bold uppercase">Stock Level</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((p) => {
                    const soldCount = productSalesStats[p.id] || 0
                    return (
                      <TableRow key={p.id} className="hover:bg-accent/5 group">
                        <TableCell className="p-3">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-primary group-hover:text-accent transition-colors">{p.name}</p>
                            <div className="text-[9px] text-accent uppercase font-bold">{p.category || 'No Category'} • {p.unit}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn(
                              "text-[9px] font-bold h-5 px-1.5",
                              soldCount > 10 ? "bg-green-50 border-green-200 text-green-700" : "bg-muted text-muted-foreground"
                            )}>
                              {soldCount > 0 ? (
                                <div className="flex items-center gap-1">
                                  {soldCount > 10 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
                                  {soldCount} Sold
                                </div>
                              ) : "0 Sold"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground font-medium">Buy: {currency}{p.purchasePrice?.toLocaleString()}</span>
                            <span className="font-bold text-primary text-[11px] md:text-xs">Sell: {currency}{p.sellingPrice?.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[10px] md:text-xs">
                          <span className={cn(
                            "px-2 py-1 rounded-full",
                            p.stock < 5 ? "bg-red-100 text-red-600 font-bold" : "bg-green-100 text-green-700"
                          )}>
                            {p.stock} {p.unit}
                          </span>
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
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="hidden print:flex items-center justify-between text-[10px] text-muted-foreground italic border-t pt-4 mt-8">
         <p>* Total Products in this Report: {printableProducts.length}</p>
         <p>Authorized by SpecsBiz Intelligence Engine.</p>
      </div>

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

      <style jsx global>{`
        @media print {
          .print\\:hidden, nav, .fixed { display: none !important; }
          body { background: white !important; padding: 0 !important; margin: 0 !important; }
          .sidebar-wrapper, header, footer, .sidebar-inset > header, nav, [role="navigation"] { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
          .rounded-lg, .rounded-xl { border-radius: 0 !important; }
          .shadow-lg, .shadow-xl, .shadow-sm { box-shadow: none !important; }
          table { width: 100% !important; border-collapse: collapse !important; border: 1px solid #ddd !important; }
          th, td { border: 1px solid #ddd !important; padding: 10px !important; color: black !important; }
          .text-primary { color: black !important; }
          .text-accent { color: #008080 !important; }
          img { max-height: 80px !important; width: auto !important; }
        }
      `}</style>
    </div>
  )
}
