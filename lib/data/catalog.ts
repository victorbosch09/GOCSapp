import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { StoreSection, StoreSectionItem } from "@/types/database";

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
