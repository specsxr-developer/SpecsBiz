"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  FileSpreadsheet,
  Menu
} from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"
import { useBusinessData } from "@/hooks/use-business-data"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()
  const { toggleSidebar } = useSidebar()
  const { language } = useBusinessData()
  const t = translations[language]

  const navItems = [
    { title: t.dashboard, icon: LayoutDashboard, href: "/" },
    { title: t.sales, icon: ShoppingCart, href: "/sales" },
    { title: t.inventory, icon: Package, href: "/inventory" },
    { title: t.customers, icon: Users, href: "/customers" },
    { title: t.masterLedger, icon: FileSpreadsheet, href: "/reports" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-border flex items-center justify-around px-2 md:hidden safe-area-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.05)] print:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 min-w-0 h-full transition-all duration-200",
              isActive ? "text-accent scale-105" : "text-muted-foreground hover:text-primary"
            )}
          >
            <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
            <span className="text-[9px] font-bold truncate w-full text-center px-1">
              {item.title}
            </span>
          </Link>
        )
      })}
      <button 
        onClick={toggleSidebar}
        className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 h-full text-muted-foreground hover:text-primary transition-all duration-200 active:scale-95"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[9px] font-bold truncate w-full text-center px-1">
          {language === 'en' ? 'More' : 'আরো'}
        </span>
      </button>
    </nav>
  )
}
