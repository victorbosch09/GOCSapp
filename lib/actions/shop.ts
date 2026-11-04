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

  // License prerequisite gates (weapons are always free; accessories and equipment require their license)
  if (itemTable === "accessories" || itemTable === "equipment") {
    const { data: itemData } = await admin
      .from(itemTable as "accessories" | "equipment")
      .select("name")
      .eq("id", itemId)
      .single();

    const isLicense = /licencia/i.test(itemData?.name ?? "");

    if (!isLicense) {
      // Search across ALL inventory tables — the license item may live in a different catalog table
      const licenseKeyword =
        itemTable === "accessories" ? "%licencia%accesorio%" : "%licencia%equipamiento%";

      const { data: licenseInInventory } = await admin
        .from("inventory")
        .select("id")
        .eq("profile_id", user.id)
        .ilike("item_name", licenseKeyword)
        .limit(1);

      if (!licenseInInventory || licenseInInventory.length === 0) {
        const msg =
          itemTable === "accessories"
            ? "Necesitás comprar la Licencia de Accesorios antes de adquirir accesorios."
            : "Necesitás comprar la Licencia de Modificación de Equipamiento antes de adquirir equipamiento.";
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

export async function subscribeInsurance(expenseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tenés que iniciar sesión." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("approved, cached_balance")
    .eq("id", user.id)
    .single();
  if (!profile?.approved) return { error: "Tu cuenta todavía no fue aprobada." };

  const admin = createAdminClient();

  // Fetch the insurance expense to get the cost
  const { data: expense } = await admin
    .from("recurring_expenses")
    .select("id, name, base_amount, category")
    .eq("id", expenseId)
    .eq("category", "Seguro")
    .single();

  if (!expense) return { error: "Seguro no encontrado." };

  if ((profile.cached_balance ?? 0) < expense.base_amount) {
    return { error: "Saldo insuficiente para suscribirte a este seguro." };
  }

  // Insert subscription (unique constraint prevents duplicates)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: subErr } = await (admin as any)
    .from("insurance_subscriptions")
    .insert({ profile_id: user.id, expense_id: expenseId });

  if (subErr) {
    if (subErr.code === "23505") return { error: "Ya estás suscripto a este seguro." };
    return { error: subErr.message };
  }

  // Deduct cost from operator balance via a debit transaction
  if (expense.base_amount > 0) {
    await admin.from("transactions").insert({
      profile_id: user.id,
      amount: -expense.base_amount,
      type: "debit",
      description: `Seguro: ${expense.name}`,
    } as never);

    await admin
      .from("profiles")
      .update({ cached_balance: (profile.cached_balance ?? 0) - expense.base_amount } as never)
      .eq("id", user.id);
  }

  revalidatePath("/tienda");
  revalidatePath("/dashboard");
  return { data: true };
}

export async function unsubscribeInsurance(expenseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tenés que iniciar sesión." };

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("insurance_subscriptions")
    .delete()
    .eq("profile_id", user.id)
    .eq("expense_id", expenseId);

  if (error) return { error: error.message };

  revalidatePath("/tienda");
  return { data: true };
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
