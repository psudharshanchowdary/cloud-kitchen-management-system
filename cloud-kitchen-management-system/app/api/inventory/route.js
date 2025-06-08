import { NextResponse } from "next/server"
import { getInventoryItems, updateInventoryItem } from "@/lib/db"

export async function GET() {
  try {
    const inventoryItems = await getInventoryItems()
    return NextResponse.json(inventoryItems)
  } catch (error) {
    console.error("Error fetching inventory items:", error)
    return NextResponse.json({ error: "Failed to fetch inventory items" }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.id || !data.name || !data.category || data.quantity === undefined) {
      return NextResponse.json({ error: "ID, name, category, and quantity are required" }, { status: 400 })
    }

    await updateInventoryItem(data.id, data)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating inventory item:", error)
    return NextResponse.json({ error: "Failed to update inventory item" }, { status: 500 })
  }
}
