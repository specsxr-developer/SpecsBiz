
"use client"

import { useState, useEffect } from "react"
import { 
  Globe, 
  Lock, 
  Settings2, 
  Copy, 
  ExternalLink, 
  CheckCircle2, 
  Store,
  Share2,
  AlertCircle,
  Settings,
  X,
  Maximize2,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
  const { shopConfig, actions, language } = useBusinessData()
  const t = translations[language]

  const [shopName, setShopName] = useState("")
  const [accessCode, setAccessCode] = useState("")
  const [isActive, setIsActive] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (shopConfig) {
      setShopName(shopConfig.shopName || "")
      setAccessCode(shopConfig.accessCode || "")
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
      isActive
    })
    toast({ title: "Settings Saved" })
    setRefreshKey(prev => prev + 1) // Refresh iframe preview
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
            <p className="text-[9px] font-bold text-accent uppercase tracking-[0.3em]">Live Digital Catalog Preview</p>
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
                <Settings className="w-5 h-5" /> {language === 'bn' ? 'সেটিংস' : 'Settings'}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[600px] rounded-[2.5rem] p-0 overflow-hidden border-accent/20 shadow-2xl">
              <DialogHeader className="p-6 bg-accent/5 border-b shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl border border-accent/10 shadow-sm"><Settings2 className="w-6 h-6 text-accent" /></div>
                    <div>
                      <DialogTitle className="text-xl font-black text-primary uppercase tracking-tighter">{t.shopSettings}</DialogTitle>
                      <DialogDescription className="text-[10px] font-bold uppercase opacity-60">Manage your online presence</DialogDescription>
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
              
              <div className="p-8 space-y-8 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{t.shopName}</Label>
                    <div className="relative">
                      <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent opacity-40" />
                      <Input 
                        value={shopName} 
                        onChange={e => setShopName(e.target.value)} 
                        placeholder="e.g. Rohim General Store" 
                        className="h-14 pl-12 rounded-2xl bg-muted/20 border-none font-bold text-primary focus-visible:ring-accent"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{t.shopCode}</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent opacity-40" />
                      <Input 
                        value={accessCode} 
                        onChange={e => setAccessCode(e.target.value)} 
                        placeholder="e.g. 1234" 
                        className="h-14 pl-12 rounded-2xl bg-muted/20 border-none font-bold text-primary focus-visible:ring-accent"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-[1.5rem] space-y-4">
                  <div className="flex items-center gap-3">
                    <Share2 className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-xs font-black uppercase text-emerald-900">{t.shareLink}</h4>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-white border border-emerald-200 p-3 rounded-xl truncate text-[10px] font-mono text-emerald-800 shadow-inner">
                      {shopUrl || 'Login required for link'}
                    </div>
                    <Button variant="outline" size="sm" className="bg-white border-emerald-200 text-emerald-700 font-bold rounded-xl" onClick={copyToClipboard} disabled={!user}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handleSave} 
                  disabled={!user}
                  className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 font-black uppercase shadow-xl transition-all active:scale-95 gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> Save Configuration
                </Button>
              </div>
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
                  Open Settings
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
