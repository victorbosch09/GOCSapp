"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { updateCatalogItem, uploadItemImage } from "@/lib/actions/admin";
import { resizeToSquarePng } from "@/lib/resize-image";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CatalogItem, Rank, Vehicle } from "@/types/database";

type Table_ = "weapons" | "equipment" | "accessories" | "vehicles";

const TABS: { table: Table_; label: string }[] = [
  { table: "weapons", label: "Armamento" },
  { table: "equipment", label: "Equipamiento" },
  { table: "accessories", label: "Accesorios" },
  { table: "vehicles", label: "Vehículos" },
];

export function CatalogEditor({
  data,
  ranks,
}: {
  data: Record<Table_, (CatalogItem | Vehicle)[]>;
  ranks: Rank[];
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
                  <TableHead className="w-16">Imagen</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="w-28">Precio (cr)</TableHead>
                  <TableHead className="w-20">En stock</TableHead>
                  <TableHead className="w-44">Rango mínimo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data[table].map((item) => (
                  <ItemRow key={item.id} item={item} table={table} ranks={ranks} />
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}

function ItemRow({ item, table, ranks }: { item: CatalogItem | Vehicle; table: Table_; ranks: Rank[] }) {
  const [price, setPrice] = useState(String(item.price));
  const [inStock, setInStock] = useState(item.in_stock);
  const [imageUrl, setImageUrl] = useState(item.image_url);
  const [uploading, setUploading] = useState(false);
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function save(patch: { price?: number; in_stock?: boolean; min_rank_sort_order?: number | null }) {
    startTransition(async () => {
      const result = await updateCatalogItem(table, item.id, patch);
      if (result?.error) toast.error(result.error);
    });
  }

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const resized = await resizeToSquarePng(file, 512);
      const formData = new FormData();
      formData.set("table", table);
      formData.set("itemId", item.id);
      formData.set("file", resized);
      const result = await uploadItemImage(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        setImageUrl(URL.createObjectURL(resized));
        toast.success("Imagen actualizada.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo procesar la imagen.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <TableRow>
      <TableCell>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-muted/40 text-xs text-muted-foreground hover:border-gocs-red"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Subir imagen (PNG, fondo transparente)"
        >
          {imageUrl ? (
            <Image src={imageUrl} alt={item.name} width={40} height={40} className="object-contain" unoptimized />
          ) : uploading ? (
            "..."
          ) : (
            "+"
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </TableCell>
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
      <TableCell>
        <Select
          value={item.min_rank_sort_order != null ? String(item.min_rank_sort_order) : "none"}
          onValueChange={(v) => save({ min_rank_sort_order: v === "none" ? null : Number(v) })}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue placeholder="Sin restricción" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin restricción</SelectItem>
            {ranks.map((r) => (
              <SelectItem key={r.id} value={String(r.sort_order)}>
                {r.name}+
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
}
