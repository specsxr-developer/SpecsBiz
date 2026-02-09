
"use client"

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
  Store,
  LogIn,
  ShieldCheck,
  FileSpreadsheet
} from "lucide-react"
import { useUser } from "@/firebase"

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

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/" },
  { title: "Inventory", icon: Package, href: "/inventory" },
  { title: "Sales", icon: ShoppingCart, href: "/sales" },
  { title: "Customers", icon: Users, href: "/customers" },
  { title: "Master Ledger", icon: FileSpreadsheet, href: "/reports" },
  { title: "Analytics", icon: BarChart3, href: "/analytics" },
  { title: "AI Assistant", icon: Bot, href: "/ai-assistant" },
]

export function NavMain() {
  const pathname = usePathname()
  const { user } = useUser()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-sidebar-primary p-1.5 rounded-lg">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className="font-headline font-bold text-lg group-data-[collapsible=icon]:hidden">SpecsBiz</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 group-data-[collapsible=icon]:hidden">Management</SidebarGroupLabel>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.href}
                  tooltip={item.title}
                  className="px-4"
                >
                  <Link href={item.href}>
                    <item.icon className="w-5 h-5" />
                    <span className="font-body">{item.title}</span>
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
            <SidebarMenuButton asChild tooltip="Cloud Sync" className={`px-4 ${user ? 'text-green-600' : 'text-orange-500'}`}>
              <Link href="/auth">
                {user ? <ShieldCheck className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                <span className="font-body">{user ? 'Cloud Active' : 'Offline Mode'}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/settings'} tooltip="Settings" className="px-4">
              <Link href="/settings">
                <Settings className="w-5 h-5" />
                <span className="font-body">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
