"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatCredits } from "@/lib/format";
import type { Notification, Transaction } from "@/types/database";

/**
 * Mounted once in the (app) layout. Pushes a toast + refreshes server data
 * when the signed-in operator receives a payment/purchase or a targeted
 * notification, without the user having to reload the page.
 */
export function RealtimeListener({ profileId }: { profileId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`profile-${profileId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions", filter: `profile_id=eq.${profileId}` },
        (payload) => {
          const txn = payload.new as Transaction;
          const sign = txn.amount >= 0 ? "+" : "";
          if (txn.amount >= 0) {
            toast.success(`${txn.type}: ${sign}${formatCredits(txn.amount)}`, {
              description: txn.detail ?? undefined,
            });
          } else {
            toast.info(`${txn.type}: ${formatCredits(txn.amount)}`, {
              description: txn.detail ?? undefined,
            });
          }
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const notif = payload.new as Notification;
          toast(notif.title, { description: notif.body ?? undefined });
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, router]);

  return null;
}
