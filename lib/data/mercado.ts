import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getMarketData() {
  const admin = createAdminClient();
  const [itemsRes, purchasesRes, catalogRes] = await Promise.all([
    admin.from("market_items" as never).select("*").order("category").order("sort_order"),
    admin.from("market_purchases" as never).select("*, market_item:market_items(name,category)").order("created_at", { ascending: false }).limit(50),
    Promise.all([
      admin.from("weapons").select("id,name,category").order("name"),
      admin.from("equipment").select("id,name,category").order("name"),
      admin.from("accessories").select("id,name,category").order("name"),
      admin.from("vehicles").select("id,name,category").order("name"),
    ]),
  ]);

  const [weapons, equipment, accessories, vehicles] = catalogRes;
  const storeItems = [
    ...(weapons.data ?? []).map((i) => ({ ...i, table: "weapons" as const })),
    ...(equipment.data ?? []).map((i) => ({ ...i, table: "equipment" as const })),
    ...(accessories.data ?? []).map((i) => ({ ...i, table: "accessories" as const })),
    ...(vehicles.data ?? []).map((i) => ({ ...i, table: "vehicles" as const })),
  ];

  return {
    marketItems: itemsRes.data ?? [],
    purchases: purchasesRes.data ?? [],
    storeItems,
  };
}

export async function getExpensesData() {
  const admin = createAdminClient();
  const [expensesRes, paymentsRes, soldierCountRes, vehicleStockRes, weaponStockRes] = await Promise.all([
    admin.from("recurring_expenses" as never).select("*").order("sort_order"),
    admin.from("expense_payments" as never).select("*").order("created_at", { ascending: false }).limit(100),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("approved", true),
    admin.from("vehicles").select("stock"),
    admin.from("weapons").select("stock"),
  ]);

  const soldierCount = soldierCountRes.count ?? 0;
  const totalVehicleStock = (vehicleStockRes.data ?? []).reduce((s, v) => s + (v.stock ?? 0), 0);
  const totalWeaponStock = (weaponStockRes.data ?? []).reduce((s, w) => s + (w.stock ?? 0), 0);

  return {
    expenses: expensesRes.data ?? [],
    payments: paymentsRes.data ?? [],
    soldierCount,
    totalVehicleStock,
    totalWeaponStock,
  };
}
