
"use client"

import { useState, useMemo, use } from "react"
import { 
  Lock, 
  Store, 
  ShoppingBag, 
  Tag, 
  Package, 
  AlertCircle,
  ArrowRight,
  Sparkles,
  Quote
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase"
import { collection, doc, query, orderBy } from "firebase/firestore"
import { cn } from "@/lib/utils"

export default function PublicShopPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const db = useFirestore()
  
  const [code, setCode] = useState("")
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [error, setError] = useState("")

  // Fetch Public Shop Config
  const shopConfigRef = useMemoFirebase(() => {
    if (!db || !userId) return null;
    return doc(db, 'users', userId, 'shopConfig', 'default');
  }, [db, userId]);

  const { data: config, isLoading: configLoading } = useDoc(shopConfigRef);

  // Fetch Public Products
  const productsQuery = useMemoFirebase(() => {
    if (!db || !userId) return null;
    return query(collection(db, 'users', userId, 'products'), orderBy('name'));
  }, [db, userId]);

  const { data: allProducts, isLoading: productsLoading } = useCollection(productsQuery);

  // Filter products that are marked as visible for the shop
  const visibleProducts = useMemo(() => {
    if (!allProducts) return [];
    return allProducts.filter(p => p.showInShop !== false);
  }, [allProducts]);

  const handleUnlock = () => {
    if (config?.accessCode && code === config.accessCode) {
      setIsUnlocked(true)
      setError("")
    } else {
      setError("Invalid access code. Please check with the owner.")
    }
  }

  if (configLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#191970] text-white p-6 gap-4">
      <div className="h-16 w-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-black uppercase tracking-[0.3em] opacity-50 animate-pulse">Initializing Shop...</p>
    </div>
  )

  if (!config || !config.isActive) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#191970] p-6 text-center text-white">
      <div className="p-6 bg-white/10 rounded-[3rem] backdrop-blur-md mb-6 border border-white/20">
        <Store className="w-16 h-16 text-accent" />
      </div>
      <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Shop is Offline</h1>
      <p className="text-sm font-medium opacity-60 max-w-xs mx-auto leading-relaxed">
        The owner has currently paused this online store. Please try again later.
      </p>
    </div>
  )

  if (!isUnlocked) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#191970] p-6 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary to-transparent opacity-50" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-accent/20 rounded-full blur-[100px]" />
      
      <div className="w-full max-w-sm space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="mx-auto w-24 h-24 bg-white p-5 rounded-[2.5rem] shadow-2xl flex items-center justify-center border border-accent/20">
            <Store className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter drop-shadow-lg">
              {config.shopName || "Our Shop"}
            </h1>
            <p className="text-[10px] font-bold text-accent uppercase tracking-[0.4em] opacity-80">Online Store</p>
          </div>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/10 backdrop-blur-xl ring-1 ring-white/20">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2 text-center">
              <h3 className="text-white font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 text-accent" /> Security Check
              </h3>
              <p className="text-[10px] font-medium text-white/50">Enter the access code to explore products</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Input 
                  type="password" 
                  value={code} 
                  onChange={e => setCode(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                  placeholder="••••" 
                  className="h-16 text-2xl font-black text-center bg-white/10 border-white/20 text-white rounded-2xl placeholder:text-white/20 focus-visible:ring-accent"
                />
              </div>
              {error && (
                <div className="bg-red-500/20 p-3 rounded-xl border border-red-500/30 flex items-center gap-2 text-red-200">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">{error}</span>
                </div>
              )}
              <Button 
                onClick={handleUnlock}
                className="w-full h-16 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black uppercase shadow-xl transition-all active:scale-95 gap-2"
              >
                Unlock Shop <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-center text-[10px] font-bold text-white/30 uppercase tracking-widest">
          Powered by SpecsBiz Smart Manager
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#E0FFFF] pb-20">
      <div className="bg-[#191970] text-white p-8 md:p-12 space-y-6 rounded-b-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><ShoppingBag className="w-40 h-40" /></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent rounded-xl shadow-lg"><Store className="w-6 h-6 text-white" /></div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">{config.shopName || "Our Shop"}</h1>
            </div>
            <p className="text-sm font-bold text-accent uppercase tracking-[0.3em] opacity-80">Online Digital Gallery</p>
          </div>
          <Badge className="bg-white/10 backdrop-blur-md border border-white/20 h-10 px-6 text-xs font-black uppercase tracking-widest rounded-full">
            {visibleProducts.length} Items Available
          </Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 -mt-8 space-y-8 relative z-20">
        {/* Welcome Message Section */}
        {config.welcomeMsg && (
          <Card className="border-none shadow-lg rounded-[2rem] bg-white overflow-hidden animate-in slide-in-from-top-4 duration-700">
            <CardContent className="p-6 md:p-8 flex gap-4">
              <Quote className="w-8 h-8 text-accent opacity-20 shrink-0" />
              <p className="text-sm md:text-lg font-medium text-primary leading-relaxed italic">
                {config.welcomeMsg}
              </p>
            </CardContent>
          </Card>
        )}

        {productsLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase text-primary/40 tracking-widest">Updating Catalog...</p>
          </div>
        ) : visibleProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleProducts.map((p) => (
              <Card key={p.id} className="overflow-hidden border-none shadow-xl rounded-[2.5rem] bg-white hover:shadow-2xl transition-all group active:scale-[0.98]">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground opacity-20"><Package className="w-16 h-16" /></div>
                  )}
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-primary/80 backdrop-blur-md border-none text-[10px] font-black uppercase h-7 px-4 shadow-xl">
                      {p.category || 'General'}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-6 md:p-8 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-primary leading-tight truncate">{p.name}</h3>
                    <p className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Unit: {p.unit || 'pcs'}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-black/5">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black uppercase text-muted-foreground opacity-50">Retail Price</p>
                      <p className="text-2xl font-black text-primary">৳{p.sellingPrice?.toLocaleString()}</p>
                    </div>
                    <div className={cn(
                      "h-12 px-6 rounded-2xl flex items-center justify-center font-black text-[10px] uppercase tracking-widest shadow-lg",
                      p.stock > 0 ? "bg-emerald-500 text-white shadow-emerald-100" : "bg-red-500 text-white shadow-red-100"
                    )}>
                      {p.stock > 0 ? 'In Stock' : 'Sold Out'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center space-y-6 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-white shadow-xl">
            <div className="p-6 bg-muted rounded-full w-fit mx-auto opacity-20"><Package className="w-16 h-16" /></div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-primary uppercase">No Featured Products</h3>
              <p className="text-sm font-medium text-muted-foreground opacity-60">The owner hasn't enabled any products for this digital catalog yet.</p>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-20 py-12 px-6 text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-primary/10" />
          <div className="p-2 bg-primary/5 rounded-xl"><Sparkles className="w-4 h-4 text-accent" /></div>
          <span className="h-px w-8 bg-primary/10" />
        </div>
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-40">
          Digital Shop Powered by SpecsBiz
        </p>
      </footer>
    </div>
  )
}
