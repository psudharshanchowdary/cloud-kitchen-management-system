import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Cloud Kitchen Management</h1>
          <nav className="flex space-x-4">
            <Link href="/dashboard" className="text-white hover:text-pink-200">
              Dashboard
            </Link>
            <Link href="/menu" className="text-white hover:text-pink-200">
              Menu
            </Link>
            <Link href="/orders" className="text-white hover:text-pink-200">
              Orders
            </Link>
            <Link href="/inventory" className="text-white hover:text-pink-200">
              Inventory
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-purple-800 sm:text-4xl">Cloud Kitchen Management System</h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-purple-600 sm:mt-4">
            Streamline your cloud kitchen operations with our comprehensive management solution
          </p>
          <div className="mt-6">
            <Button asChild className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-3">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-t-4 border-purple-500 hover:shadow-lg transition-shadow">
            <CardHeader className="bg-purple-50">
              <CardTitle className="text-purple-700">Menu Management</CardTitle>
              <CardDescription>Manage your food items and pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Create, update, and organize your menu items with prices in INR.</p>
            </CardContent>
            <CardFooter className="bg-purple-50">
              <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                <Link href="/menu">Manage Menu</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-t-4 border-pink-500 hover:shadow-lg transition-shadow">
            <CardHeader className="bg-pink-50">
              <CardTitle className="text-pink-700">Order Processing</CardTitle>
              <CardDescription>Track and manage customer orders</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Process incoming orders and track their status in real-time.</p>
            </CardContent>
            <CardFooter className="bg-pink-50">
              <Button asChild className="w-full bg-pink-600 hover:bg-pink-700">
                <Link href="/orders">View Orders</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-t-4 border-indigo-500 hover:shadow-lg transition-shadow">
            <CardHeader className="bg-indigo-50">
              <CardTitle className="text-indigo-700">Kitchen Operations</CardTitle>
              <CardDescription>Optimize your kitchen workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Manage food preparation, cooking times, and delivery schedules.</p>
            </CardContent>
            <CardFooter className="bg-indigo-50">
              <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
                <Link href="/kitchen">Kitchen Dashboard</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-t-4 border-teal-500 hover:shadow-lg transition-shadow">
            <CardHeader className="bg-teal-50">
              <CardTitle className="text-teal-700">Inventory</CardTitle>
              <CardDescription>Track ingredients and supplies</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Monitor stock levels and get alerts when supplies are running low.</p>
            </CardContent>
            <CardFooter className="bg-teal-50">
              <Button asChild className="w-full bg-teal-600 hover:bg-teal-700">
                <Link href="/inventory">Manage Inventory</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}
