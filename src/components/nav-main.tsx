"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Bot, 
  Settings,
  LogIn,
  ShieldCheck,
  FileSpreadsheet,
  PieChart,
  BookOpen
} from "lucide-react"
import { useUser } from "@/firebase"
import { useBusinessData } from "@/hooks/use-business-data"
import { translations } from "@/lib/translations"
import { PlaceHolderImages } from "@/lib/placeholder-images"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarFooter,
} from "@/components/ui/sidebar"

export function NavMain() {
  const pathname = usePathname()
  const { user } = useUser()
  const { language } = useBusinessData()
  const [mounted, setMounted] = useState(false)
  
  // Hydration guard: ensures component only renders dynamic content after client mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const t = translations[language]
  const logoUrl = PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl

  const menuItems = [
    { title: t.dashboard, icon: LayoutDashboard, href: "/" },
    { title: t.inventory, icon: Package, href: "/inventory" },
    { title: t.sales, icon: ShoppingCart, href: "/sales" },
    { title: t.customers, icon: Users, href: "/customers" },
    { title: t.notebook, icon: BookOpen, href: "/notebook" },
    { title: t.masterLedger, icon: FileSpreadsheet, href: "/reports" },
    { title: t.biAnalytics, icon: PieChart, href: "/business-intelligence" },
    { title: t.analytics, icon: BarChart3, href: "/analytics" },
    { title: t.aiAssistant, icon: Bot, href: "/ai-assistant" },
  ]

  // Helper to check active path with trailing slash support
  const checkActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname === ""
    return pathname === href || pathname === `${href}/` || pathname.startsWith(`${href}/`)
  }

  // If not mounted, we render a simplified version to match server output exactly
  if (!mounted) {
    return (
      <Sidebar collapsible="icon">
        <SidebarHeader className="h-20 flex items-center px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="bg-sidebar-primary/10 p-1 rounded-lg overflow-hidden shrink-0">
              <Bot className="w-8 h-8 text-sidebar-primary" />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="font-headline font-bold text-xl text-sidebar-foreground leading-none">SpecsBiz</span>
              <span className="text-[10px] opacity-60 font-medium mt-0.5">by SpecsXR</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent />
      </Sidebar>
    )
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-20 flex items-center px-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-sidebar-primary/10 p-1 rounded-lg overflow-hidden shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
            ) : (
              <Bot className="w-8 h-8 text-sidebar-primary" />
            )}
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-headline font-bold text-xl text-sidebar-foreground leading-none">SpecsBiz</span>
            <span className="text-[10px] opacity-60 font-medium mt-0.5">by SpecsXR</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 group-data-[collapsible=icon]:hidden">{t.management}</SidebarGroupLabel>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={checkActive(item.href)}
                  tooltip={item.title}
                  className="px-4 h-11"
                >
                  <Link href={item.href}>
                    <item.icon className="w-5 h-5" />
                    <span className="font-body font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t.cloudSync} className={`px-4 h-11 ${user ? 'text-green-500 font-bold' : 'text-orange-500 font-bold'}`}>
              <Link href="/auth">
                {user ? <ShieldCheck className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                <span className="font-body">{user ? t.cloudSync : t.offlineMode}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={checkActive('/settings')} tooltip={t.settings} className="px-4 h-11">
              <Link href="/settings">
                <Settings className="w-5 h-5" />
                <span className="font-body">{t.settings}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
