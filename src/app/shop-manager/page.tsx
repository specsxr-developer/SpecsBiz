
"use client"

import { useState, useEffect } from "react"
import { 
  Globe, 
  Lock, 
  Settings2, 
  Copy, 
  CheckCircle2, 
  Store,
  Share2,
  AlertCircle,
  Settings,
  X,
  Maximize2,
  RefreshCw,
  ShieldAlert,
  LayoutTemplate,
  PackageCheck,
  Eye,
  EyeOff,
  MessageSquareText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useBusinessData } from "@/hooks/use-business-data"
import { useUser } from "@/firebase"
import { translations } from "@/lib/translations"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from "@/components/ui/dialog"

export default function ShopManagerPage() {
  const { user } = useUser()
  const { toast } = useToast()
  const { shopConfig, products, actions, language } = useBusinessData()
  const t = translations[language]

  const [shopName, setShopName] = useState("")
  const [accessCode, setAccessCode] = useState("")
  const [welcomeMsg, setWelcomeMsg] = useState("")
  const [isActive, setIsActive] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (shopConfig) {
      setShopName(shopConfig.shopName || "")
      setAccessCode(shopConfig.accessCode || "")
      setWelcomeMsg(shopConfig.welcomeMsg || "")
      setIsActive(shopConfig.isActive || false)
    }
  }, [shopConfig])

  const handleSave = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Cloud Required", description: "Please login to activate your online shop." })
      return
    }
    actions.updateShopConfig({
      shopName,
      accessCode,
      welcomeMsg,
      isActive
    })
    toast({ title: "Shop Configuration Updated" })
    setRefreshKey(prev => prev + 1)
  }

  const toggleProductVisibility = (productId: string, currentStatus: boolean) => {
    actions.updateProduct(productId, { showInShop: !currentStatus })
    toast({ title: currentStatus ? "Hidden from Shop" : "Visible in Shop" })
  }

  const shopUrl = user ? `${window.location.origin}/shop/${user.uid}` : ""

  const copyToClipboard = () => {
    if (!shopUrl) return
    navigator.clipboard.writeText(shopUrl)
    toast({ title: "Link Copied" })
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-140px)] w-full max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary rounded-2xl shadow-lg">
            <Globe className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-primary uppercase tracking-tighter">{t.shopManager}</h2>
            <p className="text-[9px] font-bold text-accent uppercase tracking-[0.3em]">Administrator Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-xl hover:bg-accent/10 text-accent"
            onClick={() => setRefreshKey(prev => prev + 1)}
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
          
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 h-12 px-6 rounded-2xl shadow-xl font-black uppercase gap-2 transition-all active:scale-95">
                <Settings className="w-5 h-5" /> {language === 'bn' ? 'অ্যাডমিন সেটিংস' : 'Admin Settings'}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[750px] rounded-[2.5rem] p-0 overflow-hidden border-accent/20 shadow-2xl">
              <DialogHeader className="p-6 bg-accent/5 border-b shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl border border-accent/10 shadow-sm"><Settings2 className="w-6 h-6 text-accent" /></div>
                    <div>
                      <DialogTitle className="text-xl font-black text-primary uppercase tracking-tighter">Shop Administrator</DialogTitle>
                      <DialogDescription className="text-[10px] font-bold uppercase opacity-60">Full Control Panel</DialogDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mr-8">
                    <span className={cn("text-[9px] font-black uppercase", isActive ? "text-green-600" : "text-muted-foreground")}>
                      {isActive ? t.active : t.inactive}
                    </span>
                    <Switch checked={isActive} onCheckedChange={setIsActive} disabled={!user} />
                  </div>
                </div>
              </DialogHeader>
              
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="w-full justify-start rounded-none bg-muted/30 px-6 h-12 border-b">
                  <TabsTrigger value="general" className="gap-2 text-[10px] font-black uppercase tracking-widest"><Settings className="w-3.5 h-3.5" /> General</TabsTrigger>
                  <TabsTrigger value="content" className="gap-2 text-[10px] font-black uppercase tracking-widest"><LayoutTemplate className="w-3.5 h-3.5" /> Customization</TabsTrigger>
                  <TabsTrigger value="products" className="gap-2 text-[10px] font-black uppercase tracking-widest"><PackageCheck className="w-3.5 h-3.5" /> Inventory Control</TabsTrigger>
                </TabsList>

                <div className="p-8 bg-white max-h-[60vh] overflow-y-auto">
                  <TabsContent value="general" className="space-y-8 mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{t.shopName}</Label>
                        <Input value={shopName} onChange={e => setShopName(e.target.value)} className="h-14 rounded-2xl bg-muted/20 border-none font-bold text-primary" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{t.shopCode}</Label>
                        <Input value={accessCode} onChange={e => setAccessCode(e.target.value)} className="h-14 rounded-2xl bg-muted/20 border-none font-bold text-primary" />
                      </div>
                    </div>

                    <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-[1.5rem] space-y-4">
                      <div className="flex items-center gap-3">
                        <Share2 className="w-5 h-5 text-emerald-600" />
                        <h4 className="text-xs font-black uppercase text-emerald-900">{t.shareLink}</h4>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-white border border-emerald-200 p-3 rounded-xl truncate text-[10px] font-mono text-emerald-800 shadow-inner">
                          {shopUrl || 'Login required'}
                        </div>
                        <Button variant="outline" size="sm" className="bg-white border-emerald-200 text-emerald-700 font-bold rounded-xl" onClick={copyToClipboard} disabled={!user}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="content" className="space-y-6 mt-0">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-2">
                        <MessageSquareText className="w-3.5 h-3.5 text-accent" /> Custom Welcome Message
                      </Label>
                      <textarea 
                        value={welcomeMsg} 
                        onChange={e => setWelcomeMsg(e.target.value)}
                        placeholder="Welcome to our shop! Feel free to explore our collection..."
                        className="w-full min-h-[120px] p-4 rounded-2xl bg-muted/20 border-none font-medium text-sm text-primary focus:ring-2 focus:ring-accent outline-none"
                      />
                      <p className="text-[9px] font-bold text-muted-foreground italic px-1">This message will appear at the top of your shop gallery.</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="products" className="space-y-4 mt-0">
                    <div className="flex items-center justify-between mb-4 border-b pb-2">
                      <h4 className="text-xs font-black uppercase text-primary">Web Catalog Management</h4>
                      <Badge variant="outline" className="text-[9px] font-black">{products.length} Products</Badge>
                    </div>
                    <ScrollArea className="h-[300px] pr-4">
                      <div className="grid gap-3">
                        {products.map((p) => (
                          <div key={p.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-xl border border-black/5 hover:bg-muted/20 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-white overflow-hidden border">
                                {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-accent/5 flex items-center justify-center text-[8px] font-bold">N/A</div>}
                              </div>
                              <div>
                                <p className="text-[11px] font-black text-primary leading-none mb-1">{p.name}</p>
                                <p className="text-[9px] font-bold text-accent uppercase">{p.category || 'General'}</p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={cn(
                                "h-8 rounded-lg font-black text-[9px] uppercase gap-2 transition-all",
                                p.showInShop !== false ? "text-green-600 bg-green-50" : "text-muted-foreground bg-muted/50"
                              )}
                              onClick={() => toggleProductVisibility(p.id, p.showInShop !== false)}
                            >
                              {p.showInShop !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              {p.showInShop !== false ? "Visible" : "Hidden"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </div>

                <div className="p-6 bg-muted/20 border-t">
                  <Button 
                    onClick={handleSave} 
                    disabled={!user}
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 font-black uppercase shadow-xl transition-all active:scale-95 gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Deploy All Changes
                  </Button>
                </div>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!user ? (
        <Card className="bg-amber-50 border-amber-200 p-6 rounded-[2rem] flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-600 mt-1 shrink-0" />
          <div>
            <h4 className="font-black text-amber-800 uppercase text-sm">Cloud Login Required</h4>
            <p className="text-xs font-medium text-amber-700/80 mt-1 leading-relaxed">
              Your online shop needs a cloud connection to work publicly. Please go to the <b>Auth</b> page and connect your account first.
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex-1 min-h-0 bg-white rounded-[2.5rem] overflow-hidden border-4 border-accent/10 shadow-2xl relative group">
          {isActive ? (
            <>
              <iframe 
                key={refreshKey}
                src={shopUrl} 
                className="w-full h-full border-none"
                title="Shop Preview"
              />
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={shopUrl} target="_blank" rel="noreferrer">
                  <Button className="bg-primary/80 backdrop-blur-md text-white rounded-full h-12 px-6 gap-2 shadow-2xl">
                    <Maximize2 className="w-4 h-4" /> View Full Site
                  </Button>
                </a>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center gap-6 bg-accent/5">
              <div className="p-8 bg-white rounded-[3rem] shadow-xl text-muted-foreground/20">
                <Globe className="w-24 h-24" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-primary uppercase">Preview Offline</h3>
                <p className="text-sm font-medium text-muted-foreground max-w-xs mx-auto">
                  আপনার শপটি বর্তমানে বন্ধ আছে। সেটিংস থেকে <b>Active</b> করে সেভ করুন এখানে প্রিভিউ দেখার জন্য।
                </p>
                <Button variant="outline" className="mt-4 border-accent text-accent rounded-xl font-bold" onClick={() => setIsSettingsOpen(true)}>
                  Open Admin Settings
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
