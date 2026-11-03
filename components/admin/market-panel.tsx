"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { buyFromMarket, createMarketItem } from "@/lib/actions/admin";
import { formatCredits } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Plus, Clock } from "lucide-react";
import type { MarketItem } from "@/types/database";

type StoreItem = { id: string; name: string; category: string; table: "weapons" | "equipment" | "accessories" | "vehicles" };

type Purchase = {
  id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  created_at: string;
  notes: string | null;
  market_item: { name: string; category: string } | null;
};

export function MarketPanel({
  marketItems,
  purchases,
  storeItems,
}: {
  marketItems: MarketItem[];
  purchases: Purchase[];
  storeItems: StoreItem[];
}) {
  const categories = Array.from(new Set(marketItems.map((i) => i.category))).sort();

  const weeklyTotal = purchases
    .filter((p) => {
      const d = new Date(p.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    })
    .reduce((s, p) => s + p.total_cost, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="stat-tile">
          <p className="stat-tile-label">Ítems en mercado</p>
          <p className="stat-tile-value">{marketItems.length}</p>
        </div>
        <div className="stat-tile">
          <p className="stat-tile-label">Compras (7 días)</p>
          <p className="stat-tile-value">{purchases.filter((p) => {
            const d = new Date(p.created_at);
            const w = new Date(); w.setDate(w.getDate() - 7);
            return d >= w;
          }).length}</p>
        </div>
        <div className="stat-tile col-span-2 sm:col-span-1">
          <p className="stat-tile-label">Gasto (7 días)</p>
          <p className="stat-tile-value text-destructive">{formatCredits(weeklyTotal)}</p>
        </div>
      </div>

      <Tabs defaultValue={categories[0] ?? "all"}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList className="flex-wrap h-auto gap-1">
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {cat} ({marketItems.filter((i) => i.category === cat).length})
              </TabsTrigger>
            ))}
            <TabsTrigger value="historial">
              <Clock size={13} className="mr-1" />Historial
            </TabsTrigger>
          </TabsList>
          <AddMarketItemDialog />
        </div>

        {categories.map((cat) => (
          <TabsContent key={cat} value={cat}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {marketItems
                .filter((i) => i.category === cat)
                .map((item) => (
                  <MarketItemCard key={item.id} item={item} storeItems={storeItems} />
                ))}
            </div>
          </TabsContent>
        ))}

        <TabsContent value="historial">
          <div className="flex flex-col gap-2">
            {purchases.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin compras registradas todavía.</p>
            ) : (
              purchases.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{p.market_item?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.market_item?.category} · x{p.quantity} · {new Date(p.created_at).toLocaleDateString("es")}
                    </p>
                    {p.notes && <p className="text-xs text-muted-foreground italic">{p.notes}</p>}
                  </div>
                  <span className="font-heading text-sm text-destructive">−{formatCredits(p.total_cost)}</span>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MarketItemCard({ item, storeItems }: { item: MarketItem; storeItems: StoreItem[] }) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState("1");
  const [targetItemId, setTargetItemId] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const selectedStore = storeItems.find((s) => s.id === targetItemId);
  const total = Number(qty) * item.unit_cost;

  function submit() {
    const q = Math.floor(Number(qty));
    if (!q || q < 1) { toast.error("Cantidad inválida."); return; }
    startTransition(async () => {
      const result = await buyFromMarket({
        marketItemId: item.id,
        quantity: q,
        targetTable: selectedStore?.table ?? null,
        targetItemId: selectedStore?.id ?? null,
      });
      if (result?.error) toast.error(result.error);
      else {
        toast.success(`Compra realizada: ${item.name} x${q} — ${formatCredits(total)} descontados de tesorería.`);
        setOpen(false);
        setQty("1");
        setTargetItemId("");
      }
    });
  }

  return (
    <div className="card-tactical p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-sm leading-tight">{item.name}</p>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{item.description}</p>
          )}
        </div>
        {!item.in_stock && <Badge variant="outline" className="text-destructive shrink-0">Agotado</Badge>}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Precio unitario</p>
          <p className="font-heading text-lg text-primary">{formatCredits(item.unit_cost)}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={!item.in_stock} className="gap-1.5">
              <ShoppingCart size={13} /> Comprar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Comprar — {item.name}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm">
                <p className="text-muted-foreground">Precio unitario mayorista</p>
                <p className="font-heading text-xl text-primary">{formatCredits(item.unit_cost)}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Cantidad a comprar</Label>
                <Input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-32"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Vincular a ítem de la tienda (opcional)</Label>
                <p className="text-xs text-muted-foreground">Si seleccionás un ítem, su stock se incrementa automáticamente.</p>
                <Select value={targetItemId} onValueChange={setTargetItemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin vincular (solo registra compra)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="">Sin vincular</SelectItem>
                    {storeItems.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        [{s.table}] {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                <p className="text-xs text-muted-foreground">Total a descontar de tesorería</p>
                <p className="font-heading text-2xl text-destructive">{formatCredits(total)}</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={pending || !Number(qty) || Number(qty) < 1}>
                {pending ? "Procesando..." : `Confirmar compra — ${formatCredits(total)}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function AddMarketItemDialog() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    const c = Number(cost);
    if (!category.trim() || !name.trim() || !c || c < 1) {
      toast.error("Completá categoría, nombre y precio.");
      return;
    }
    startTransition(async () => {
      const result = await createMarketItem({ category, name, description, unit_cost: c });
      if (result?.error) toast.error(result.error);
      else {
        toast.success(`"${name}" agregado al mercado.`);
        setCategory(""); setName(""); setDescription(""); setCost("");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Plus size={13} /> Nuevo ítem en mercado
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Agregar ítem al mercado</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label className="mb-1.5 block text-xs">Categoría</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ej: Fusiles" /></div>
            <div><Label className="mb-1.5 block text-xs">Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          </div>
          <div><Label className="mb-1.5 block text-xs">Descripción (opcional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div><Label className="mb-1.5 block text-xs">Precio unitario (cr)</Label>
            <Input type="number" min={1} value={cost} onChange={(e) => setCost(e.target.value)} className="w-40" /></div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending}>{pending ? "Agregando..." : "Agregar al mercado"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
