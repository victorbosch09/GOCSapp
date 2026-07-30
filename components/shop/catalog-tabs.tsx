"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { purchaseItem } from "@/lib/actions/shop";
import { formatCredits } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CatalogItem, Vehicle } from "@/types/database";

type Table = "weapons" | "equipment" | "accessories" | "vehicles";

const TABS: { table: Table; label: string }[] = [
  { table: "weapons", label: "Armamento" },
  { table: "equipment", label: "Equipamiento" },
  { table: "accessories", label: "Accesorios" },
  { table: "vehicles", label: "Vehículos" },
];

function groupByCategory<T extends { category: string }>(items: T[]) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const list = groups.get(item.category) ?? [];
    list.push(item);
    groups.set(item.category, list);
  }
  return Array.from(groups.entries());
}

export function CatalogTabs({
  initial,
  balance,
  canBuy,
  myRankSortOrder,
}: {
  initial: Record<Table, (CatalogItem | Vehicle)[]>;
  balance: number;
  canBuy: boolean;
  myRankSortOrder: number;
}) {
  const [data, setData] = useState(initial);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("catalog-changes");

    for (const { table } of TABS) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          setData((prev) => {
            const list = [...prev[table]];
            if (payload.eventType === "DELETE") {
              const idx = list.findIndex((i) => i.id === (payload.old as { id: string }).id);
              if (idx >= 0) list.splice(idx, 1);
            } else {
              const row = payload.new as CatalogItem | Vehicle;
              const idx = list.findIndex((i) => i.id === row.id);
              if (idx >= 0) list[idx] = row;
              else list.push(row);
            }
            return { ...prev, [table]: list };
          });
        }
      );
    }

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Tabs defaultValue="weapons">
      <TabsList>
        {TABS.map((t) => (
          <TabsTrigger key={t.table} value={t.table}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map(({ table }) => (
        <TabsContent key={table} value={table} className="flex flex-col gap-6">
          {data[table].length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin ítems cargados todavía.</p>
          ) : (
            groupByCategory(data[table]).map(([category, items]) => (
              <div key={category}>
                <h3 className="font-heading mb-3 text-sm text-muted-foreground">{category}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      table={table}
                      balance={balance}
                      canBuy={canBuy}
                      myRankSortOrder={myRankSortOrder}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}

function ItemCard({
  item,
  table,
  balance,
  canBuy,
  myRankSortOrder,
}: {
  item: CatalogItem | Vehicle;
  table: Table;
  balance: number;
  canBuy: boolean;
  myRankSortOrder: number;
}) {
  const [pending, startTransition] = useTransition();
  const magStd = "mag_price_standard" in item ? item.mag_price_standard : null;
  const magSpecial = "mag_price_special" in item ? item.mag_price_special : null;
  const capacity = "capacity" in item ? item.capacity : null;
  const minRank = "min_rank_sort_order" in item ? item.min_rank_sort_order : null;

  const affordable = balance >= item.price;
  const rankOk = minRank == null || myRankSortOrder >= minRank;
  const disabled = pending || !canBuy || !item.in_stock || !affordable || !rankOk;

  function handleBuy() {
    startTransition(async () => {
      const result = await purchaseItem(table, item.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Comprado: ${item.name}`);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium leading-snug">{item.name}</CardTitle>
          <Badge variant={item.in_stock ? "secondary" : "outline"} className="shrink-0">
            {item.in_stock ? "Disponible" : "Sin stock"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {item.image_url && (
          <div className="flex h-24 items-center justify-center rounded-md bg-muted/30">
            <Image
              src={item.image_url}
              alt={item.name}
              width={80}
              height={80}
              className="object-contain"
              unoptimized
            />
          </div>
        )}
        <p className="font-heading text-lg text-gocs-red">{formatCredits(item.price)}</p>
        {capacity && <p className="text-xs text-muted-foreground">{capacity}</p>}
        {(magStd || magSpecial) && (
          <p className="text-xs text-muted-foreground">
            Cargador: {magStd ? formatCredits(magStd) : "—"} · Especial:{" "}
            {magSpecial ? formatCredits(magSpecial) : "—"}
          </p>
        )}
        {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
        {!rankOk && (
          <p className="text-xs text-destructive">🔒 Requiere un rango más alto para comprar.</p>
        )}
        <Button
          size="sm"
          className={
            item.in_stock && affordable && canBuy && rankOk
              ? "mt-2 bg-emerald-600 text-white hover:bg-emerald-500"
              : "mt-2"
          }
          disabled={disabled}
          onClick={handleBuy}
          title={!affordable ? "Saldo insuficiente" : !rankOk ? "Rango insuficiente" : undefined}
        >
          {pending ? "Comprando..." : !rankOk ? "Rango insuficiente" : "Comprar"}
        </Button>
      </CardContent>
    </Card>
  );
}
