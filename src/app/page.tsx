
"use client"

import { 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Inbox
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

  const recentActivities: any[] = []

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
            {recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Inbox className="w-8 h-8 opacity-20" />
                <p className="text-sm italic">No recent activity found.</p>
              </div>
            ) : (
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
            )}
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
