"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateCatalogItem } from "@/lib/actions/admin";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CatalogItem, Vehicle } from "@/types/database";

type Table_ = "weapons" | "equipment" | "accessories" | "vehicles";

const TABS: { table: Table_; label: string }[] = [
  { table: "weapons", label: "Armamento" },
  { table: "equipment", label: "Equipamiento" },
  { table: "accessories", label: "Accesorios" },
  { table: "vehicles", label: "Vehículos" },
];

export function CatalogEditor({
  data,
}: {
  data: Record<Table_, (CatalogItem | Vehicle)[]>;
}) {
  return (
    <Tabs defaultValue="weapons">
      <TabsList>
        {TABS.map((t) => (
          <TabsTrigger key={t.table} value={t.table}>
            {t.label} ({data[t.table].length})
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map(({ table }) => (
        <TabsContent key={table} value={table}>
          {data[table].length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin ítems cargados. Se completa progresivamente desde acá.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="w-32">Precio (cr)</TableHead>
                  <TableHead className="w-24">En stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data[table].map((item) => (
                  <ItemRow key={item.id} item={item} table={table} />
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}

function ItemRow({ item, table }: { item: CatalogItem | Vehicle; table: Table_ }) {
  const [price, setPrice] = useState(String(item.price));
  const [inStock, setInStock] = useState(item.in_stock);
  const [, startTransition] = useTransition();

  function save(patch: { price?: number; in_stock?: boolean }) {
    startTransition(async () => {
      const result = await updateCatalogItem(table, item.id, patch);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <TableRow>
      <TableCell className="text-muted-foreground">{item.category}</TableCell>
      <TableCell className="font-medium">{item.name}</TableCell>
      <TableCell>
        <Input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={() => {
            const n = Number(price);
            if (!Number.isNaN(n) && n !== item.price) save({ price: n });
          }}
          className="h-8 w-24"
        />
      </TableCell>
      <TableCell>
        <Switch
          checked={inStock}
          onCheckedChange={(checked) => {
            setInStock(checked);
            save({ in_stock: checked });
          }}
        />
      </TableCell>
    </TableRow>
  );
}
