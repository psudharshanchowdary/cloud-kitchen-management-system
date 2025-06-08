"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, CheckCircle, ChefHat, AlertCircle } from "lucide-react"

// Mock data for kitchen orders
const initialOrders = [
  {
    id: "ORD-001",
    customer: "Rahul Sharma",
    items: [
      { name: "Butter Chicken", quantity: 1, status: "Cooking", estimatedTime: 15 },
      { name: "Naan", quantity: 2, status: "Pending", estimatedTime: 5 },
    ],
    priority: "Normal",
    orderTime: "10:30 AM",
    status: "Preparing",
    address: "123 Anna Nagar, Chennai, Tamil Nadu 600040",
  },
  {
    id: "ORD-002",
    customer: "Priya Patel",
    items: [
      { name: "Paneer Tikka", quantity: 1, status: "Ready", estimatedTime: 0 },
      { name: "Veg Biryani", quantity: 1, status: "Cooking", estimatedTime: 10 },
    ],
    priority: "High",
    orderTime: "11:15 AM",
    status: "Preparing",
    address: "456 T. Nagar, Chennai, Tamil Nadu 600017",
  },
  {
    id: "ORD-003",
    customer: "Amit Singh",
    items: [
      { name: "Chicken Biryani", quantity: 2, status: "Pending", estimatedTime: 20 },
      { name: "Gulab Jamun", quantity: 4, status: "Pending", estimatedTime: 5 },
    ],
    priority: "Normal",
    orderTime: "12:00 PM",
    status: "Pending",
    address: "789 Adyar, Chennai, Tamil Nadu 600020",
  },
  {
    id: "ORD-004",
    customer: "Sneha Gupta",
    items: [{ name: "Masala Dosa", quantity: 2, status: "Ready", estimatedTime: 0 }],
    priority: "Low",
    orderTime: "09:45 AM",
    status: "Ready",
    address: "234 Velachery, Chennai, Tamil Nadu 600042",
  },
  {
    id: "ORD-005",
    customer: "Vikram Reddy",
    items: [
      { name: "Veg Biryani", quantity: 1, status: "Cooking", estimatedTime: 8 },
      { name: "Paneer Tikka", quantity: 1, status: "Cooking", estimatedTime: 5 },
      { name: "Gulab Jamun", quantity: 2, status: "Pending", estimatedTime: 5 },
    ],
    priority: "High",
    orderTime: "01:30 PM",
    status: "Preparing",
    address: "567 Mylapore, Chennai, Tamil Nadu 600004",
  },
]

export default function KitchenPage() {
  const [orders, setOrders] = useState(initialOrders)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [activeTab, setActiveTab] = useState("All")

  const filteredOrders = activeTab === "All" ? orders : orders.filter((order) => order.status === activeTab)

  const handleItemStatusChange = (orderId, itemName, newStatus) => {
    setOrders(
      orders.map((order) => {
        if (order.id === orderId) {
          const updatedItems = order.items.map((item) => {
            if (item.name === itemName) {
              return { ...item, status: newStatus, estimatedTime: newStatus === "Ready" ? 0 : item.estimatedTime }
            }
            return item
          })

          // Update order status based on items
          let newOrderStatus = order.status
          const allReady = updatedItems.every((item) => item.status === "Ready")
          const anyPending = updatedItems.some((item) => item.status === "Pending")
          const anyCooking = updatedItems.some((item) => item.status === "Cooking")

          if (allReady) {
            newOrderStatus = "Ready"
          } else if (anyCooking) {
            newOrderStatus = "Preparing"
          } else if (anyPending) {
            newOrderStatus = "Pending"
          }

          return { ...order, items: updatedItems, status: newOrderStatus }
        }
        return order
      }),
    )
  }

  const handleOrderPriorityChange = (orderId, newPriority) => {
    setOrders(orders.map((order) => (order.id === orderId ? { ...order, priority: newPriority } : order)))
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        )
      case "Preparing":
      case "Cooking":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Preparing
          </Badge>
        )
      case "Ready":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Ready
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "High":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            High
          </Badge>
        )
      case "Normal":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Normal
          </Badge>
        )
      case "Low":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Low
          </Badge>
        )
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const getItemStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        )
      case "Cooking":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <ChefHat className="h-3 w-3" /> Cooking
          </Badge>
        )
      case "Ready":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Ready
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {status}
          </Badge>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Kitchen Dashboard</h1>
          <nav className="flex space-x-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/orders" className="text-gray-600 hover:text-gray-900">
              Orders
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Kitchen Orders</h2>
        </div>

        <Tabs defaultValue="All" className="mb-8" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="All">All Orders</TabsTrigger>
            <TabsTrigger value="Pending">Pending</TabsTrigger>
            <TabsTrigger value="Preparing">Preparing</TabsTrigger>
            <TabsTrigger value="Ready">Ready</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.map((order) => (
                <Card
                  key={order.id}
                  className={`overflow-hidden ${
                    order.priority === "High"
                      ? "border-red-300"
                      : order.priority === "Normal"
                        ? "border-blue-300"
                        : "border-green-300"
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{order.id}</CardTitle>
                      <div className="flex space-x-2">
                        {getPriorityBadge(order.priority)}
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{order.customer}</span>
                      <span>{order.orderTime}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      <span>{order.address}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Order Items:</p>
                      <ul className="space-y-3">
                        {order.items.map((item, index) => (
                          <li key={index} className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">
                                {item.quantity}x {item.name}
                              </span>
                              <div className="flex items-center mt-1">
                                {getItemStatusBadge(item.status)}
                                {item.estimatedTime > 0 && (
                                  <span className="text-xs text-gray-500 ml-2">~{item.estimatedTime} min</span>
                                )}
                              </div>
                            </div>
                            <Select
                              defaultValue={item.status}
                              onValueChange={(value) => handleItemStatusChange(order.id, item.name, value)}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Cooking">Cooking</SelectItem>
                                <SelectItem value="Ready">Ready</SelectItem>
                              </SelectContent>
                            </Select>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm font-medium">Priority:</span>
                      <Select
                        defaultValue={order.priority}
                        onValueChange={(value) => handleOrderPriorityChange(order.id, value)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Normal">Normal</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
