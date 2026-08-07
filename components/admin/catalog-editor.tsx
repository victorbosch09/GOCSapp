"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  updateCatalogItem,
  uploadItemImage,
  createCatalogItem,
  duplicateCatalogItem,
  deleteCatalogItem,
} from "@/lib/actions/admin";
import { resizeToRectPng } from "@/lib/resize-image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
      {TABS.map(({ table, label }) => (
        <TabsContent key={table} value={table} className="flex flex-col gap-4">
          <NewItemDialog table={table} label={label} />
          {data[table].length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin ítems cargados. Se completa progresivamente desde acá.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Imagen</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="w-28">Precio (cr)</TableHead>
                    <TableHead className="w-24">Stock</TableHead>
                    <TableHead className="w-44">Rango mínimo</TableHead>
                    <TableHead className="w-40">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data[table].map((item) => (
                    <ItemRow key={item.id} item={item} table={table} ranks={ranks} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}

function NewItemDialog({ table, label }: { table: Table_; label: string }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [magStd, setMagStd] = useState("");
  const [magSpecial, setMagSpecial] = useState("");
  const [capacity, setCapacity] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setCategory("");
    setName("");
    setPrice("");
    setMagStd("");
    setMagSpecial("");
    setCapacity("");
    setNotes("");
  }

  function submit() {
    const parsedPrice = Number(price);
    if (!category.trim() || !name.trim() || Number.isNaN(parsedPrice)) {
      toast.error("Completá al menos categoría, nombre y precio.");
      return;
    }
    startTransition(async () => {
      const result = await createCatalogItem(table, {
        category,
        name,
        price: parsedPrice,
        magPriceStandard: magStd ? Number(magStd) : null,
        magPriceSpecial: magSpecial ? Number(magSpecial) : null,
        capacity: capacity || null,
        notes: notes || null,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Ítem agregado con stock 0 — cargá unidades desde la fila.");
        reset();
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="self-start">
          + Nuevo ítem en {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo ítem — {label}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs">Categoría</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ej: Fusiles" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="mb-1.5 block text-xs">Precio (cr)</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            {table !== "vehicles" && (
              <>
                <div>
                  <Label className="mb-1.5 block text-xs">Cargador estándar</Label>
                  <Input type="number" value={magStd} onChange={(e) => setMagStd(e.target.value)} />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs">Cargador especial</Label>
                  <Input type="number" value={magSpecial} onChange={(e) => setMagSpecial(e.target.value)} />
                </div>
              </>
            )}
          </div>
          {table !== "vehicles" && (
            <div>
              <Label className="mb-1.5 block text-xs">Capacidad (ej: 30 car.)</Label>
              <Input value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
          )}
          <div>
            <Label className="mb-1.5 block text-xs">Notas (opcional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Agregando..." : "Agregar al catálogo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ItemRow({ item, table, ranks }: { item: CatalogItem | Vehicle; table: Table_; ranks: Rank[] }) {
  const [price, setPrice] = useState(String(item.price));
  const [stock, setStock] = useState(String(item.stock));
  const [imageUrl, setImageUrl] = useState(item.image_url);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function save(patch: { price?: number; stock?: number; min_rank_sort_order?: number | null }) {
    startTransition(async () => {
      const result = await updateCatalogItem(table, item.id, patch);
      if (result?.error) toast.error(result.error);
    });
  }

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const resized = await resizeToRectPng(file, 800, 450);
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
          className="flex aspect-[16/9] w-20 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-muted/40 text-xs text-muted-foreground hover:border-gocs-red"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Subir imagen (PNG, fondo transparente, se recorta a 16:9)"
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={item.name}
              width={80}
              height={45}
              className="object-contain"
              unoptimized
            />
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
        <Input
          type="number"
          min={0}
          step={1}
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          onBlur={() => {
            const n = Number(stock);
            if (Number.isInteger(n) && n >= 0 && n !== item.stock) save({ stock: n });
            else setStock(String(item.stock));
          }}
          className="h-8 w-20"
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
      <TableCell className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await duplicateCatalogItem(table, item.id);
              if (result?.error) toast.error(result.error);
              else toast.success(`"${item.name}" duplicado (stock 0).`);
            });
          }}
        >
          Duplicar
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => {
            if (!confirm(`¿Borrar "${item.name}" del catálogo?`)) return;
            startTransition(async () => {
              const result = await deleteCatalogItem(table, item.id);
              if (result?.error) toast.error(result.error);
            });
          }}
        >
          Borrar
        </Button>
      </TableCell>
    </TableRow>
  );
}
