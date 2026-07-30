"use client";

import { useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { sellItem } from "@/lib/actions/shop";
import { formatCredits, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { InventoryItem } from "@/types/database";

export function InventoryCard({ items }: { items: InventoryItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">Mi inventario</CardTitle>
        <CardDescription>Armamento, equipo y vehículos que comprás quedan acá. Podés revenderlos.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no compraste nada en la tienda.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <InventoryRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InventoryRow({ item }: { item: InventoryItem }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3 text-sm">
      <div className="flex min-w-0 items-center gap-3">
        {item.item_image_url && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted/30">
            <Image
              src={item.item_image_url}
              alt={item.item_name}
              width={32}
              height={32}
              className="object-contain"
              unoptimized
            />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-medium">{item.item_name}</p>
          <p className="text-xs text-muted-foreground">
            {item.item_category ?? item.item_table} · Comprado el {formatDate(item.acquired_at)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-muted-foreground">{formatCredits(item.purchase_price)}</span>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => {
            if (!confirm(`¿Vender "${item.item_name}" por ${formatCredits(item.purchase_price)}?`))
              return;
            startTransition(async () => {
              const result = await sellItem(item.id);
              if (result?.error) toast.error(result.error);
              else toast.success(`Vendido: ${item.item_name}`);
            });
          }}
        >
          {pending ? "Vendiendo..." : "Vender"}
        </Button>
      </div>
    </div>
  );
}
