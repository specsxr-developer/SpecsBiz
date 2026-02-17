
"use client"

import { useState, useMemo, use, useEffect, useRef } from "react"
import { 
  Lock, 
  Store, 
  ShoppingBag, 
  Tag, 
  Package, 
  AlertCircle,
  ArrowRight,
  Sparkles,
  Quote,
  ChevronRight,
  X,
  ImageIcon,
  DollarSign,
  ShoppingCart,
  Percent,
  FileText,
  Maximize2,
  MessageCircle,
  Search,
  Inbox
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase"
import { collection, doc, query, orderBy } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter
} from "@/components/ui/dialog"

/**
 * @fileOverview Top banner ad component for Adsterra integration.
 * Placed above the search box as requested.
 */
function ShopTopBannerAd() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adRef.current && adRef.current.childNodes.length === 0) {
      const container = adRef.current;
      
      const scriptConf = document.createElement('script');
      scriptConf.innerHTML = `
        atOptions = {
          'key' : '44d28b6f7e3567f40fd2e068a8084c0c',
          'format' : 'iframe',
          'height' : 60,
          'width' : 468,
          'params' : {}
        };
      `;
      
      const scriptInvoke = document.createElement('script');
      scriptInvoke.type = 'text/javascript';
      scriptInvoke.src = `https://www.highperformanceformat.com/44d28b6f7e3567f40fd2e068a8084c0c/invoke.js`;
      
      container.appendChild(scriptConf);
      container.appendChild(scriptInvoke);
    }
  }, []);

  return (
    <div className="mb-8 flex flex-col items-center gap-1 overflow-hidden w-full">
      <p className="text-[7px] font-black uppercase text-primary/20 tracking-widest">Sponsored</p>
      <div ref={adRef} className="w-full flex justify-center min-h-[60px]" />
    </div>
  );
}

export default function PublicShopPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const db = useFirestore()
  
  const [code, setCode] = useState("")
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [error, setError] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [zoomImage, setZoomImage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Load Popunder Ad
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = "https://pl28730615.effectivegatecpm.com/52/c3/f7/52c3f78501c6a5e4f66885863b6715df.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Fetch Public Shop Config
  const shopConfigRef = useMemoFirebase(() => {
    if (!db || !userId) return null;
    return doc(db, 'users', userId, 'shopConfig', 'default');
  }, [db, userId]);

  const { data: config, isLoading: configLoading } = useDoc(shopConfigRef);

  // Auto-unlock if no access code is set
  useEffect(() => {
    if (config && (!config.accessCode || config.accessCode.trim() === "" || config.accessCode === "0")) {
      setIsUnlocked(true);
    }
  }, [config]);

  // Fetch Public Products
  const shopProductsQuery = useMemoFirebase(() => {
    if (!db || !userId) return null;
    return query(collection(db, 'users', userId, 'shopProducts'), orderBy('name'));
  }, [db, userId]);

  const { data: allShopProducts, isLoading: productsLoading } = useCollection(shopProductsQuery);

  const visibleProducts = useMemo(() => {
    if (!allShopProducts) return [];
    return allShopProducts.filter(p => {
      const isVisible = p.isVisible !== false;
      if (!searchQuery.trim()) return isVisible;

      const lowerQuery = searchQuery.toLowerCase();
      const matchesSearch = 
        p.name.toLowerCase().includes(lowerQuery) ||
        (p.category || "").toLowerCase().includes(lowerQuery) ||
        (p.description || "").toLowerCase().includes(lowerQuery);
      
      return isVisible && matchesSearch;
    });
  }, [allShopProducts, searchQuery]);

  const handleUnlock = () => {
    if (config?.accessCode && code === config.accessCode) {
      setIsUnlocked(true)
      setError("")
    } else {
      setError("Invalid access code. Please check with the owner.")
    }
  }

  const handleWhatsAppOrder = (product: any) => {
    if (!config?.whatsappNumber) {
      alert("Store owner has not set a WhatsApp number yet.");
      return;
    }

    const shopName = config.shopName || "Our Shop";
    const message = `Hello ${shopName}, I'm interested in the following product:\n\n` +
                    `🛍️ Product: ${product.name}\n` +
                    `🏷️ Category: ${product.category || 'General'}\n` +
                    `💰 Price: ৳${product.sellingPrice}\n` +
                    `📦 Unit: ${product.unit || 'pcs'}\n\n` +
                    `Please let me know the availability and ordering process.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${config.whatsappNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  }

  if (configLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#191970] text-white p-6 gap-4">
      <div className="h-16 w-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 animate-pulse">Initializing Shop...</p>
    </div>
  )

  if (!config || !config.isActive) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#191970] p-6 text-center text-white">
      <div className="p-6 bg-white/10 rounded-[3rem] backdrop-blur-md mb-6 border border-white/20">
        <Store className="w-16 h-16 text-accent" />
      </div>
      <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Shop is Offline</h1>
      <p className="text-sm font-medium opacity-60 max-w-xs mx-auto">The owner has paused this store.</p>
    </div>
  )

  if (!isUnlocked) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#191970] p-6 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary to-transparent opacity-50" />
      <div className="w-full max-w-sm space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="mx-auto w-24 h-24 bg-white p-5 rounded-[2.5rem] shadow-2xl flex items-center justify-center border border-accent/20">
            <Store className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">{config.shopName || "Our Shop"}</h1>
        </div>
        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/10 backdrop-blur-xl ring-1 ring-white/20">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <Input type="password" value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUnlock()} placeholder="Enter Access Code" className="h-16 text-2xl font-black text-center bg-white/10 border-white/20 text-white rounded-2xl placeholder:text-white/20" />
              {error && <div className="bg-red-500/20 p-3 rounded-xl border border-red-500/30 flex items-center gap-2 text-red-200 text-[10px] font-bold uppercase"><AlertCircle className="w-4 h-4" /> {error}</div>}
              <Button onClick={handleUnlock} className="w-full h-16 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black uppercase shadow-xl transition-all gap-2">Unlock Shop <ArrowRight className="w-5 h-5" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#E0FFFF] pb-20 font-body">
      <div className="bg-[#191970] text-white p-8 md:p-12 space-y-6 rounded-b-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><ShoppingBag className="w-40 h-40" /></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent rounded-xl shadow-lg"><Store className="w-6 h-6 text-white" /></div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">{config.shopName || "Our Shop"}</h1>
            </div>
            <p className="text-sm font-bold text-accent uppercase tracking-[0.3em] opacity-80">Digital Shop Gallery</p>
          </div>
          <Badge className="bg-white/10 backdrop-blur-md border border-white/20 h-10 px-6 text-xs font-black uppercase tracking-widest rounded-full">{allShopProducts?.length || 0} Items Available</Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 -mt-8 space-y-8 relative z-20">
        {config.welcomeMsg && (
          <Card className="border-none shadow-lg rounded-[2rem] bg-white overflow-hidden">
            <CardContent className="p-6 md:p-8 flex gap-4">
              <Quote className="w-8 h-8 text-accent opacity-20 shrink-0" />
              <p className="text-sm md:text-lg font-medium text-primary leading-relaxed italic">{config.welcomeMsg}</p>
            </CardContent>
          </Card>
        )}

        {/* Adsterra Banner Ad above search box */}
        <ShopTopBannerAd />

        <div className="relative group/search max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-primary opacity-40 group-focus-within/search:opacity-100 group-focus-within/search:text-accent transition-all" />
          </div>
          <Input 
            placeholder="Search products by name, category, or details..."
            className="h-14 pl-12 pr-4 rounded-2xl border-none bg-white shadow-lg text-lg font-medium text-primary placeholder:text-primary/30 focus-visible:ring-2 focus-visible:ring-accent transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-4 flex items-center text-primary/40 hover:text-destructive transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {productsLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase text-primary/40 tracking-widest">Updating Catalog...</p>
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="py-24 text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="mx-auto w-24 h-24 rounded-full bg-white shadow-inner flex items-center justify-center text-primary/10">
              <Inbox className="w-12 h-12" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-primary uppercase tracking-tighter">No Products Found</h3>
              <p className="text-sm text-primary/40 font-medium">Try adjusting your search query or clear filters.</p>
            </div>
            {searchQuery && (
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
                className="rounded-xl border-accent text-accent hover:bg-accent hover:text-white"
              >
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleProducts.map((p) => {
              const hasDiscount = p.originalPrice > p.sellingPrice;
              const discountPercent = hasDiscount ? Math.round(((p.originalPrice - p.sellingPrice) / p.originalPrice) * 100) : 0;
              
              return (
                <Card key={p.id} className="overflow-hidden border-none shadow-xl rounded-[2.5rem] bg-white hover:shadow-2xl transition-all group active:scale-[0.98] flex flex-col h-full">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground opacity-20"><Package className="w-16 h-16" /></div>
                    )}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                      <Badge className="bg-primary/80 backdrop-blur-md border-none text-[10px] font-black uppercase h-7 px-4 shadow-xl">{p.category || 'General'}</Badge>
                      {hasDiscount && <Badge className="bg-red-500 text-white border-none text-[10px] font-black h-7 px-3 shadow-xl animate-pulse">{discountPercent}% OFF</Badge>}
                    </div>
                  </div>
                  <CardContent className="p-6 md:p-8 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-primary leading-tight truncate">{p.name}</h3>
                      <p className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-1"><Tag className="w-3 h-3" /> Unit: {p.unit || 'pcs'}</p>
                    </div>
                    
                    <div className="pt-4 border-t border-black/5 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        {hasDiscount && <p className="text-[10px] font-black text-red-500 line-through opacity-60">৳{p.originalPrice?.toLocaleString()}</p>}
                        <p className="text-2xl font-black text-primary">৳{p.sellingPrice?.toLocaleString()}</p>
                      </div>
                      <Button onClick={() => setSelectedProduct(p)} variant="outline" className="h-12 px-6 rounded-2xl border-accent text-accent font-black uppercase text-[10px] tracking-widest hover:bg-accent hover:text-white transition-all gap-2">View Details <ChevronRight className="w-4 h-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="w-[95vw] sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-[3rem] p-0 border-none shadow-2xl">
          {selectedProduct && (
            <>
              <div className="sr-only">
                <DialogTitle>{selectedProduct.name}</DialogTitle>
                <DialogDescription>Viewing detailed information for {selectedProduct.name}</DialogDescription>
              </div>

              <div className="relative">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="space-y-4 bg-muted/30 p-6 md:p-8">
                    <div 
                      className="aspect-square rounded-[2rem] overflow-hidden shadow-2xl bg-white cursor-zoom-in group/main relative"
                      onClick={() => selectedProduct.imageUrl && setZoomImage(selectedProduct.imageUrl)}
                    >
                      {selectedProduct.imageUrl ? (
                        <>
                          <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover transition-transform group-hover/main:scale-105" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/main:opacity-100 flex items-center justify-center transition-opacity">
                            <Maximize2 className="w-8 h-8 text-white drop-shadow-lg" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted opacity-20">
                          <Package className="w-16 h-16" />
                        </div>
                      )}
                    </div>
                    {(selectedProduct.galleryImages?.length || 0) > 0 && (
                      <div className="grid grid-cols-5 gap-2">
                        {selectedProduct.galleryImages.map((img: string, i: number) => (
                          <div 
                            key={i} 
                            className="aspect-square rounded-xl overflow-hidden border-2 border-white shadow-sm cursor-zoom-in hover:scale-105 active:scale-95 transition-all"
                            onClick={() => img && setZoomImage(img)}
                          >
                            <img src={img} className="w-full h-full object-cover" alt={`Gallery ${i}`} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-8 md:p-10 space-y-8 flex flex-col justify-center">
                    <div className="space-y-2">
                      <Badge className="bg-accent/10 text-accent border-none text-[9px] font-black uppercase h-6 px-3">{selectedProduct.category || 'General'}</Badge>
                      <h2 className="text-3xl font-black text-primary leading-tight">{selectedProduct.name}</h2>
                      <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2"><Package className="w-4 h-4 text-accent" /> Quantity: {selectedProduct.unit || 'pcs'}</p>
                    </div>

                    <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10">
                      <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Our Best Price</p>
                      <div className="flex items-center gap-4">
                        <span className="text-4xl font-black text-primary">৳{selectedProduct.sellingPrice?.toLocaleString()}</span>
                        {selectedProduct.originalPrice > selectedProduct.sellingPrice && (
                          <span className="text-lg font-black text-red-500 line-through opacity-40">৳{selectedProduct.originalPrice?.toLocaleString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2"><FileText className="w-4 h-4 text-accent" /> Description</h4>
                      <p className="text-sm font-medium text-primary/70 leading-relaxed">{selectedProduct.description || "High-quality original product verified by SpecsBiz. Contact owner for more details."}</p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className={cn(
                        "w-full h-12 rounded-2xl flex items-center justify-center font-black uppercase text-[10px] tracking-[0.2em] shadow-sm border",
                        selectedProduct.stockStatus === 'in_stock' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                      )}>
                        {selectedProduct.stockStatus === 'in_stock' ? 'In Stock Now' : 'Currently Unavailable'}
                      </div>
                      
                      <Button 
                        onClick={() => handleWhatsAppOrder(selectedProduct)}
                        className="w-full h-16 bg-green-600 hover:bg-green-700 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-sm shadow-xl transition-all active:scale-95"
                      >
                        <MessageCircle className="w-6 h-6 fill-white text-green-600" />
                        Order via WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 h-10 w-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl hover:bg-red-500 hover:text-white transition-all"><X className="w-6 h-6" /></button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!zoomImage} onOpenChange={(open) => !open && setZoomImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-black/90 backdrop-blur-xl shadow-none flex items-center justify-center overflow-hidden rounded-3xl">
          <div className="sr-only">
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>Full screen view of product photo</DialogDescription>
          </div>
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {zoomImage && (
              <img 
                src={zoomImage} 
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300" 
                alt="Zoomed preview" 
              />
            )}
            <button 
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all shadow-xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <footer className="mt-20 py-12 px-6 text-center space-y-4">
        <div className="flex items-center justify-center gap-3"><span className="h-px w-8 bg-primary/10" /><div className="p-2 bg-primary/5 rounded-xl"><Sparkles className="w-4 h-4 text-accent" /></div><span className="h-px w-8 bg-primary/10" /></div>
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-40">Digital Shop Powered by SpecsBiz</p>
      </footer>
    </div>
  )
}
