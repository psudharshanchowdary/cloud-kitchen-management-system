"use server";

import { db } from "@/lib/db";
import { MenuItem } from "@/types";

export async function getMenuList(): Promise<MenuItem[]> {
  try {
    return await db.getMenuItems();
  } catch (error) {
    console.error("Failed to get menu list", error);
    return [];
  }
}

export async function getMenuItemWithIngredients(id: string): Promise<{ item: MenuItem | null; ingredients: any[] }> {
  try {
    const items = await db.getMenuItems();
    const item = items.find(m => m.id === id) || null;
    if (!item) return { item: null, ingredients: [] };

    const mappings = await db.getMenuItemIngredients();
    const itemMappings = mappings.filter(m => m.menu_item_id === id);

    const inventory = await db.getInventory();
    
    const ingredients = itemMappings.map(mapping => {
      const invItem = inventory.find(inv => inv.id === mapping.ingredient_id);
      return {
        ingredient_id: mapping.ingredient_id,
        name: invItem?.name || "Unknown Ingredient",
        quantity: mapping.quantity,
        unit: invItem?.unit || "unit",
        price_per_unit: invItem?.price_per_unit || 0
      };
    });

    return { item, ingredients };
  } catch (error) {
    console.error("Failed to get menu item details", error);
    return { item: null, ingredients: [] };
  }
}

export async function saveMenuItem(
  itemData: Omit<MenuItem, "id" | "created_at">, 
  ingredients: { ingredient_id: string; quantity: number }[],
  id?: string
): Promise<MenuItem> {
  if (id) {
    return db.updateMenuItem(id, itemData, ingredients);
  } else {
    return db.createMenuItem(itemData, ingredients);
  }
}

export async function toggleMenuItemAvailability(id: string, isAvailable: boolean): Promise<MenuItem> {
  return db.updateMenuItem(id, { is_available: isAvailable });
}

export async function removeMenuItem(id: string): Promise<boolean> {
  return db.deleteMenuItem(id);
}
