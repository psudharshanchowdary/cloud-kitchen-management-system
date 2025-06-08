// This file contains the database connection and models
// For MySQL integration with Node.js

import mysql from "mysql2/promise"

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "password",
  database: process.env.MYSQL_DATABASE || "cloud_kitchen",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// Test the database connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection()
    console.log("Database connection successful!")
    connection.release()
    return true
  } catch (error) {
    console.error("Database connection error:", error)
    return false
  }
}

// Menu Items
export async function getMenuItems() {
  try {
    const [rows] = await pool.query("SELECT * FROM menu_items ORDER BY category, name")
    return rows
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to fetch menu items")
  }
}

export async function getMenuItemById(id) {
  try {
    const [rows] = await pool.query("SELECT * FROM menu_items WHERE id = ?", [id])
    return rows[0]
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to fetch menu item")
  }
}

export async function createMenuItem(item) {
  try {
    const { name, category, price, description, is_vegetarian, preparation_time } = item
    const [result] = await pool.query(
      "INSERT INTO menu_items (name, category, price, description, is_vegetarian, preparation_time) VALUES (?, ?, ?, ?, ?, ?)",
      [name, category, price, description, is_vegetarian || false, preparation_time || 0],
    )
    return result.insertId
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to create menu item")
  }
}

export async function updateMenuItem(id, item) {
  try {
    const { name, category, price, description, is_vegetarian, preparation_time } = item
    await pool.query(
      "UPDATE menu_items SET name = ?, category = ?, price = ?, description = ?, is_vegetarian = ?, preparation_time = ? WHERE id = ?",
      [name, category, price, description, is_vegetarian || false, preparation_time || 0, id],
    )
    return true
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to update menu item")
  }
}

export async function deleteMenuItem(id) {
  try {
    await pool.query("DELETE FROM menu_items WHERE id = ?", [id])
    return true
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to delete menu item")
  }
}

// Orders
export async function getOrders() {
  try {
    const [rows] = await pool.query(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.order_date DESC
    `)

    // Get order items for each order
    for (const order of rows) {
      const [items] = await pool.query(
        `
        SELECT oi.*, mi.name, mi.description
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = ?
      `,
        [order.id],
      )

      order.items = items
    }

    return rows
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to fetch orders")
  }
}

export async function createOrder(order) {
  try {
    const { customer_id, total_amount, status, delivery_address, payment_status, payment_method, items } = order

    // Start a transaction
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`

      // Create the order
      const [orderResult] = await connection.query(
        "INSERT INTO orders (order_number, customer_id, total_amount, status, delivery_address, payment_status, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          orderNumber,
          customer_id,
          total_amount,
          status || "Pending",
          delivery_address,
          payment_status || "Pending",
          payment_method,
        ],
      )

      const orderId = orderResult.insertId

      // Add order items
      for (const item of items) {
        await connection.query(
          "INSERT INTO order_items (order_id, menu_item_id, quantity, price, status, special_instructions) VALUES (?, ?, ?, ?, ?, ?)",
          [
            orderId,
            item.menu_item_id,
            item.quantity,
            item.price,
            item.status || "Pending",
            item.special_instructions || "",
          ],
        )
      }

      // Update customer's last order date
      if (customer_id) {
        await connection.query("UPDATE customers SET last_order_date = NOW() WHERE id = ?", [customer_id])
      }

      // Commit the transaction
      await connection.commit()
      connection.release()

      return { id: orderId, order_number: orderNumber }
    } catch (error) {
      // Rollback in case of error
      await connection.rollback()
      connection.release()
      throw error
    }
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to create order")
  }
}

export async function updateOrderStatus(id, status) {
  try {
    await pool.query("UPDATE orders SET status = ? WHERE id = ?", [status, id])
    return true
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to update order status")
  }
}

// Inventory
export async function getInventoryItems() {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, s.name as supplier_name
      FROM inventory_items i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      ORDER BY i.category, i.name
    `)
    return rows
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to fetch inventory items")
  }
}

export async function updateInventoryItem(id, item) {
  try {
    const { name, category, quantity, unit, min_level, price_per_unit, supplier_id, expiry_date, storage_location } =
      item
    await pool.query(
      "UPDATE inventory_items SET name = ?, category = ?, quantity = ?, unit = ?, min_level = ?, price_per_unit = ?, supplier_id = ?, expiry_date = ?, storage_location = ? WHERE id = ?",
      [name, category, quantity, unit, min_level, price_per_unit, supplier_id, expiry_date, storage_location, id],
    )
    return true
  } catch (error) {
    console.error("Database error:", error)
    throw new Error("Failed to update inventory item")
  }
}

// Export the pool for direct use if needed
export default pool
