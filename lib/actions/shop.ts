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

  // License prerequisite gate: only accessories require a license
  if (itemTable === "accessories") {
    const { data: itemData } = await admin
      .from("accessories")
      .select("name")
      .eq("id", itemId)
      .single();

    const isLicense = /licencia/i.test(itemData?.name ?? "");

    if (!isLicense) {
      const { data: licenseInInventory } = await admin
        .from("inventory")
        .select("id")
        .eq("profile_id", user.id)
        .eq("item_table", "accessories")
        .ilike("item_name", "%licencia%")
        .limit(1);

      if (!licenseInInventory || licenseInInventory.length === 0) {
        return { error: "Necesitás comprar la Licencia de Accesorios antes de adquirir accesorios." };
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
