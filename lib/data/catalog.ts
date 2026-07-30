import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getFullCatalog() {
  const supabase = await createClient();
  const [weapons, equipment, accessories, vehicles] = await Promise.all([
    supabase.from("weapons").select("*").order("category").order("name"),
    supabase.from("equipment").select("*").order("category").order("name"),
    supabase.from("accessories").select("*").order("category").order("name"),
    supabase.from("vehicles").select("*").order("category").order("name"),
  ]);

  return {
    weapons: weapons.data ?? [],
    equipment: equipment.data ?? [],
    accessories: accessories.data ?? [],
    vehicles: vehicles.data ?? [],
  };
}
