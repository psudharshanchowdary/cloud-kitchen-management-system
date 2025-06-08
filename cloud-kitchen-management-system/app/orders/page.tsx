"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, CheckCircle, XCircle, TruckIcon, ChefHat, AlertCircle } from "lucide-react"

// Mock data for orders
const initialOrders = [
  {
    id: "ORD-001",
    customer: "Rahul Sharma",
    items: [
      { name: "Butter Chicken", quantity: 1, price: 350 },
      { name: "Naan", quantity: 2, price: 60 },
    ],
    total: 470,
    status: "Pending",
    time: "10:30 AM",
    address: "123 Anna Nagar, Chennai, Tamil Nadu 600040",
    phone: "+91 9876543210",
  },
  {
    id: "ORD-002",
    customer: "Priya Patel",
    items: [
      { name: "Paneer Tikka", quantity: 1, price: 250 },
      { name: "Veg Biryani", quantity: 1, price: 280 },
    ],
    total: 530,
    status: "Preparing",
    time: "11:15 AM",
    address: "456 T. Nagar, Chennai, Tamil Nadu 600017",
    phone: "+91 8765432109",
  },
  {
    id: "ORD-003",
    customer: "Amit Singh",
    items: [
      { name: "Chicken Biryani", quantity: 2, price: 320 },
      { name: "Gulab Jamun", quantity: 4, price: 120 },
    ],
    total: 1120,
    status: "Ready",
    time: "12:00 PM",
    address: "789 Adyar, Chennai, Tamil Nadu 600020",
    phone: "+91 7654321098",
  },
  {
    id: "ORD-004",
    customer: "Sneha Gupta",
    items: [{ name: "Masala Dosa", quantity: 2, price: 180 }],
    total: 360,
    status: "Delivered",
    time: "09:45 AM",
    address: "234 Velachery, Chennai, Tamil Nadu 600042",
    phone: "+91 6543210987",
  },
  {
    id: "ORD-005",
    customer: "Vikram Reddy",
    items: [
      { name: "Veg Biryani", quantity: 1, price: 280 },
      { name: "Paneer Tikka", quantity: 1, price: 250 },
      { name: "Gulab Jamun", quantity: 2, price: 120 },
    ],
    total: 770,
    status: "Cancelled",
    time: "01:30 PM",
    address: "567 Mylapore, Chennai, Tamil Nadu 600004",
    phone: "+91 5432109876",
  },
]

export default function OrdersPage() {
  const [orders, setOrders] = useState(initialOrders)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [activeTab, setActiveTab] = useState("All")

  const filteredOrders = activeTab === "All" ? orders : orders.filter((order) => order.status === activeTab)

  const handleStatusChange = (orderId, newStatus) => {
    setOrders(orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
    setSelectedOrder(null)
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
      case "Delivered":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Delivered
          </Badge>
        )
      case "Cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "Preparing":
        return <ChefHat className="h-5 w-5 text-blue-500" />
      case "Ready":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "Delivered":
        return <TruckIcon className="h-5 w-5 text-purple-500" />
      case "Cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <nav className="flex space-x-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/menu" className="text-gray-600 hover:text-gray-900">
              Menu
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
        </div>

        <Tabs defaultValue="All" className="mb-8" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="All">All Orders</TabsTrigger>
            <TabsTrigger value="Pending">Pending</TabsTrigger>
            <TabsTrigger value="Preparing">Preparing</TabsTrigger>
            <TabsTrigger value="Ready">Ready</TabsTrigger>
            <TabsTrigger value="Delivered">Delivered</TabsTrigger>
            <TabsTrigger value="Cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{order.id}</CardTitle>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-sm text-gray-500">{order.time}</div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <p className="font-medium">{order.customer}</p>
                      <p className="text-sm text-gray-600">{order.phone}</p>
                      <p className="text-sm text-gray-600">{order.address}</p>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Order Items:</p>
                      <ul className="text-sm space-y-1">
                        {order.items.map((item, index) => (
                          <li key={index} className="flex justify-between">
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <span>₹{item.price * item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2 pt-2 border-t flex justify-between font-medium">
                        <span>Total:</span>
                        <span>₹{order.total}</span>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={() => setSelectedOrder(order)} className="flex items-center gap-1">
                        Manage Order
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Order Management Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getStatusIcon(selectedOrder.status)}
                Order {selectedOrder.id}
              </DialogTitle>
              <DialogDescription>Update the status of this order.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="mb-4">
                <p className="font-medium">{selectedOrder.customer}</p>
                <p className="text-sm text-gray-600">{selectedOrder.phone}</p>
                <p className="text-sm text-gray-600">{selectedOrder.address}</p>
              </div>

              <div className="mb-6">
                <Label className="mb-2 block">Current Status: {getStatusBadge(selectedOrder.status)}</Label>
                <Select
                  defaultValue={selectedOrder.status}
                  onValueChange={(value) => handleStatusChange(selectedOrder.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Preparing">Preparing</SelectItem>
                    <SelectItem value="Ready">Ready</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium mb-2">Order Items:</p>
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t flex justify-between font-medium">
                  <span>Total:</span>
                  <span>₹{selectedOrder.total}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
