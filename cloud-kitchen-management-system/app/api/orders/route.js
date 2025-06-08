import { NextResponse } from "next/server"
import { getOrders, createOrder, updateOrderStatus } from "@/lib/db"

export async function GET() {
  try {
    const orders = await getOrders()
    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.customer_name || !data.items || !data.items.length) {
      return NextResponse.json({ error: "Customer name and at least one item are required" }, { status: 400 })
    }

    const id = await createOrder(data)
    return NextResponse.json({ id, ...data }, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.id || !data.status) {
      return NextResponse.json({ error: "Order ID and status are required" }, { status: 400 })
    }

    await updateOrderStatus(data.id, data.status)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating order status:", error)
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 })
  }
}
