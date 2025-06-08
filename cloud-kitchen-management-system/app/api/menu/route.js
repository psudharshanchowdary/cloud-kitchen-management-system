import { NextResponse } from "next/server"
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from "@/lib/db"

export async function GET() {
  try {
    const menuItems = await getMenuItems()
    return NextResponse.json(menuItems)
  } catch (error) {
    console.error("Error fetching menu items:", error)
    return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.category || !data.price) {
      return NextResponse.json({ error: "Name, category, and price are required" }, { status: 400 })
    }

    const id = await createMenuItem(data)
    return NextResponse.json({ id, ...data }, { status: 201 })
  } catch (error) {
    console.error("Error creating menu item:", error)
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.id || !data.name || !data.category || !data.price) {
      return NextResponse.json({ error: "ID, name, category, and price are required" }, { status: 400 })
    }

    await updateMenuItem(data.id, data)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating menu item:", error)
    return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    await deleteMenuItem(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting menu item:", error)
    return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 })
  }
}
