
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  FileSpreadsheet,
  Menu,
  Sparkles
} from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"
import { useBusinessData } from "@/hooks/use-business-data"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()
  const { toggleSidebar } = useSidebar()
  const { language } = useBusinessData()
  const [mounted, setMounted] = useState(false)

  // Defer rendering until after hydration to prevent HTML mismatch errors
  useEffect(() => {
    setMounted(true)
  }, [])

  if (pathname?.startsWith('/shop/')) return null

  const t = translations[language]

  const navItems = [
    { title: t.dashboard, icon: LayoutDashboard, href: "/" },
    { title: t.sales, icon: ShoppingCart, href: "/sales" },
    { title: t.inventory, icon: Package, href: "/inventory" },
    { title: t.customers, icon: Users, href: "/customers" },
    { title: t.masterLedger, icon: FileSpreadsheet, href: "/reports" },
    { title: language === 'bn' ? 'এআই' : 'AI', icon: Sparkles, href: "/specs-ai" },
  ]

  // Function to check if a link is active, handling trailing slashes from export mode
  const checkActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname === ""
    return pathname === href || pathname === `${href}/` || pathname.startsWith(`${href}/`)
  }

  // Return nothing during SSR to avoid hydration mismatch
  if (!mounted) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-border flex items-center justify-around px-1 md:hidden safe-area-bottom shadow-[0_-2px_15px_rgba(0,0,0,0.1)] print:hidden">
      {navItems.map((item) => {
        const isActive = checkActive(item.href)
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 min-w-0 h-full transition-all duration-300 relative",
              isActive ? "text-accent" : "text-muted-foreground hover:text-primary"
            )}
          >
            <item.icon className={cn("w-5 h-5 transition-transform", isActive && "stroke-[2.5px] scale-110")} />
            <span className={cn(
              "text-[8px] font-bold truncate w-full text-center px-0.5 transition-all",
              isActive ? "opacity-100" : "opacity-70"
            )}>
              {item.title}
            </span>
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-accent rounded-b-full shadow-[0_2px_5px_rgba(0,128,128,0.3)]" />
            )}
          </Link>
        )
      })}
      <button 
        onClick={toggleSidebar}
        className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 h-full text-muted-foreground hover:text-primary transition-all duration-200 active:scale-95"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[8px] font-bold truncate w-full text-center px-0.5">
          {language === 'en' ? 'More' : 'আরো'}
        </span>
      </button>
    </nav>
  )
}
