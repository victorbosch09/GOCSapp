import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { StoreSection, StoreSectionItem, RecurringExpense } from "@/types/database";

export async function getFullCatalog() {
  const supabase = await createClient();
  const [weapons, equipment, accessories, vehicles, sections, sectionItems] = await Promise.all([
    supabase.from("weapons").select("*").order("category").order("name"),
    supabase.from("equipment").select("*").order("category").order("name"),
    supabase.from("accessories").select("*").order("category").order("name"),
    supabase.from("vehicles").select("*").order("category").order("name"),
    supabase.from("store_sections").select("*").order("sort_order").order("name"),
    supabase.from("store_section_items").select("*").order("category").order("name"),
  ]);

  const allSections: StoreSection[] = sections.data ?? [];
  const allItems: StoreSectionItem[] = sectionItems.data ?? [];

  const customSections = allSections.map((s) => ({
    ...s,
    items: allItems.filter((i) => i.section_id === s.id),
  }));

  return {
    weapons: weapons.data ?? [],
    equipment: equipment.data ?? [],
    accessories: accessories.data ?? [],
    vehicles: vehicles.data ?? [],
    customSections,
  };
}

export async function getInsuranceCatalog(userId: string) {
  const supabase = await createClient();
  const [expensesRes, subsRes] = await Promise.all([
    supabase
      .from("recurring_expenses")
      .select("*")
      .eq("category", "Seguro")
      .eq("is_active", true)
      .order("sort_order"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("insurance_subscriptions")
      .select("expense_id")
      .eq("profile_id", userId),
  ]);

  const subscribedIds = new Set(
    ((subsRes as { data: Array<{ expense_id: string }> | null }).data ?? []).map((s) => s.expense_id)
  );

  return (expensesRes.data ?? []).map((e: RecurringExpense) => ({
    ...e,
    subscribed: subscribedIds.has(e.id),
  }));
}
