"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type CatalogTable = "weapons" | "equipment" | "accessories" | "vehicles";

export async function purchaseItem(itemTable: CatalogTable, itemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tenés que iniciar sesión." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("approved")
    .eq("id", user.id)
    .single();

  if (!profile?.approved) {
    return { error: "Tu cuenta todavía no fue aprobada." };
  }

  const admin = createAdminClient();

  // License prerequisite gate for weapons and accessories
  if (itemTable === "weapons" || itemTable === "accessories") {
    // Fetch the item being purchased to check if it's itself a license
    const { data: itemData } = await admin
      .from(itemTable)
      .select("name")
      .eq("id", itemId)
      .single();

    const isLicense = /licencia/i.test(itemData?.name ?? "");

    if (!isLicense) {
      // Check if soldier owns the required license in their inventory
      const licensePattern =
        itemTable === "weapons" ? "licencia de modificaci" : "licencia de accesorio";

      const { data: licenseInInventory } = await admin
        .from("inventory")
        .select("id")
        .eq("profile_id", user.id)
        .eq("item_table", itemTable)
        .ilike("item_name", `%${licensePattern}%`)
        .limit(1);

      if (!licenseInInventory || licenseInInventory.length === 0) {
        const msg =
          itemTable === "weapons"
            ? "Necesitás comprar la Licencia de Modificación de Armamento antes de adquirir armas."
            : "Necesitás comprar la Licencia de Accesorios antes de adquirir accesorios.";
        return { error: msg };
      }
    }
  }

  const { data, error } = await admin.rpc("purchase_item", {
    p_profile_id: user.id,
    p_item_table: itemTable,
    p_item_id: itemId,
  });

  if (error) {
    return { error: error.message.replace(/^.*?:\s*/, "") };
  }

  revalidatePath("/tienda");
  revalidatePath("/dashboard");
  return { data };
}

export async function sellItem(inventoryId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tenés que iniciar sesión." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("sell_item", {
    p_profile_id: user.id,
    p_inventory_id: inventoryId,
  });

  if (error) {
    return { error: error.message.replace(/^.*?:\s*/, "") };
  }

  revalidatePath("/dashboard");
  revalidatePath("/tienda");
  return { data };
}
