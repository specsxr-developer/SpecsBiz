"use client"

import { 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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

export default function DashboardPage() {
  const stats = [
    { 
      label: "Total Revenue", 
      value: "$24,560", 
      change: "+12.5%", 
      trend: "up", 
      icon: DollarSign, 
      color: "text-green-600" 
    },
    { 
      label: "Inventory Items", 
      value: "1,240", 
      change: "-2.4%", 
      trend: "down", 
      icon: Package, 
      color: "text-blue-600" 
    },
    { 
      label: "Active Customers", 
      value: "842", 
      change: "+4.1%", 
      trend: "up", 
      icon: Users, 
      color: "text-purple-600" 
    },
    { 
      label: "Sales Count", 
      value: "156", 
      change: "+18.2%", 
      trend: "up", 
      icon: TrendingUp, 
      color: "text-teal-600" 
    },
  ]

  const recentActivities = [
    { id: 1, action: "New Sale", item: "Blue Light Glasses", amount: "$45.00", time: "2 mins ago", status: "completed" },
    { id: 2, action: "Stock Alert", item: "Ray-Ban Case", amount: "5 Left", time: "15 mins ago", status: "warning" },
    { id: 3, action: "New Customer", item: "Sarah Jenkins", amount: "-", time: "1 hour ago", status: "completed" },
    { id: 4, action: "Refund", item: "Aviator Gold", amount: "$120.00", time: "3 hours ago", status: "refunded" },
    { id: 5, action: "Restock", item: "Reading Glasses x50", amount: "-", time: "5 hours ago", status: "completed" },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Item/User</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {activity.status === "completed" && <div className="w-2 h-2 rounded-full bg-green-500" />}
                        {activity.status === "warning" && <div className="w-2 h-2 rounded-full bg-yellow-500" />}
                        {activity.status === "refunded" && <div className="w-2 h-2 rounded-full bg-red-500" />}
                        {activity.action}
                      </div>
                    </TableCell>
                    <TableCell>{activity.item}</TableCell>
                    <TableCell className="text-muted-foreground text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {activity.time}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{activity.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Inventory Alerts</CardTitle>
            <CardDescription>Low stock items requiring attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Polarized Lenses", stock: 2, category: "Components" },
                { name: "Cleaning Solution", stock: 0, category: "Accessories" },
                { name: "Frame Screws M2", stock: 12, category: "Hardware" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <Badge variant={item.stock === 0 ? "destructive" : "secondary"} className="bg-teal/10 text-teal border-teal/20">
                    {item.stock} left
                  </Badge>
                </div>
              ))}
            </div>
            <Button className="w-full mt-6 bg-accent hover:bg-accent/90">Restock Now</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}