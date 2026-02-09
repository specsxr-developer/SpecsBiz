"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Bell, AlertTriangle, Package, Users, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useBusinessData } from "@/hooks/use-business-data"
import { cn } from "@/lib/utils"

/**
 * @fileOverview A real-time notification bell component that derives alerts from business data.
 * Updated with larger size and 'mark as read' functionality.
 */
export function NotificationBell() {
  const { products, customers, sales, language, currency } = useBusinessData()
  const [mounted, setMounted] = useState(false)
  const [hasUnseen, setHasUnread] = useState(false)
  const prevAlertsCount = useRef(0)

  // Hydration safety
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const alerts = useMemo(() => {
    const list: any[] = []
    
    // 1. Low Stock Alerts
    products.forEach(p => {
      if (p.stock <= 0) {
        list.push({
          id: `stock-out-${p.id}`,
          title: language === 'en' ? 'Out of Stock' : 'স্টক শেষ',
          description: language === 'en' 
            ? `${p.name} is completely out of stock!` 
            : `${p.name}-এর স্টক একদম শেষ!`,
          type: 'danger',
          icon: Package
        })
      } else if (p.stock < 5) {
        list.push({
          id: `stock-low-${p.id}`,
          title: language === 'en' ? 'Low Stock Alert' : 'স্টক কম',
          description: language === 'en'
            ? `${p.name} has only ${p.stock} units left.`
            : `${p.name}-এর স্টক মাত্র ${p.stock}টি আছে।`,
          type: 'warning',
          icon: AlertTriangle
        })
      }
    })

    // 2. High Value Debtors (High Due)
    customers.forEach(c => {
      if (c.totalDue > 10000) {
        list.push({
          id: `debt-high-${c.id}`,
          title: language === 'en' ? 'High Outstanding' : 'বড় বকেয়া',
          description: language === 'en'
            ? `${c.firstName} owes ${currency}${c.totalDue.toLocaleString()}.`
            : `${c.firstName}-এর কাছে ${currency}${c.totalDue.toLocaleString()} বকেয়া আছে।`,
          type: 'info',
          icon: Users
        })
      }
    })

    // 3. Today's Revenue Summary (Report Alert)
    const today = new Date().toDateString()
    const todaySales = sales.filter(s => new Date(s.saleDate).toDateString() === today)
    
    if (todaySales.length > 0) {
      const totalRev = todaySales.reduce((acc, s) => acc + (s.total || 0), 0)
      list.unshift({
        id: 'daily-summary',
        title: language === 'en' ? "Today's Progress" : 'আজকের রিপোর্ট',
        description: language === 'en'
          ? `Total revenue today: ${currency}${totalRev.toLocaleString()}`
          : `আজকে মোট আয় হয়েছে: ${currency}${totalRev.toLocaleString()}`,
        type: 'success',
        icon: Receipt
      })
    }

    return list
  }, [products, customers, sales, language, currency])

  // Detect new alerts to show red dot
  useEffect(() => {
    if (alerts.length > prevAlertsCount.current) {
      setHasUnread(true)
    }
    prevAlertsCount.current = alerts.length
  }, [alerts.length])

  if (!mounted) return <Button variant="ghost" size="icon" className="h-12 w-12"><Bell className="h-6 w-6 opacity-20" /></Button>

  const unreadCount = alerts.length

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setHasUnread(false) // Hide red dot when opened
    }
  }

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-full hover:bg-accent/10 transition-colors shrink-0">
          <Bell className={cn("h-6 w-6 text-primary", hasUnseen && unreadCount > 0 && "animate-tada")} />
          {hasUnseen && unreadCount > 0 && (
            <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white ring-2 ring-white shadow-md animate-in zoom-in duration-300">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 shadow-2xl border-accent/20 overflow-hidden" align="end" sideOffset={10}>
        <div className="flex items-center justify-between border-b p-4 bg-accent/5">
          <div>
            <h3 className="font-black text-sm text-primary uppercase tracking-tight">
              {language === 'en' ? 'SpecsBiz Intelligence' : 'বিজনেস এলার্ট সেন্টার'}
            </h3>
            <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase opacity-60">Live Monitoring</p>
          </div>
          <Badge className="bg-accent text-white border-none text-[10px] h-5">
            {unreadCount} {language === 'en' ? 'Alerts' : 'টি মেসেজ'}
          </Badge>
        </div>
        
        <ScrollArea className="h-[380px]">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground opacity-30 text-center">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Bell className="h-8 w-8" />
              </div>
              <p className="text-sm font-bold">{language === 'en' ? 'System Stable' : 'ব্যবসা স্থিতিশীল আছে'}</p>
              <p className="text-[10px] uppercase tracking-widest mt-1">No active risks detected</p>
            </div>
          ) : (
            <div className="divide-y divide-accent/5">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex gap-4 p-4 hover:bg-muted/30 transition-all group cursor-pointer relative overflow-hidden">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110",
                    alert.type === 'danger' ? "bg-red-50 text-red-600 border border-red-100" :
                    alert.type === 'warning' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                    alert.type === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                    "bg-blue-50 text-blue-600 border border-blue-100"
                  )}>
                    <alert.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start mb-0.5">
                      <p className="text-xs font-black text-primary truncate leading-none pt-1">{alert.title}</p>
                      <span className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-tighter">Live</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 mt-1">{alert.description}</p>
                  </div>
                  {alert.type === 'danger' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="border-t p-3 bg-muted/20 text-center">
           <button className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline transition-all">
             {language === 'en' ? 'All Seen' : 'সব দেখা হয়েছে'}
           </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
