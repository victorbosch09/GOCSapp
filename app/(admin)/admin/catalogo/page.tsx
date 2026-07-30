import type { Metadata } from "next";
import { getFullCatalog } from "@/lib/data/catalog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CatalogEditor } from "@/components/admin/catalog-editor";

export const metadata: Metadata = { title: "Catálogo — Mando G.O.C.S." };

export default async function AdminCatalogoPage() {
  const catalog = await getFullCatalog();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Catálogo de tienda</h1>
        <p className="text-muted-foreground">
          Los cambios se reflejan en vivo en la tienda de todos los soldados conectados.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Precio y disponibilidad</CardTitle>
          <CardDescription>Editá el precio o marcá stock por ítem.</CardDescription>
        </CardHeader>
        <CardContent>
          <CatalogEditor data={catalog} />
        </CardContent>
      </Card>
    </div>
  );
}
