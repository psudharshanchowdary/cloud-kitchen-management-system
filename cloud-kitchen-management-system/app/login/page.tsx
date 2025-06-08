"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Owner credentials (in a real app, this would be authenticated against a database)
  const OWNER_USERNAME = "owner"
  const OWNER_PASSWORD = "cloudkitchen123"

  const handleLogin = (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Simple validation
    if (!username || !password) {
      setError("Please enter both username and password")
      setLoading(false)
      return
    }

    // Check credentials (this is a simple client-side check for demo purposes)
    // In a real application, you would make an API call to verify credentials
    if (username === OWNER_USERNAME && password === OWNER_PASSWORD) {
      // Simulate API call delay
      setTimeout(() => {
        // Set a simple session token in localStorage
        localStorage.setItem("isLoggedIn", "true")
        localStorage.setItem("userRole", "owner")

        // Redirect to dashboard
        router.push("/dashboard")
      }, 1000)
    } else {
      setError("Invalid username or password")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-pink-50 p-4">
      <Card className="w-full max-w-md border-t-4 border-purple-600">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-purple-800">Cloud Kitchen Management</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            For demo: Username: <span className="font-semibold">owner</span> | Password:{" "}
            <span className="font-semibold">cloudkitchen123</span>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
