"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PlusCircle, Edit, Trash2, AlertTriangle } from "lucide-react"

// Mock data for inventory items
const initialInventoryItems = [
  {
    id: 1,
    name: "Chicken",
    category: "Meat",
    quantity: 25,
    unit: "kg",
    minLevel: 10,
    price: 320,
    supplier: "Fresh Foods Ltd.",
  },
  {
    id: 2,
    name: "Rice",
    category: "Grains",
    quantity: 50,
    unit: "kg",
    minLevel: 20,
    price: 85,
    supplier: "Grain Suppliers Inc.",
  },
  {
    id: 3,
    name: "Tomatoes",
    category: "Vegetables",
    quantity: 15,
    unit: "kg",
    minLevel: 8,
    price: 60,
    supplier: "Fresh Farms",
  },
  {
    id: 4,
    name: "Paneer",
    category: "Dairy",
    quantity: 8,
    unit: "kg",
    minLevel: 5,
    price: 280,
    supplier: "Dairy Fresh",
  },
  {
    id: 5,
    name: "Cooking Oil",
    category: "Oils",
    quantity: 30,
    unit: "liter",
    minLevel: 10,
    price: 120,
    supplier: "Kitchen Essentials",
  },
  {
    id: 6,
    name: "Flour",
    category: "Baking",
    quantity: 40,
    unit: "kg",
    minLevel: 15,
    price: 45,
    supplier: "Baking Supplies Co.",
  },
  {
    id: 7,
    name: "Onions",
    category: "Vegetables",
    quantity: 5,
    unit: "kg",
    minLevel: 10,
    price: 40,
    supplier: "Fresh Farms",
  },
  {
    id: 8,
    name: "Milk",
    category: "Dairy",
    quantity: 20,
    unit: "liter",
    minLevel: 10,
    price: 60,
    supplier: "Dairy Fresh",
  },
  {
    id: 9,
    name: "Spice Mix",
    category: "Spices",
    quantity: 12,
    unit: "kg",
    minLevel: 5,
    price: 450,
    supplier: "Spice World",
  },
]

export default function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState(initialInventoryItems)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    quantity: "",
    unit: "",
    minLevel: "",
    price: "",
    supplier: "",
  })
  const [editingItem, setEditingItem] = useState(null)

  const filteredItems = inventoryItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddItem = () => {
    if (!newItem.name || !newItem.category || !newItem.quantity || !newItem.unit) return

    const newId = inventoryItems.length > 0 ? Math.max(...inventoryItems.map((item) => item.id)) + 1 : 1

    setInventoryItems([
      ...inventoryItems,
      {
        id: newId,
        name: newItem.name,
        category: newItem.category,
        quantity: Number.parseInt(newItem.quantity),
        unit: newItem.unit,
        minLevel: Number.parseInt(newItem.minLevel) || 0,
        price: Number.parseInt(newItem.price) || 0,
        supplier: newItem.supplier || "",
      },
    ])

    setNewItem({
      name: "",
      category: "",
      quantity: "",
      unit: "",
      minLevel: "",
      price: "",
      supplier: "",
    })

    setIsAddDialogOpen(false)
  }

  const handleEditItem = (item) => {
    setEditingItem({
      ...item,
      quantity: item.quantity.toString(),
      minLevel: item.minLevel.toString(),
      price: item.price.toString(),
    })
  }

  const handleUpdateItem = () => {
    if (!editingItem.name || !editingItem.category || !editingItem.quantity || !editingItem.unit) return

    setInventoryItems(
      inventoryItems.map((item) =>
        item.id === editingItem.id
          ? {
              ...editingItem,
              quantity: Number.parseInt(editingItem.quantity),
              minLevel: Number.parseInt(editingItem.minLevel),
              price: Number.parseInt(editingItem.price),
            }
          : item,
      ),
    )

    setEditingItem(null)
  }

  const handleDeleteItem = (id) => {
    setInventoryItems(inventoryItems.filter((item) => item.id !== id))
  }

  const getStockStatus = (item) => {
    const ratio = item.quantity / item.minLevel

    if (ratio <= 0.5) {
      return {
        badge: (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Low Stock
          </Badge>
        ),
        progress: { value: ratio * 100, color: "bg-red-500" },
      }
    } else if (ratio <= 1) {
      return {
        badge: (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Running Low
          </Badge>
        ),
        progress: { value: ratio * 100, color: "bg-yellow-500" },
      }
    } else {
      return {
        badge: (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            In Stock
          </Badge>
        ),
        progress: { value: 100, color: "bg-green-500" },
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Inventory Items</h2>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-1">
                  <PlusCircle className="h-4 w-4" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Inventory Item</DialogTitle>
                  <DialogDescription>Add a new item to your inventory.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Item Name*</Label>
                      <Input
                        id="name"
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        placeholder="e.g., Chicken"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category*</Label>
                      <Input
                        id="category"
                        value={newItem.category}
                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                        placeholder="e.g., Meat"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="quantity">Quantity*</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                        placeholder="e.g., 25"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="unit">Unit*</Label>
                      <Input
                        id="unit"
                        value={newItem.unit}
                        onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                        placeholder="e.g., kg"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="minLevel">Minimum Level</Label>
                      <Input
                        id="minLevel"
                        type="number"
                        value={newItem.minLevel}
                        onChange={(e) => setNewItem({ ...newItem, minLevel: e.target.value })}
                        placeholder="e.g., 10"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="price">Price (INR)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={newItem.price}
                        onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                        placeholder="e.g., 320"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={newItem.supplier}
                      onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                      placeholder="e.g., Fresh Foods Ltd."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddItem}>Add Item</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const stockStatus = getStockStatus(item)

            return (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{item.name}</CardTitle>
                    {stockStatus.badge}
                  </div>
                  <div className="text-sm text-gray-500">{item.category}</div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Stock Level:</span>
                        <span>
                          {item.quantity} {item.unit} (Min: {item.minLevel} {item.unit})
                        </span>
                      </div>
                      <Progress value={stockStatus.progress.value} className={stockStatus.progress.color} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Price (per {item.unit}):</p>
                        <p>₹{item.price}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Supplier:</p>
                        <p>{item.supplier}</p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>

      {/* Edit Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
              <DialogDescription>Update the details of this inventory item.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Item Name*</Label>
                  <Input
                    id="edit-name"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category*</Label>
                  <Input
                    id="edit-category"
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-quantity">Quantity*</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-unit">Unit*</Label>
                  <Input
                    id="edit-unit"
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-minLevel">Minimum Level</Label>
                  <Input
                    id="edit-minLevel"
                    type="number"
                    value={editingItem.minLevel}
                    onChange={(e) => setEditingItem({ ...editingItem, minLevel: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-price">Price (INR)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-supplier">Supplier</Label>
                <Input
                  id="edit-supplier"
                  value={editingItem.supplier}
                  onChange={(e) => setEditingItem({ ...editingItem, supplier: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateItem}>Update Item</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
