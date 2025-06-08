"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Edit, Trash2 } from "lucide-react"

// Expanded mock data for menu items with more variety
const initialMenuItems = [
  {
    id: 1,
    name: "Butter Chicken",
    category: "Main Course",
    price: 350,
    description: "Tender chicken cooked in a rich buttery tomato sauce",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 2,
    name: "Paneer Tikka",
    category: "Starters",
    price: 250,
    description: "Grilled cottage cheese marinated in spices",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 3,
    name: "Veg Biryani",
    category: "Rice",
    price: 280,
    description: "Fragrant rice cooked with mixed vegetables and spices",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 4,
    name: "Gulab Jamun",
    category: "Desserts",
    price: 120,
    description: "Sweet milk solids balls soaked in sugar syrup",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 5,
    name: "Masala Dosa",
    category: "Breakfast",
    price: 180,
    description: "Crispy rice crepe filled with spiced potato filling",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 6,
    name: "Chicken Biryani",
    category: "Rice",
    price: 320,
    description: "Fragrant rice cooked with chicken and aromatic spices",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 7,
    name: "Palak Paneer",
    category: "Main Course",
    price: 280,
    description: "Cottage cheese cubes in a creamy spinach gravy",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 8,
    name: "Tandoori Roti",
    category: "Breads",
    price: 40,
    description: "Whole wheat flatbread baked in a tandoor",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 9,
    name: "Garlic Naan",
    category: "Breads",
    price: 60,
    description: "Leavened flatbread topped with garlic and butter",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 10,
    name: "Chicken Tikka",
    category: "Starters",
    price: 290,
    description: "Boneless chicken pieces marinated and grilled to perfection",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 11,
    name: "Rasmalai",
    category: "Desserts",
    price: 150,
    description: "Soft cottage cheese dumplings soaked in sweetened milk",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 12,
    name: "Idli Sambar",
    category: "Breakfast",
    price: 160,
    description: "Steamed rice cakes served with lentil soup and chutney",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 13,
    name: "Chole Bhature",
    category: "Main Course",
    price: 220,
    description: "Spicy chickpea curry served with fried bread",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 14,
    name: "Mango Lassi",
    category: "Beverages",
    price: 120,
    description: "Refreshing yogurt drink blended with mango pulp",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 15,
    name: "Masala Chai",
    category: "Beverages",
    price: 60,
    description: "Spiced Indian tea with milk",
    image: "/placeholder.svg?height=100&width=100",
  },
]

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState(initialMenuItems)
  const [categories, setCategories] = useState([
    "All",
    "Starters",
    "Main Course",
    "Rice",
    "Breads",
    "Desserts",
    "Breakfast",
    "Beverages",
  ])
  const [activeCategory, setActiveCategory] = useState("All")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
    image: "/placeholder.svg?height=100&width=100",
  })
  const [editingItem, setEditingItem] = useState(null)

  const filteredItems =
    activeCategory === "All" ? menuItems : menuItems.filter((item) => item.category === activeCategory)

  const handleAddItem = () => {
    if (!newItem.name || !newItem.category || !newItem.price) return

    const newId = menuItems.length > 0 ? Math.max(...menuItems.map((item) => item.id)) + 1 : 1

    setMenuItems([
      ...menuItems,
      {
        id: newId,
        name: newItem.name,
        category: newItem.category,
        price: Number.parseInt(newItem.price),
        description: newItem.description,
        image: newItem.image,
      },
    ])

    setNewItem({
      name: "",
      category: "",
      price: "",
      description: "",
      image: "/placeholder.svg?height=100&width=100",
    })

    setIsAddDialogOpen(false)

    // Add new category if it doesn't exist
    if (!categories.includes(newItem.category)) {
      setCategories([...categories, newItem.category])
    }
  }

  const handleEditItem = (item) => {
    setEditingItem({
      ...item,
      price: item.price.toString(),
    })
  }

  const handleUpdateItem = () => {
    if (!editingItem.name || !editingItem.category || !editingItem.price) return

    setMenuItems(
      menuItems.map((item) =>
        item.id === editingItem.id
          ? {
              ...editingItem,
              price: Number.parseInt(editingItem.price),
            }
          : item,
      ),
    )

    // Add new category if it doesn't exist
    if (!categories.includes(editingItem.category)) {
      setCategories([...categories, editingItem.category])
    }

    setEditingItem(null)
  }

  const handleDeleteItem = (id) => {
    setMenuItems(menuItems.filter((item) => item.id !== id))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 pb-10">
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Menu Management</h1>
          <nav className="flex space-x-4">
            <Link href="/" className="text-white hover:text-pink-200">
              Home
            </Link>
            <Link href="/dashboard" className="text-white hover:text-pink-200">
              Dashboard
            </Link>
            <Link href="/orders" className="text-white hover:text-pink-200">
              Orders
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-800">Food Menu</h2>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700">
                <PlusCircle className="h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Menu Item</DialogTitle>
                <DialogDescription>Create a new food item for your menu.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="e.g., Butter Chicken"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    placeholder="e.g., Main Course"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Price (INR)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    placeholder="e.g., 350"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Describe the dish..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddItem} className="bg-purple-600 hover:bg-purple-700">
                  Add Item
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="All" className="mb-8">
          <TabsList className="mb-4 bg-purple-100 p-1">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                onClick={() => setActiveCategory(category)}
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeCategory} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden border-t-4 border-purple-400 hover:shadow-lg transition-shadow"
                >
                  <div className="h-40 bg-purple-100 flex items-center justify-center">
                    <div className="text-4xl font-bold text-purple-300 flex items-center justify-center w-full h-full">
                      {item.name.charAt(0)}
                    </div>
                  </div>
                  <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-pink-50">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl text-purple-800">{item.name}</CardTitle>
                      <div className="text-lg font-bold text-green-600">₹{item.price}</div>
                    </div>
                    <div className="text-sm text-purple-600">{item.category}</div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                        className="flex items-center gap-1 border-purple-300 text-purple-700 hover:bg-purple-50"
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Menu Item</DialogTitle>
              <DialogDescription>Update the details of this menu item.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Item Name</Label>
                <Input
                  id="edit-name"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Input
                  id="edit-category"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
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
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateItem} className="bg-purple-600 hover:bg-purple-700">
                Update Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
