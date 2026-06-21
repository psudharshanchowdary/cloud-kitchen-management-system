"use server";

import { db } from "@/lib/db";
import { Delivery, DeliveryDriver } from "@/types";
import { cookies } from "next/headers";
import { getStartDateForPeriod, getEndDateForPeriod, isWithinPeriod } from "@/lib/date-utils";

async function getLoggedUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    return await db.getUserById(token);
  } catch (err) {
    return null;
  }
}

export async function getDeliveryDriversList(): Promise<DeliveryDriver[]> {
  try {
    return await db.getDeliveryDrivers();
  } catch (error) {
    console.error("Failed to get delivery drivers", error);
    return [];
  }
}

export async function getDeliveriesList(): Promise<Delivery[]> {
  try {
    return await db.getDeliveries();
  } catch (error) {
    console.error("Failed to get deliveries", error);
    return [];
  }
}

export async function dispatchOrderAction(orderId: string, driverId: string, notes?: string): Promise<Delivery> {
  const logged = await getLoggedUser();
  if (!logged) throw new Error("Unauthorized");

  // Verify driver is available
  const drivers = await db.getDeliveryDrivers();
  const driver = drivers.find(d => d.id === driverId);
  if (!driver) throw new Error("Driver not found");
  if (driver.status === "On Delivery") throw new Error("Driver is already on a delivery");

  // 1. Create delivery record
  const now = new Date().toISOString();
  const deliveryData = {
    order_id: orderId,
    driver_id: driverId,
    pickup_time: now,
    delivery_start_time: now,
    estimated_delivery_time: new Date(Date.now() + 30 * 60000).toISOString(), // +30 mins
    delivery_status: "Out For Delivery",
    notes: notes || "Dispatched from packing desk"
  };

  const delivery = await db.createDelivery(deliveryData);

  // 2. Set driver status to "On Delivery"
  await db.updateDeliveryDriver(driverId, { status: "On Delivery" });

  // 3. Update order status to "Out For Delivery"
  await db.updateOrderStatus(orderId, "Out For Delivery");

  // 4. Create audit log
  await db.createActivityLog({
    user_id: logged.id,
    user_name: logged.name,
    role: logged.role,
    action: "DISPATCH_ORDER",
    details: `Order ID ${orderId} dispatched to driver ${driver.full_name}.`
  });

  return delivery;
}

export async function completeDeliveryAction(orderId: string): Promise<boolean> {
  const logged = await getLoggedUser();
  if (!logged) throw new Error("Unauthorized");

  // Triggering order status transition to "Delivered" will run side effects
  await db.updateOrderStatus(orderId, "Delivered");

  // Create audit log
  await db.createActivityLog({
    user_id: logged.id,
    user_name: logged.name,
    role: logged.role,
    action: "DELIVER_ORDER",
    details: `Order ID ${orderId} marked as DELIVERED.`
  });

  return true;
}

export async function getDeliveryDashboardData(period: string = "All", customStart?: string, customEnd?: string) {
  try {
    const [drivers, deliveries, orders] = await Promise.all([
      db.getDeliveryDrivers(),
      db.getDeliveries(),
      db.getOrders()
    ]);

    let targetDeliveries = deliveries;
    if (period !== "All") {
      const startDate = getStartDateForPeriod(period, customStart);
      const endDate = getEndDateForPeriod(period, customEnd);
      targetDeliveries = deliveries.filter(d => {
        const dateToCheck = d.delivered_time || d.pickup_time || d.delivery_start_time;
        return dateToCheck && isWithinPeriod(dateToCheck, startDate, endDate);
      });
    }

    const completedDeliveries = targetDeliveries.filter(d => d.delivery_status === "Delivered");
    const totalDeliveries = completedDeliveries.length;

    // 1. Availability stats (live values, not filtered by period since it's the current state)
    const totalDrivers = drivers.length;
    const availableDrivers = drivers.filter(d => d.status === "Available").length;
    const driverAvailability = `${availableDrivers} / ${totalDrivers}`;

    // 2. Delayed deliveries: count deliveries where actual_delivery_time > 30 minutes
    const delayedCount = completedDeliveries.filter(d => {
      const duration = Number(d.actual_delivery_time || 0);
      return duration > 30; // Threshold of 30 mins
    }).length;

    // 3. Average delivery time
    const totalDuration = completedDeliveries.reduce((sum, d) => sum + Number(d.actual_delivery_time || 0), 0);
    const avgDeliveryTimeVal = totalDeliveries > 0 ? Math.round(totalDuration / totalDeliveries) : 30;
    const averageDeliveryTime = `${avgDeliveryTimeVal} Minutes`;

    // 4. Performance ranking and Fastest driver
    const driverPerformance: Record<string, {
      id: string;
      employee_id: string;
      name: string;
      phone: string;
      vehicle: string;
      vehicle_type: string;
      status: string;
      completedCount: number;
      totalDuration: number;
      avgDuration: number;
      delayedCount: number;
    }> = {};

    // Initialize with all drivers
    drivers.forEach(drv => {
      driverPerformance[drv.id] = {
        id: drv.id,
        employee_id: drv.employee_id,
        name: drv.full_name,
        phone: drv.phone_number,
        vehicle: drv.vehicle_number,
        vehicle_type: drv.vehicle_type,
        status: drv.status,
        completedCount: 0,
        totalDuration: 0,
        avgDuration: 0,
        delayedCount: 0
      };
    });

    // Populate stats based on filtered completed deliveries
    completedDeliveries.forEach(del => {
      const stats = driverPerformance[del.driver_id];
      if (stats) {
        stats.completedCount += 1;
        const duration = Number(del.actual_delivery_time || 0);
        stats.totalDuration += duration;
        if (duration > 30) {
          stats.delayedCount += 1;
        }
      }
    });

    // Compute averages and map to array
    const rankings = Object.values(driverPerformance).map(p => {
      p.avgDuration = p.completedCount > 0 ? Math.round(p.totalDuration / p.completedCount) : 0;
      return p;
    });

    // Sort rankings: Completed count descending, then avg duration ascending
    rankings.sort((a, b) => {
      if (b.completedCount !== a.completedCount) {
        return b.completedCount - a.completedCount;
      }
      return a.avgDuration - b.avgDuration;
    });

    // Find fastest driver
    const driversWithDeliveries = rankings.filter(r => r.completedCount > 0);
    driversWithDeliveries.sort((a, b) => a.avgDuration - b.avgDuration);
    const fastestDriver = driversWithDeliveries.length > 0
      ? `${driversWithDeliveries[0].name} (${driversWithDeliveries[0].avgDuration} mins)`
      : "N/A";

    return {
      totalDeliveries,
      delayedDeliveries: delayedCount,
      averageDeliveryTime,
      fastestDriver,
      driverAvailability,
      availableDriversCount: availableDrivers,
      totalDriversCount: totalDrivers,
      rankings
    };
  } catch (error) {
    console.error("Failed to load delivery dashboard data", error);
    return {
      totalDeliveries: 0,
      delayedDeliveries: 0,
      averageDeliveryTime: "0 Minutes",
      fastestDriver: "N/A",
      driverAvailability: "0 / 0",
      availableDriversCount: 0,
      totalDriversCount: 0,
      rankings: []
    };
  }
}
