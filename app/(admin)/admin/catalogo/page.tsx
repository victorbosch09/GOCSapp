import type { Metadata } from "next";
import { getFullCatalog } from "@/lib/data/catalog";
import { getRanks } from "@/lib/data/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CatalogEditor } from "@/components/admin/catalog-editor";

export const metadata: Metadata = { title: "Catálogo — Mando G.O.C.S." };

export default async function AdminCatalogoPage() {
  const [catalog, ranks] = await Promise.all([getFullCatalog(), getRanks()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Catálogo de tienda</h1>
        <p className="text-muted-foreground">
          Los cambios se reflejan en vivo en la tienda de todos los soldados conectados. Las
          imágenes se recortan automáticamente a 512×512 PNG con fondo transparente.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Precio, stock, imagen y rango mínimo</CardTitle>
          <CardDescription>Click en el cuadro de imagen para subir una nueva.</CardDescription>
        </CardHeader>
        <CardContent>
          <CatalogEditor data={catalog} ranks={ranks} />
        </CardContent>
      </Card>
    </div>
  );
}
