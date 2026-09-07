"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { purchaseItem } from "@/lib/actions/shop";
import { useNow } from "@/lib/hooks/use-now";
import { formatCredits } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CatalogItem, Vehicle } from "@/types/database";

const NEW_ITEM_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const LOW_STOCK_THRESHOLD = 2;

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
  const [search, setSearch] = useState("");
  const [hideOutOfStock, setHideOutOfStock] = useState(false);
  const [compareItems, setCompareItems] = useState<{ item: CatalogItem | Vehicle; table: Table }[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  function toggleCompare(item: CatalogItem | Vehicle, table: Table) {
    setCompareItems((prev) => {
      const exists = prev.some((c) => c.item.id === item.id);
      if (exists) return prev.filter((c) => c.item.id !== item.id);
      if (prev.length > 0 && prev[0].table !== table) {
        toast.error("Solo podés comparar ítems de la misma categoría.");
        return prev;
      }
      if (prev.length >= 3) {
        toast.error("Máximo 3 ítems para comparar.");
        return prev;
      }
      return [...prev, { item, table }];
    });
  }

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

  const q = search.trim().toLowerCase();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar ítem..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={hideOutOfStock} onCheckedChange={(v) => setHideOutOfStock(v === true)} />
          Ocultar sin stock
        </label>
      </div>
      <Tabs defaultValue="weapons">
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.table} value={t.table}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map(({ table }) => {
          const visible = data[table].filter(
            (item) =>
              (!q || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)) &&
              (!hideOutOfStock || item.stock > 0)
          );
          return (
            <TabsContent key={table} value={table} className="flex flex-col gap-6">
              {visible.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {data[table].length === 0 ? "Sin ítems cargados todavía." : "Nada coincide con el filtro."}
                </p>
              ) : (
                groupByCategory(visible).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="font-heading mb-3 text-sm text-muted-foreground">{category}</h3>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {items.map((item) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          table={table}
                          balance={balance}
                          canBuy={canBuy}
                          myRankSortOrder={myRankSortOrder}
                          comparing={compareItems.some((c) => c.item.id === item.id)}
                          onToggleCompare={() => toggleCompare(item, table)}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {compareItems.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border/60 bg-popover px-4 py-2 shadow-lg">
          <span className="text-sm text-muted-foreground">{compareItems.length} seleccionado{compareItems.length === 1 ? "" : "s"}</span>
          <Button size="sm" disabled={compareItems.length < 2} onClick={() => setCompareOpen(true)}>
            Comparar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setCompareItems([])}>
            Limpiar
          </Button>
        </div>
      )}

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comparar ítems</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <UITable>
              <TableHeader>
                <TableRow>
                  <TableHead>Campo</TableHead>
                  {compareItems.map((c) => (
                    <TableHead key={c.item.id}>{c.item.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-muted-foreground">Categoría</TableCell>
                  {compareItems.map((c) => (
                    <TableCell key={c.item.id}>{c.item.category}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">Precio</TableCell>
                  {compareItems.map((c) => (
                    <TableCell key={c.item.id} className="font-medium text-gocs-red">
                      {formatCredits(c.item.price)}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">Capacidad</TableCell>
                  {compareItems.map((c) => (
                    <TableCell key={c.item.id}>
                      {"capacity" in c.item && c.item.capacity ? c.item.capacity : "—"}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">Cargador estándar</TableCell>
                  {compareItems.map((c) => (
                    <TableCell key={c.item.id}>
                      {"mag_price_standard" in c.item && c.item.mag_price_standard
                        ? formatCredits(c.item.mag_price_standard)
                        : "—"}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">Cargador especial</TableCell>
                  {compareItems.map((c) => (
                    <TableCell key={c.item.id}>
                      {"mag_price_special" in c.item && c.item.mag_price_special
                        ? formatCredits(c.item.mag_price_special)
                        : "—"}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">Rango mínimo</TableCell>
                  {compareItems.map((c) => (
                    <TableCell key={c.item.id}>
                      {"min_rank_sort_order" in c.item && c.item.min_rank_sort_order != null
                        ? `Nivel ${c.item.min_rank_sort_order}`
                        : "Ninguno"}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">Stock</TableCell>
                  {compareItems.map((c) => (
                    <TableCell key={c.item.id}>{c.item.stock}</TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </UITable>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ItemCard({
  item,
  table,
  balance,
  canBuy,
  myRankSortOrder,
  comparing,
  onToggleCompare,
}: {
  item: CatalogItem | Vehicle;
  table: Table;
  balance: number;
  canBuy: boolean;
  myRankSortOrder: number;
  comparing: boolean;
  onToggleCompare: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const magStd = "mag_price_standard" in item ? item.mag_price_standard : null;
  const magSpecial = "mag_price_special" in item ? item.mag_price_special : null;
  const capacity = "capacity" in item ? item.capacity : null;
  const minRank = "min_rank_sort_order" in item ? item.min_rank_sort_order : null;

  const affordable = balance >= item.price;
  const rankOk = minRank == null || myRankSortOrder >= minRank;
  const inStock = item.stock > 0;
  const lowStock = inStock && item.stock <= LOW_STOCK_THRESHOLD;
  const now = useNow();
  const isNew = now - new Date(item.created_at).getTime() < NEW_ITEM_WINDOW_MS;
  const disabled = pending || !canBuy || !inStock || !affordable || !rankOk;

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
    <Card className="overflow-hidden">
      {item.image_url ? (
        <div className="relative aspect-[16/9] w-full bg-muted/30">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-contain p-3"
            unoptimized
          />
        </div>
      ) : (
        <div className="flex aspect-[16/9] w-full items-center justify-center bg-muted/20 text-xs text-muted-foreground">
          Sin imagen
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm font-medium leading-snug">{item.name}</CardTitle>
            {isNew && (
              <Badge className="bg-emerald-500/15 text-emerald-400 shrink-0" variant="secondary">
                Nuevo
              </Badge>
            )}
          </div>
          <Badge
            variant={inStock ? "secondary" : "outline"}
            className={`shrink-0 ${lowStock ? "bg-amber-500/15 text-amber-400" : ""}`}
          >
            {inStock ? (lowStock ? `Últimas unidades (${item.stock})` : `Disponible (${item.stock})`) : "Sin stock"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="font-heading text-lg text-gocs-red">{formatCredits(item.price)}</p>
        {capacity && <p className="text-xs text-muted-foreground">{capacity}</p>}
        {(magStd || magSpecial) && (
          <p className="text-xs text-muted-foreground">
            Cargador: {magStd ? formatCredits(magStd) : "—"} · Especial:{" "}
            {magSpecial ? formatCredits(magSpecial) : "—"}
          </p>
        )}
        {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Checkbox checked={comparing} onCheckedChange={onToggleCompare} />
          Comparar
        </label>
        {!rankOk && (
          <p className="text-xs text-destructive">🔒 Requiere un rango más alto para comprar.</p>
        )}
        <Button
          size="sm"
          className={
            inStock && affordable && canBuy && rankOk
              ? "mt-2 bg-emerald-600 text-white hover:bg-emerald-500"
              : "mt-2"
          }
          disabled={disabled}
          onClick={handleBuy}
          title={
            !inStock
              ? "Sin stock disponible"
              : !affordable
                ? "Saldo insuficiente"
                : !rankOk
                  ? "Rango insuficiente"
                  : undefined
          }
        >
          {pending
            ? "Comprando..."
            : !inStock
              ? "Sin stock"
              : !rankOk
                ? "Rango insuficiente"
                : "Comprar"}
        </Button>
      </CardContent>
    </Card>
  );
}
