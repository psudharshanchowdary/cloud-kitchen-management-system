"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts"
import { ArrowUp, DollarSign, ShoppingCart, Users } from "lucide-react"

// Weekly sales data
const weeklySalesData = [
  { name: "Mon", sales: 12000 },
  { name: "Tue", sales: 19000 },
  { name: "Wed", sales: 15000 },
  { name: "Thu", sales: 21000 },
  { name: "Fri", sales: 25000 },
  { name: "Sat", sales: 30000 },
  { name: "Sun", sales: 28000 },
]

// Monthly sales data for the graph
const monthlySalesData = [
  { name: "Jan", sales: 125000 },
  { name: "Feb", sales: 145000 },
  { name: "Mar", sales: 160000 },
  { name: "Apr", sales: 175000 },
  { name: "May", sales: 190000 },
  { name: "Jun", sales: 210000 },
  { name: "Jul", sales: 230000 },
  { name: "Aug", sales: 245000 },
  { name: "Sep", sales: 225000 },
  { name: "Oct", sales: 240000 },
  { name: "Nov", sales: 260000 },
  { name: "Dec", sales: 280000 },
]

// Yearly sales data
const yearlySalesData = [
  { name: "2018", sales: 1200000 },
  { name: "2019", sales: 1500000 },
  { name: "2020", sales: 1350000 },
  { name: "2021", sales: 1800000 },
  { name: "2022", sales: 2100000 },
  { name: "2023", sales: 2400000 },
  { name: "2024", sales: 2700000 },
]

// Mock data for dashboard
const orderData = [
  {
    id: "ORD-001",
    customer: "Rahul Sharma",
    total: 470,
    status: "Delivered",
    time: "10:30 AM",
    address: "123 Anna Nagar, Chennai, Tamil Nadu 600040",
  },
  {
    id: "ORD-002",
    customer: "Priya Patel",
    total: 530,
    status: "Preparing",
    time: "11:15 AM",
    address: "456 T. Nagar, Chennai, Tamil Nadu 600017",
  },
  {
    id: "ORD-003",
    customer: "Amit Singh",
    total: 1120,
    status: "Ready",
    time: "12:00 PM",
    address: "789 Adyar, Chennai, Tamil Nadu 600020",
  },
  {
    id: "ORD-004",
    customer: "Sneha Gupta",
    total: 360,
    status: "Delivered",
    time: "09:45 AM",
    address: "234 Velachery, Chennai, Tamil Nadu 600042",
  },
  {
    id: "ORD-005",
    customer: "Vikram Reddy",
    total: 770,
    status: "Cancelled",
    time: "01:30 PM",
    address: "567 Mylapore, Chennai, Tamil Nadu 600004",
  },
  {
    id: "ORD-006",
    customer: "Kavita Menon",
    total: 890,
    status: "Delivered",
    time: "02:15 PM",
    address: "890 Besant Nagar, Chennai, Tamil Nadu 600090",
  },
  {
    id: "ORD-007",
    customer: "Rajesh Kumar",
    total: 650,
    status: "Preparing",
    time: "03:30 PM",
    address: "321 Nungambakkam, Chennai, Tamil Nadu 600034",
  },
]

const categoryData = [
  { name: "Main Course", value: 45 },
  { name: "Starters", value: 20 },
  { name: "Rice", value: 15 },
  { name: "Desserts", value: 10 },
  { name: "Breakfast", value: 10 },
]

const COLORS = ["#8884d8", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function DashboardPage() {
  const [recentOrders, setRecentOrders] = useState(orderData)
  const [timeRange, setTimeRange] = useState("month")

  // Get the appropriate data based on the selected time range
  const getChartData = () => {
    switch (timeRange) {
      case "week":
        return weeklySalesData
      case "month":
        return monthlySalesData
      case "year":
        return yearlySalesData
      default:
        return monthlySalesData
    }
  }

  // Calculate summary stats based on the selected time range
  const getSummaryStats = () => {
    const data = getChartData()
    const totalSales = data.reduce((sum, item) => sum + item.sales, 0)
    const totalOrders = orderData.length
    const averageOrderValue = Math.round(totalSales / totalOrders)
    const pendingOrders = orderData.filter((order) => order.status === "Pending" || order.status === "Preparing").length
    const totalCustomers = [...new Set(orderData.map((order) => order.customer))].length

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      pendingOrders,
      totalCustomers,
    }
  }

  const stats = getSummaryStats()

  // Get the appropriate chart component based on the selected time range
  const renderChart = () => {
    const data = getChartData()

    switch (timeRange) {
      case "week":
        return (
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Sales"]} />
            <Legend />
            <Bar dataKey="sales" fill="#8884d8" name="Weekly Sales" />
          </BarChart>
        )
      case "month":
        return (
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Sales"]} />
            <Legend />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
              strokeWidth={2}
              name="Monthly Sales"
            />
          </LineChart>
        )
      case "year":
        return (
          <AreaChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Sales"]} />
            <Legend />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.3}
              name="Yearly Sales"
            />
          </AreaChart>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 pb-10">
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <nav className="flex space-x-4">
            <Link href="/" className="text-white hover:text-pink-200">
              Home
            </Link>
            <Link href="/menu" className="text-white hover:text-pink-200">
              Menu
            </Link>
            <Link href="/orders" className="text-white hover:text-pink-200">
              Orders
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-t-4 border-purple-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalSales.toLocaleString()}</div>
              <p className="text-xs text-green-500 flex items-center mt-1">
                <ArrowUp className="h-3 w-3 mr-1" />
                12% from last {timeRange}
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-pink-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-green-500 flex items-center mt-1">
                <ArrowUp className="h-3 w-3 mr-1" />
                8% from last {timeRange}
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-indigo-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              <DollarSign className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.averageOrderValue.toLocaleString()}</div>
              <p className="text-xs text-green-500 flex items-center mt-1">
                <ArrowUp className="h-3 w-3 mr-1" />
                3% from last {timeRange}
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-teal-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-green-500 flex items-center mt-1">
                <ArrowUp className="h-3 w-3 mr-1" />5 new this {timeRange}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 border-t-4 border-purple-500 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {timeRange === "week"
                    ? "Weekly Sales Overview"
                    : timeRange === "month"
                      ? "Monthly Sales Overview"
                      : "Yearly Sales Overview"}
                </CardTitle>
                <Tabs defaultValue="month" value={timeRange} onValueChange={setTimeRange}>
                  <TabsList className="bg-purple-100">
                    <TabsTrigger
                      value="week"
                      className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                    >
                      Week
                    </TabsTrigger>
                    <TabsTrigger
                      value="month"
                      className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                    >
                      Month
                    </TabsTrigger>
                    <TabsTrigger
                      value="year"
                      className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                    >
                      Year
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <CardDescription>
                {timeRange === "week"
                  ? "Daily sales for the current week"
                  : timeRange === "month"
                    ? "Monthly sales for the current year"
                    : "Annual sales over the past 7 years"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart()}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-pink-500 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
              <CardDescription>Distribution of sales across menu categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-t-4 border-indigo-500 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest orders from customers in Chennai</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-medium p-2">Order ID</th>
                    <th className="text-left font-medium p-2">Customer</th>
                    <th className="text-left font-medium p-2">Time</th>
                    <th className="text-left font-medium p-2">Amount</th>
                    <th className="text-left font-medium p-2">Status</th>
                    <th className="text-left font-medium p-2">Address</th>
                    <th className="text-left font-medium p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b">
                      <td className="p-2">{order.id}</td>
                      <td className="p-2">{order.customer}</td>
                      <td className="p-2">{order.time}</td>
                      <td className="p-2">₹{order.total}</td>
                      <td className="p-2">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs ${
                            order.status === "Delivered"
                              ? "bg-green-100 text-green-800"
                              : order.status === "Preparing"
                                ? "bg-blue-100 text-blue-800"
                                : order.status === "Ready"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : order.status === "Cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="p-2 max-w-xs truncate">{order.address}</td>
                      <td className="p-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/orders?id=${order.id}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
