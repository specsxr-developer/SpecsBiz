
"use client"

import { useState } from "react"
import { 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Inbox,
  Plus,
  ShoppingCart,
  UserPlus,
  Zap
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const { toast } = useToast()
  const [quickSale, setQuickSale] = useState({ productName: "", quantity: "", price: "" })
  const [quickInventory, setQuickInventory] = useState({ name: "", stock: "", unit: "pcs" })
  const [quickCustomer, setQuickCustomer] = useState({ name: "", phone: "" })

  const stats = [
    { 
      label: "Total Revenue", 
      value: "$0", 
      change: "0%", 
      trend: "up", 
      icon: DollarSign, 
      color: "text-green-600" 
    },
    { 
      label: "Inventory Items", 
      value: "0", 
      change: "0%", 
      trend: "up", 
      icon: Package, 
      color: "text-blue-600" 
    },
    { 
      label: "Active Customers", 
      value: "0", 
      change: "0%", 
      trend: "up", 
      icon: Users, 
      color: "text-purple-600" 
    },
    { 
      label: "Sales Count", 
      value: "0", 
      change: "0%", 
      trend: "up", 
      icon: TrendingUp, 
      color: "text-teal-600" 
    },
  ]

  const handleQuickSale = () => {
    if (!quickSale.productName || !quickSale.quantity) return
    toast({
      title: "Quick Sale Recorded",
      description: `Sold ${quickSale.quantity} units of ${quickSale.productName}.`,
    })
    setQuickSale({ productName: "", quantity: "", price: "" })
  }

  const handleQuickInventory = () => {
    if (!quickInventory.name || !quickInventory.stock) return
    toast({
      title: "Inventory Updated",
      description: `Added ${quickInventory.stock} ${quickInventory.unit} of ${quickInventory.name}.`,
    })
    setQuickInventory({ name: "", stock: "", unit: "pcs" })
  }

  const handleQuickCustomer = () => {
    if (!quickCustomer.name || !quickCustomer.phone) return
    toast({
      title: "Customer Registered",
      description: `${quickCustomer.name} has been added to your business database.`,
    })
    setQuickCustomer({ name: "", phone: "" })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Quick Entry System */}
      <Card className="border-accent/30 bg-accent/5 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent animate-pulse" />
            <CardTitle className="text-lg">Quick Entry System</CardTitle>
          </div>
          <CardDescription>Rapidly add data without leaving the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sale" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="sale" className="gap-2">
                <ShoppingCart className="w-4 h-4" /> Quick Sale
              </TabsTrigger>
              <TabsTrigger value="inventory" className="gap-2">
                <Package className="w-4 h-4" /> Add Stock
              </TabsTrigger>
              <TabsTrigger value="customer" className="gap-2">
                <UserPlus className="w-4 h-4" /> New Customer
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="sale" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="q-product">Product Name</Label>
                  <Input 
                    id="q-product" 
                    placeholder="e.g. Rice, Frames..." 
                    value={quickSale.productName}
                    onChange={e => setQuickSale({...quickSale, productName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q-qty">Quantity</Label>
                  <Input 
                    id="q-qty" 
                    type="number" 
                    placeholder="0.00" 
                    value={quickSale.quantity}
                    onChange={e => setQuickSale({...quickSale, quantity: e.target.value})}
                  />
                </div>
                <div className="flex items-end">
                  <Button className="w-full bg-accent" onClick={handleQuickSale}>
                    Complete Quick Sale
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="i-name">Product Name</Label>
                  <Input 
                    id="i-name" 
                    placeholder="New item name" 
                    value={quickInventory.name}
                    onChange={e => setQuickInventory({...quickInventory, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="i-stock">Stock Amount</Label>
                  <Input 
                    id="i-stock" 
                    type="number" 
                    placeholder="0" 
                    value={quickInventory.stock}
                    onChange={e => setQuickInventory({...quickInventory, stock: e.target.value})}
                  />
                </div>
                <div className="flex items-end">
                  <Button className="w-full bg-primary" onClick={handleQuickInventory}>
                    <Plus className="w-4 h-4 mr-2" /> Add to Inventory
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="customer" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="c-name">Customer Name</Label>
                  <Input 
                    id="c-name" 
                    placeholder="Full Name" 
                    value={quickCustomer.name}
                    onChange={e => setQuickCustomer({...quickCustomer, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-phone">Phone Number</Label>
                  <Input 
                    id="c-phone" 
                    placeholder="+880..." 
                    value={quickCustomer.phone}
                    onChange={e => setQuickCustomer({...quickCustomer, phone: e.target.value})}
                  />
                </div>
                <div className="flex items-end">
                  <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={handleQuickCustomer}>
                    <UserPlus className="w-4 h-4 mr-2" /> Register Customer
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                )}
                <span className={stat.trend === "up" ? "text-green-600" : "text-red-600"}>{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Review your latest business transactions.</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="text-accent border-accent">View All</Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Inbox className="w-8 h-8 opacity-20" />
              <p className="text-sm italic">No recent activity found.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Inventory Alerts</CardTitle>
            <CardDescription>Low stock items requiring attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground italic text-center py-4">No low stock alerts at this time.</p>
            </div>
            <Button className="w-full mt-6 bg-accent hover:bg-accent/90" disabled>Restock Now</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
