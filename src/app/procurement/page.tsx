
"use client"

import { useState, useMemo } from "react"
import { 
  PackageSearch, 
  Search, 
  Calendar, 
  DollarSign, 
  Package, 
  TrendingDown, 
  Inbox,
  ArrowUpRight,
  RefreshCw,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { useBusinessData } from "@/hooks/use-business-data"
import { useToast } from "@/hooks/use-toast"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"

export default function ProcurementPage() {
  const { procurements, products, currency, isLoading, language, actions } = useBusinessData()
  const { toast } = useToast()
  const t = translations[language]
  
  const [search, setSearch] = useState("")
  const [isSyncing, setIsSyncing] = useState(false)

  const totalSpent = useMemo(() => {
    return procurements.reduce((acc, p) => acc + (p.totalCost || 0), 0)
  }, [procurements])

  const filteredProc = useMemo(() => {
    return procurements.filter(p => 
      p.productName.toLowerCase().includes(search.toLowerCase())
    )
  }, [procurements, search])

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await actions.syncInventoryToProcurement();
      toast({ title: language === 'en' ? "Sync Success" : "ইনভেন্টরি থেকে তথ্য আনা হয়েছে" });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsSyncing(false)
    }
  }

  if (isLoading) return <div className="p-10 text-center animate-pulse text-accent font-bold">{t.loading}</div>

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-headline text-primary flex items-center gap-2">
            <PackageSearch className="w-5 h-5 md:w-6 md:h-6 text-accent" /> {t.stockEntryHistory}
          </h2>
          <p className="text-[10px] md:text-sm text-muted-foreground">{t.procurementDesc}</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-accent/5 border-accent/20 text-accent hover:bg-accent hover:text-white transition-all h-9 md:h-10 text-[10px] font-black uppercase tracking-tighter"
          onClick={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-2" />}
          {language === 'en' ? 'Sync Inventory' : 'ইনভেন্টরি থেকে তথ্য আনুন'}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 px-1">
        <Card className="bg-primary text-white p-3 md:p-4 overflow-hidden relative group rounded-2xl shadow-lg border-none">
          <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform">
            <DollarSign className="w-12 h-12 md:w-20 md:h-20" />
          </div>
          <p className="text-[8px] md:text-[9px] uppercase font-bold opacity-70 tracking-widest leading-none">{t.totalProcurementCost}</p>
          <div className="text-lg md:text-2xl font-black truncate mt-1">{currency}{totalSpent.toLocaleString()}</div>
        </Card>
        <Card className="bg-accent text-white p-3 md:p-4 overflow-hidden relative group rounded-2xl shadow-lg border-none">
          <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform">
            <Package className="w-12 h-12 md:w-20 md:h-20" />
          </div>
          <p className="text-[8px] md:text-[9px] uppercase font-bold opacity-70 tracking-widest leading-none">Total Records</p>
          <div className="text-lg md:text-2xl font-black truncate mt-1">{procurements.length}</div>
        </Card>
      </div>

      <Card className="border-accent/10 shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm rounded-3xl mx-1">
        <CardHeader className="p-3 md:p-4 border-b bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder={t.search} 
              className="pl-9 h-10 md:h-12 bg-white border-accent/10 shadow-inner focus-visible:ring-accent text-xs md:text-sm rounded-xl" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredProc.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Inbox className="w-10 h-10 md:w-14 md:h-14 opacity-10" />
              <div className="text-center">
                <p className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-30">{t.noData}</p>
                <p className="text-[9px] md:text-[10px] opacity-20 italic mt-1 max-w-[200px] mx-auto">Click 'Sync Inventory' to import your existing stock.</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <div className="min-w-[600px]">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="pl-4 py-2 font-black text-primary uppercase text-[9px] md:text-[10px] tracking-widest">{t.date}</TableHead>
                      <TableHead className="font-black text-primary uppercase text-[9px] md:text-[10px] tracking-widest">{t.productBought}</TableHead>
                      <TableHead className="font-black text-primary uppercase text-[9px] md:text-[10px] tracking-widest">{t.buyQty}</TableHead>
                      <TableHead className="font-black text-primary uppercase text-[9px] md:text-[10px] tracking-widest">{t.buyPrice}</TableHead>
                      <TableHead className="text-right pr-4 font-black text-primary uppercase text-[9px] md:text-[10px] tracking-widest">{t.totalCostSpent}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProc.map((p) => (
                      <TableRow key={p.id} className="hover:bg-accent/5 transition-all group">
                        <TableCell className="pl-4 py-3 text-[9px] font-bold text-muted-foreground">
                          {new Date(p.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-black text-primary group-hover:text-accent transition-colors text-xs">
                          {p.productName}
                          <div className="text-[8px] font-bold opacity-40 uppercase tracking-tighter mt-0.5">{p.type || 'restock'}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-black text-[9px] h-5 px-1.5">{p.quantity}</Badge>
                        </TableCell>
                        <TableCell className="text-[9px] font-black text-muted-foreground/60">
                          {currency}{p.buyPrice?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <span className="font-black text-primary text-xs">
                            {currency}{p.totalCost?.toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
