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
  createStoreSection,
  deleteStoreSection,
  createStoreSectionItem,
  updateStoreSectionItem,
  deleteStoreSectionItem,
} from "@/lib/actions/admin";
import { resizeToRectPng } from "@/lib/resize-image";
import { useConfirm } from "@/components/ui/confirm-provider";
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
import { Plus, Trash2 } from "lucide-react";
import type { CatalogItem, LicenseKey, Rank, Vehicle, StoreSection, StoreSectionItem } from "@/types/database";

const LICENSE_OPTIONS: { value: LicenseKey | "none"; label: string }[] = [
  { value: "none", label: "Sin licencia" },
  { value: "ropa", label: "Licencia de Ropa" },
  { value: "accesorios", label: "Licencia de Accesorios" },
  { value: "accesorios_ropa", label: "Licencia de Accesorios de Ropa" },
];

type Table_ = "weapons" | "equipment" | "accessories" | "vehicles";

const TABS: { table: Table_; label: string }[] = [
  { table: "weapons", label: "Armamento" },
  { table: "equipment", label: "Equipamiento" },
  { table: "accessories", label: "Accesorios" },
  { table: "vehicles", label: "Vehículos" },
];

type CustomSectionWithItems = StoreSection & { items: StoreSectionItem[] };

export function CatalogEditor({
  data,
  ranks,
  customSections = [],
}: {
  data: Record<Table_, (CatalogItem | Vehicle)[]>;
  ranks: Rank[];
  customSections?: CustomSectionWithItems[];
}) {
  const [newSectionOpen, setNewSectionOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [pending, startTransition] = useTransition();

  function submitNewSection() {
    if (!newSectionName.trim()) { toast.error("Nombre de sección requerido."); return; }
    startTransition(async () => {
      const result = await createStoreSection(newSectionName.trim());
      if (result?.error) toast.error(result.error);
      else { toast.success(`Sección "${newSectionName}" creada.`); setNewSectionName(""); setNewSectionOpen(false); }
    });
  }

  return (
    <Tabs defaultValue="weapons">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <TabsList className="flex-wrap h-auto gap-1">
          {TABS.map((t) => (
            <TabsTrigger key={t.table} value={t.table}>
              {t.label} ({data[t.table].length})
            </TabsTrigger>
          ))}
          {customSections.map((s) => (
            <TabsTrigger key={s.id} value={s.id}>
              {s.name} ({s.items.length})
            </TabsTrigger>
          ))}
        </TabsList>
        {/* Nueva sección */}
        {newSectionOpen ? (
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              placeholder="Nombre de sección..."
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitNewSection(); if (e.key === "Escape") setNewSectionOpen(false); }}
              className="h-8 w-44 text-sm"
            />
            <Button size="sm" disabled={pending} onClick={submitNewSection}>
              {pending ? "..." : "Crear"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setNewSectionOpen(false)}>Cancelar</Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => setNewSectionOpen(true)}>
            <Plus size={13} /> Nueva sección
          </Button>
        )}
      </div>

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
                    <TableHead className="w-44">Licencia requerida</TableHead>
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

      {customSections.map((section) => (
        <TabsContent key={section.id} value={section.id} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <NewCustomItemDialog sectionId={section.id} sectionName={section.name} />
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive gap-1.5"
              onClick={async () => {
                if (!confirm(`¿Eliminar la sección "${section.name}" y todos sus ítems?`)) return;
                startTransition(async () => {
                  const result = await deleteStoreSection(section.id);
                  if (result?.error) toast.error(result.error);
                  else toast.success(`Sección "${section.name}" eliminada.`);
                });
              }}
            >
              <Trash2 size={13} /> Eliminar sección
            </Button>
          </div>
          {section.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin ítems en esta sección.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="w-28">Precio (cr)</TableHead>
                    <TableHead className="w-24">Stock</TableHead>
                    <TableHead className="w-44">Rango mínimo</TableHead>
                    <TableHead className="w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.items.map((item) => (
                    <CustomItemRow key={item.id} item={item} ranks={ranks} />
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
  const confirm = useConfirm();

  function save(patch: { price?: number; stock?: number; min_rank_sort_order?: number | null; requires_license_key?: string | null }) {
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
      <TableCell>
        <Select
          value={(item as CatalogItem).requires_license_key ?? "none"}
          onValueChange={(v) =>
            save({ requires_license_key: v === "none" ? null : v })
          }
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue placeholder="Sin licencia" />
          </SelectTrigger>
          <SelectContent>
            {LICENSE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
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
          onClick={async () => {
            if (!(await confirm({ title: `¿Borrar "${item.name}" del catálogo?`, destructive: true }))) return;
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

// ── Custom section components ────────────────────────────────

function NewCustomItemDialog({ sectionId, sectionName }: { sectionId: string; sectionName: string }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() { setCategory(""); setName(""); setPrice(""); setNotes(""); }

  function submit() {
    const parsedPrice = Number(price);
    if (!name.trim() || Number.isNaN(parsedPrice)) {
      toast.error("Completá al menos nombre y precio.");
      return;
    }
    startTransition(async () => {
      const result = await createStoreSectionItem(sectionId, {
        category: category.trim(),
        name: name.trim(),
        price: parsedPrice,
        notes: notes.trim() || null,
      });
      if (result?.error) toast.error(result.error);
      else { toast.success("Ítem agregado."); reset(); setOpen(false); }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus size={13} /> Nuevo ítem en {sectionName}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo ítem — {sectionName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs">Subcategoría (opcional)</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ej: Granadas" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Precio (cr)</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-40" />
          </div>
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

function CustomItemRow({ item, ranks }: { item: StoreSectionItem; ranks: Rank[] }) {
  const [price, setPrice] = useState(String(item.price));
  const [stock, setStock] = useState(String(item.stock));
  const [pending, startTransition] = useTransition();

  function save(patch: Parameters<typeof updateStoreSectionItem>[1]) {
    startTransition(async () => {
      const result = await updateStoreSectionItem(item.id, patch);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <TableRow>
      <TableCell className="text-muted-foreground">{item.category || "—"}</TableCell>
      <TableCell className="font-medium">{item.name}</TableCell>
      <TableCell>
        <Input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={() => { const n = Number(price); if (!Number.isNaN(n) && n !== item.price) save({ price: n }); }}
          className="h-8 w-24"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={0}
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          onBlur={() => { const n = Number(stock); if (Number.isInteger(n) && n >= 0 && n !== item.stock) save({ stock: n }); else setStock(String(item.stock)); }}
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
              <SelectItem key={r.id} value={String(r.sort_order)}>{r.name}+</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => {
            if (!confirm(`¿Borrar "${item.name}"?`)) return;
            startTransition(async () => {
              const result = await deleteStoreSectionItem(item.id);
              if (result?.error) toast.error(result.error);
            });
          }}
        >
          <Trash2 size={13} />
        </Button>
      </TableCell>
    </TableRow>
  );
}
